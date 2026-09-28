import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './config';
import { generateRandomCode } from '../utils/codeGenerator';
import {
  getMockCards,
  saveMockCards,
  getMockUsers,
  saveMockUsers,
} from './mockData';

/**
 * Check if a 6-character code already exists in Firestore or Mock data
 */
export async function checkCodeExists(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return false;

  if (isConfigured && db) {
    const cardRef = doc(db, 'cards', cleanCode);
    const snap = await getDoc(cardRef);
    return snap.exists();
  }

  const cards = getMockCards();
  return cards.some((c) => c.code.toUpperCase() === cleanCode);
}

/**
 * Generate a new blank NFC/QR Card with guaranteed unique 6-character alphanumeric code
 */
export async function generateCard({ user, profile }) {
  const uid = user.uid;
  const name = profile?.displayName || profile?.email || 'User';

  let attempts = 0;
  let code = '';
  let exists = true;

  // Strict collision check loop: ensures no code is ever duplicated
  while (exists && attempts < 25) {
    code = generateRandomCode(6);
    exists = await checkCodeExists(code);
    attempts++;
  }

  if (exists) {
    throw new Error('Collision check failed: could not generate a unique code after multiple attempts. Please try again.');
  }

  const cardData = {
    code,
    status: 'unassigned',
    createdBy: uid,
    createdByName: name,
  };

  if (isConfigured && db) {
    const cardRef = doc(db, 'cards', code);
    await setDoc(cardRef, {
      ...cardData,
      createdAt: serverTimestamp(),
    });

    return {
      ...cardData,
      createdAt: new Date().toISOString(),
    };
  }

  // Mock Mode:
  const cards = getMockCards();
  const mockCard = {
    ...cardData,
    createdAt: new Date().toISOString(),
  };

  cards.unshift(mockCard);
  saveMockCards(cards);
  window.dispatchEvent(new Event('b1_mock_cards_updated'));
  return mockCard;
}

/**
 * Generate a bulk batch of unique blank NFC/QR cards using atomic Firestore batch write
 */
export async function generateBatchCards({ count = 5, user, profile }) {
  const uid = user.uid;
  const name = profile?.displayName || profile?.email || 'User';
  const targetCount = Math.min(Math.max(1, count), 100);

  const uniqueCodes = new Set();
  let attempts = 0;
  const maxAttempts = targetCount * 30;

  // Ensure all codes are completely unique and not in Firestore
  while (uniqueCodes.size < targetCount && attempts < maxAttempts) {
    attempts++;
    const candidate = generateRandomCode(6);
    if (uniqueCodes.has(candidate)) continue;

    const alreadyExists = await checkCodeExists(candidate);
    if (!alreadyExists) {
      uniqueCodes.add(candidate);
    }
  }

  if (uniqueCodes.size < targetCount) {
    throw new Error(`Could only find ${uniqueCodes.size} unique codes. Please try again with a smaller batch.`);
  }

  const generatedList = Array.from(uniqueCodes).map((code) => ({
    code,
    status: 'unassigned',
    createdBy: uid,
    createdByName: name,
    createdAt: new Date().toISOString(),
  }));

  if (isConfigured && db) {
    const batch = writeBatch(db);
    for (const card of generatedList) {
      const cardRef = doc(db, 'cards', card.code);
      batch.set(cardRef, {
        code: card.code,
        status: card.status,
        createdBy: card.createdBy,
        createdByName: card.createdByName,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return generatedList;
  }

  // Mock Mode:
  const cards = getMockCards();
  cards.unshift(...generatedList);
  saveMockCards(cards);
  window.dispatchEvent(new Event('b1_mock_cards_updated'));
  return generatedList;
}

/**
 * Fetch a single card by 6-character code
 */
export async function getCard(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  if (isConfigured && db) {
    const cardRef = doc(db, 'cards', cleanCode);
    const snap = await getDoc(cardRef);
    if (!snap.exists()) return null;
    return { code: cleanCode, ...snap.data() };
  }

  // Mock Mode:
  const cards = getMockCards();
  const found = cards.find((c) => c.code.toUpperCase() === cleanCode);
  return found ? { ...found } : null;
}

/**
 * Delete a blank unassigned card (or any card if admin)
 */
export async function deleteCard(code, { user, profile }) {
  const cleanCode = (code || '').trim().toUpperCase();
  const isAdmin = profile?.role === 'admin';

  const card = await getCard(cleanCode);
  if (!card) {
    throw new Error(`Card ${cleanCode} does not exist.`);
  }

  // Permission check: active cards can only be deleted by admin; unassigned cards can be deleted by admin or creator
  if (card.status === 'assigned' && !isAdmin) {
    throw new Error('Only administrators can delete active assigned cards.');
  }

  if (!isAdmin && card.createdBy !== user?.uid) {
    throw new Error('You do not have permission to delete this card.');
  }

  if (isConfigured && db) {
    const cardRef = doc(db, 'cards', cleanCode);
    await deleteDoc(cardRef);
    return true;
  }

  // Mock Mode:
  const cards = getMockCards();
  const updated = cards.filter((c) => c.code.toUpperCase() !== cleanCode);
  saveMockCards(updated);
  window.dispatchEvent(new Event('b1_mock_cards_updated'));
  return true;
}

/**
 * Assign or update a card:
 * - Any approved user can assign an UNASSIGNED card (storing who created and who assigned).
 * - Only ADMIN can update/edit an already ASSIGNED (active) card!
 */
export async function assignCard(code, formData, { user, profile }) {
  const cleanCode = (code || '').trim().toUpperCase();
  const uid = user.uid;
  const name = profile?.displayName || profile?.email || 'User';
  const isAdmin = profile?.role === 'admin';

  const existingCard = await getCard(cleanCode);
  if (!existingCard) {
    throw new Error(`Card "${cleanCode}" does not exist in the database.`);
  }

  // REQUIREMENT 4: If already assigned, ONLY admin can update it!
  if (existingCard.status === 'assigned' && !isAdmin) {
    throw new Error('This card is already active. Only an administrator can update an active QR card.');
  }

  let destinationUrl = formData.url.trim();
  if (!/^https?:\/\//i.test(destinationUrl)) {
    destinationUrl = 'https://' + destinationUrl;
  }

  // Preserve existing createdBy and createdByName
  const updatePayload = {
    status: 'assigned',
    businessName: formData.businessName.trim(),
    customerName: formData.customerName.trim(),
    phone: formData.phone.trim(),
    dateSold: formData.dateSold || new Date().toISOString().split('T')[0],
    url: destinationUrl,
    assignedBy: existingCard.status === 'assigned' && existingCard.assignedBy ? existingCard.assignedBy : uid,
    assignedByName: existingCard.status === 'assigned' && existingCard.assignedByName ? existingCard.assignedByName : name,
    assignedAt: existingCard.status === 'assigned' && existingCard.assignedAt ? existingCard.assignedAt : (isConfigured && db ? serverTimestamp() : new Date().toISOString()),
    // If admin is editing an existing assignment, record last edited info
    ...(existingCard.status === 'assigned' && {
      lastUpdatedBy: uid,
      lastUpdatedByName: name,
      lastUpdatedAt: isConfigured && db ? serverTimestamp() : new Date().toISOString(),
    }),
  };

  if (isConfigured && db) {
    const cardRef = doc(db, 'cards', cleanCode);
    await updateDoc(cardRef, updatePayload);
    return { ...existingCard, ...updatePayload };
  }

  // Mock Mode:
  const cards = getMockCards();
  const index = cards.findIndex((c) => c.code.toUpperCase() === cleanCode);
  if (index === -1) {
    throw new Error(`Card ${cleanCode} does not exist.`);
  }

  cards[index] = {
    ...cards[index],
    ...updatePayload,
  };
  saveMockCards(cards);
  window.dispatchEvent(new Event('b1_mock_cards_updated'));
  return cards[index];
}

/**
 * Real-time subscription to cards list
 */
export function subscribeToCards({ user, profile }, callback) {
  if (isConfigured && db) {
    const cardsColl = collection(db, 'cards');
    const q = query(cardsColl, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          code: d.id,
          ...d.data(),
        }));
        callback(list);
      },
      (error) => {
        console.error('Firestore subscribe cards error:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Mock Mode:
  const emitCards = () => {
    callback(getMockCards());
  };

  emitCards();
  window.addEventListener('b1_mock_cards_updated', emitCards);
  return () => window.removeEventListener('b1_mock_cards_updated', emitCards);
}

/**
 * Real-time subscription to users list (Admin only)
 */
export function subscribeToUsers(callback) {
  if (isConfigured && db) {
    const usersColl = collection(db, 'users');
    const q = query(usersColl, orderBy('requestedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        }));
        callback(list);
      },
      (error) => {
        console.error('Firestore subscribe users error:', error);
        callback([]);
      }
    );
  }

  // Mock Mode:
  const emitUsers = () => {
    callback(getMockUsers());
  };

  emitUsers();
  window.addEventListener('storage', emitUsers);
  window.addEventListener('b1_mock_users_updated', emitUsers);
  return () => {
    window.removeEventListener('storage', emitUsers);
    window.removeEventListener('b1_mock_users_updated', emitUsers);
  };
}

/**
 * Update user status (approve / revoke / pending)
 */
export async function updateUserStatus(uid, status) {
  if (isConfigured && db) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { status });
    return;
  }

  // Mock Mode:
  const users = getMockUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx !== -1) {
    users[idx].status = status;
    saveMockUsers(users);
    window.dispatchEvent(new Event('b1_mock_users_updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Update user role (admin / user)
 */
export async function updateUserRole(uid, role) {
  if (isConfigured && db) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
    return;
  }

  // Mock Mode:
  const users = getMockUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx !== -1) {
    users[idx].role = role;
    saveMockUsers(users);
    window.dispatchEvent(new Event('b1_mock_users_updated'));
    window.dispatchEvent(new Event('storage'));
  }
}
