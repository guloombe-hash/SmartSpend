/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Firebase Initialization
 * ─────────────────────────────────────────────
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants/theme';

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0
  ? initializeApp(FIREBASE_CONFIG)
  : getApps()[0];

// Auth instance
export const auth = getAuth(app);

// Firestore database
export const db = getFirestore(app);

export default app;
