// src/adapters/firebaseInit.ts
// Initializes the Firebase app and exports the Firestore + Auth instances.
// IMPORT RESTRICTION: only src/adapters/firestore.ts may import this file.
// All other code must access Firestore through the adapter, never directly.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const existingApp = getApps()[0];
const app =
  existingApp !== undefined
    ? existingApp
    : initializeApp({
        apiKey: import.meta.env['VITE_FIREBASE_API_KEY'],
        authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'],
        projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'],
        storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'],
        messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
        appId: import.meta.env['VITE_FIREBASE_APP_ID'],
      });

export const db = getFirestore(app);
export const auth = getAuth(app);
