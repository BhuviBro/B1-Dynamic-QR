import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isConfigured } from './config';
import { getMockUsers, saveMockUsers } from './mockData';

const CURRENT_MOCK_USER_KEY = 'b1_current_mock_user';

// Listen to auth state changes and user profile (role + status)
export function subscribeToAuth(callback) {
  if (isConfigured && auth && db) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        callback({ user: null, profile: null, loading: false });
        return;
      }

      // Subscribe to user doc in Firestore to get live status (pending/approved/revoked) & role
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeDoc = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const profile = snap.data();
            callback({
              user: firebaseUser,
              profile: { uid: firebaseUser.uid, ...profile },
              loading: false,
            });
          } else {
            // User exists in Auth but doc not created yet
            callback({
              user: firebaseUser,
              profile: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'user',
                status: 'pending',
              },
              loading: false,
            });
          }
        },
        (error) => {
          console.error('Error listening to user profile doc:', error);
          callback({
            user: firebaseUser,
            profile: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'user',
              status: 'pending',
            },
            loading: false,
          });
        }
      );

      return () => unsubscribeDoc();
    });
  }

  // Fallback Mock Mode:
  const checkMockUser = () => {
    const raw = localStorage.getItem(CURRENT_MOCK_USER_KEY);
    if (!raw) {
      callback({ user: null, profile: null, loading: false });
      return;
    }
    try {
      const user = JSON.parse(raw);
      // Refresh profile from mock users list
      const users = getMockUsers();
      const current = users.find((u) => u.uid === user.uid) || user;
      callback({
        user: { uid: current.uid, email: current.email, displayName: current.displayName },
        profile: current,
        loading: false,
      });
    } catch {
      callback({ user: null, profile: null, loading: false });
    }
  };

  checkMockUser();
  window.addEventListener('storage', checkMockUser);
  return () => window.removeEventListener('storage', checkMockUser);
}

// Sign up new user with email & password, requesting access as pending
export async function signUpUser(email, password, displayName = '') {
  const cleanEmail = email.trim().toLowerCase();

  if (isConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Role initialization: default role is "user" and status is "pending"
    // If it's an designated admin email or explicit first user, can be handled
    const userDocRef = doc(db, 'users', user.uid);
    const profileData = {
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      role: 'user',
      status: 'pending',
      requestedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profileData);
    return { user, profile: profileData };
  }

  // Mock Mode:
  const users = getMockUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const newUid = 'mock_' + Date.now();
  const newProfile = {
    uid: newUid,
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    role: 'user',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  users.push(newProfile);
  saveMockUsers(users);
  localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(newProfile));
  window.dispatchEvent(new Event('storage'));
  return { user: newProfile, profile: newProfile };
}

// Sign in with email and password
export async function signInUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (isConfigured && auth && db) {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userDocRef);

    let profile = null;
    if (snap.exists()) {
      profile = snap.data();
    } else {
      profile = {
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split('@')[0],
        role: 'user',
        status: 'pending',
        requestedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, profile);
    }
    return { user: cred.user, profile };
  }

  // Mock Mode:
  const users = getMockUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!existing) {
    throw new Error('Account not found with this email. Please check or sign up.');
  }

  localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(existing));
  window.dispatchEvent(new Event('storage'));
  return { user: existing, profile: existing };
}

// Mock sign in shortcut (for rapid testing during demo/review)
export function mockQuickSignIn(targetEmail) {
  const users = getMockUsers();
  const found = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (found) {
    localStorage.setItem(CURRENT_MOCK_USER_KEY, JSON.stringify(found));
    window.dispatchEvent(new Event('storage'));
    return found;
  }
  return null;
}

// Sign out
export async function signOutUser() {
  if (isConfigured && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(CURRENT_MOCK_USER_KEY);
    window.dispatchEvent(new Event('storage'));
  }
}
