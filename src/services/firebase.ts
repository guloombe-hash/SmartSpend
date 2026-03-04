/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Firebase Initialization
 * ─────────────────────────────────────────────
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants/theme';

const hasValidConfig = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

// Initialize Firebase (prevent duplicate initialization)
const app = hasValidConfig
  ? (getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0])
  : null;

// Auth & Firestore instances (null when Firebase is not configured)
export const auth = app ? getAuth(app) : (null as any);
export const db = app ? getFirestore(app) : (null as any);

export const isFirebaseConfigured = hasValidConfig;

export default app;
