import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if credentials are supplied via Vite environment variables or localStorage
function getRawConfig() {
  const customConfigStr = localStorage.getItem('b1_firebase_custom_config');
  if (customConfigStr) {
    try {
      const parsed = JSON.parse(customConfigStr);
      if (parsed.apiKey && parsed.projectId) {
        return { config: parsed, source: 'localStorage' };
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const hasEnvKeys =
    Boolean(envConfig.apiKey) &&
    envConfig.apiKey !== 'your_api_key_here' &&
    Boolean(envConfig.projectId);

  if (hasEnvKeys) {
    return { config: envConfig, source: 'env' };
  }

  return { config: null, source: 'none' };
}

const { config: firebaseConfig, source: configSource } = getRawConfig();

let app = null;
let auth = null;
let db = null;
let isConfigured = false;

if (firebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
  } catch (error) {
    console.warn('Firebase initialization warning:', error.message);
  }
}

export { app, auth, db, isConfigured, configSource };

export function saveCustomFirebaseConfig(configObj) {
  try {
    localStorage.setItem('b1_firebase_custom_config', JSON.stringify(configObj));
    window.location.reload();
  } catch (e) {
    console.error('Failed to save Firebase config to storage', e);
  }
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem('b1_firebase_custom_config');
  window.location.reload();
}
