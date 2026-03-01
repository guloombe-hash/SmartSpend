/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Firestore Sync Service
 *
 * Handles reading/writing user data to Firestore.
 * ─────────────────────────────────────────────
 */

import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, GoalTemplate } from '../types';

const USERS_COLLECTION = 'users';
const MAX_SCAN_HISTORY = 50;

// ─── Save user data to Firestore ───
export async function syncUserToFirestore(uid: string, userData: User): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    // Limit scan history to prevent document size issues
    const dataToSync = {
      ...userData,
      scanHistory: userData.scanHistory.slice(0, MAX_SCAN_HISTORY),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, dataToSync, { merge: true });
    console.log('[FirebaseSync] User data synced');
  } catch (error: any) {
    console.warn('[FirebaseSync] Sync failed:', error.message);
  }
}

// ─── Load user data from Firestore ───
export async function loadUserFromFirestore(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      console.log('[FirebaseSync] No user document found');
      return null;
    }

    const data = snapshot.data() as User;
    console.log('[FirebaseSync] User data loaded');
    return data;
  } catch (error: any) {
    console.warn('[FirebaseSync] Load failed:', error.message);
    return null;
  }
}

// ─── Real-time listener for user data changes ───
export function onUserDataChanged(
  uid: string,
  callback: (data: User | null) => void
): Unsubscribe {
  const userRef = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as User);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('[FirebaseSync] Listener error:', error.message);
    }
  );
}

// ─── Create initial user document ───
export async function createUserDocument(
  uid: string,
  name: string,
  email: string
): Promise<User> {
  const newUser: User = {
    id: uid,
    name,
    email,
    createdAt: new Date().toISOString(),
    monthlyBudget: 3000,
    spent: 0,
    goals: [],
    scanHistory: [],
  };

  await syncUserToFirestore(uid, newUser);
  return newUser;
}

// ═════════════════════════════════════════════
// Goal Templates — Firestore CRUD
// ═════════════════════════════════════════════

const TEMPLATES_COLLECTION = 'goalTemplates';

// ─── Load all goal templates (sorted by copiedCount desc) ───
export async function loadGoalTemplates(): Promise<GoalTemplate[]> {
  try {
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      orderBy('copiedCount', 'desc')
    );
    const snapshot = await getDocs(q);
    const templates: GoalTemplate[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<GoalTemplate, 'id'>),
      id: d.id,
    }));
    console.log(`[FirebaseSync] Loaded ${templates.length} goal templates`);
    return templates;
  } catch (error: any) {
    console.warn('[FirebaseSync] Load templates failed:', error.message);
    return [];
  }
}

// ─── Publish a new goal template ───
export async function publishGoalTemplate(
  template: Omit<GoalTemplate, 'id'>
): Promise<GoalTemplate> {
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), template);
  console.log('[FirebaseSync] Template published:', docRef.id);
  return { ...template, id: docRef.id };
}

// ─── Increment copy count (atomic) ───
export async function incrementCopyCount(templateId: string): Promise<void> {
  try {
    const ref = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(ref, { copiedCount: increment(1) });
  } catch (error: any) {
    console.warn('[FirebaseSync] Increment copy failed:', error.message);
  }
}

// ─── Toggle like (add/remove uid from likedBy array) ───
export async function toggleLike(
  templateId: string,
  uid: string,
  isLiked: boolean
): Promise<void> {
  try {
    const ref = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(ref, {
      likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
    });
  } catch (error: any) {
    console.warn('[FirebaseSync] Toggle like failed:', error.message);
  }
}

// ─── Seed default templates (only if collection is empty) ───
const DEFAULT_TEMPLATES: Omit<GoalTemplate, 'id'>[] = [
  {
    authorId: 'system',
    authorName: 'Alex K.',
    title: 'Tokyo Trip Fund',
    icon: '🗼',
    skippedItem: 'Impulse Amazon purchases',
    investedIn: 'Japan travel',
    targetAmount: 4500,
    story: 'Skipped 3 Amazon purchases a week for 8 months. Finally booked my flight!',
    copiedCount: 1247,
    likedBy: [],
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    authorId: 'system',
    authorName: 'Maya R.',
    title: 'MacBook Pro Fund',
    icon: '💻',
    skippedItem: 'Daily Starbucks',
    investedIn: 'New laptop for freelancing',
    targetAmount: 2499,
    story: 'Every time I skipped a $7 latte, I moved it here. 14 months later...',
    copiedCount: 892,
    likedBy: [],
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    authorId: 'system',
    authorName: 'Jordan T.',
    title: 'Emergency Fund',
    icon: '🛡️',
    skippedItem: 'Eating out for lunch',
    investedIn: '3-month safety net',
    targetAmount: 5000,
    story: 'Brought lunch from home instead of spending $15 daily. Saved $3k in 7 months.',
    copiedCount: 2103,
    likedBy: [],
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    authorId: 'system',
    authorName: 'Sam W.',
    title: 'Gym Equipment',
    icon: '🏋️',
    skippedItem: 'Gaming microtransactions',
    investedIn: 'Home gym setup',
    targetAmount: 800,
    story: 'Cancelled my FIFA Ultimate Team habit. Got a power rack in 4 months.',
    copiedCount: 445,
    likedBy: [],
    createdAt: '2025-09-10T00:00:00Z',
  },
];

export async function seedDefaultTemplates(): Promise<GoalTemplate[]> {
  try {
    const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    if (!snapshot.empty) {
      console.log('[FirebaseSync] Templates already exist, skipping seed');
      return [];
    }

    console.log('[FirebaseSync] Seeding default templates...');
    const seeded: GoalTemplate[] = [];
    for (const t of DEFAULT_TEMPLATES) {
      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), t);
      seeded.push({ ...t, id: docRef.id });
    }
    console.log(`[FirebaseSync] Seeded ${seeded.length} templates`);
    return seeded;
  } catch (error: any) {
    console.warn('[FirebaseSync] Seed failed:', error.message);
    return [];
  }
}
