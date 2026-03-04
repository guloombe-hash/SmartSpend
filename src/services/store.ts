/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Global State (Zustand + Persist)
 * ─────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Product, User, UserGoal, ScanHistoryItem, GoalTemplate } from '../types';
import { lookupProduct } from '../services/productLookup';
import { lookupProductByURL } from '../services/urlLookup';
import { lookupProductByPhoto } from '../services/photoLookup';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  syncUserToFirestore,
  loadUserFromFirestore,
  createUserDocument,
  loadGoalTemplates,
  publishGoalTemplate,
  incrementCopyCount,
  toggleLike,
  seedDefaultTemplates,
} from '../services/firebaseSync';

// Debounce timer for Firestore sync
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000;

function debouncedSync(uid: string, userData: User) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncUserToFirestore(uid, userData);
  }, SYNC_DEBOUNCE_MS);
}

const DEFAULT_USER: User = {
  id: '',
  name: '',
  monthlyBudget: 3000,
  spent: 0,
  goals: [],
  scanHistory: [],
};

interface AppState {
  // Auth
  authUser: FirebaseUser | null;
  isAuthLoading: boolean;
  isAuthInitialized: boolean;

  // User
  user: User;

  // Scan state (not persisted)
  isScanning: boolean;
  scanError: string | null;
  currentProduct: Product | null;

  // Social / Goal Templates
  goalTemplates: GoalTemplate[];
  isLoadingTemplates: boolean;

  // Auth Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  skipLogin: () => void;
  initAuthListener: () => () => void;

  // Scan Actions
  scanBarcode: (upc: string) => Promise<void>;
  scanURL: (url: string) => Promise<void>;
  scanPhoto: (imageUri: string) => Promise<void>;
  clearScan: () => void;
  recordDecision: (decision: 'bought' | 'skipped') => void;

  // Goal & Budget Actions
  addGoal: (goal: Omit<UserGoal, 'id' | 'createdAt'>) => void;
  updateGoalProgress: (goalId: string, amount: number) => void;
  updateBudget: (amount: number) => void;
  resetMonthlySpent: () => void;

  // Social / Template Actions
  loadTemplates: () => Promise<void>;
  publishTemplate: (data: Omit<GoalTemplate, 'id' | 'copiedCount' | 'likedBy' | 'createdAt' | 'authorId' | 'authorName'>) => Promise<void>;
  copyTemplate: (template: GoalTemplate) => void;
  toggleTemplateLike: (templateId: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Initial State ───
      authUser: null,
      isAuthLoading: false,
      isAuthInitialized: false,

      user: DEFAULT_USER,

      isScanning: false,
      scanError: null,
      currentProduct: null,

      goalTemplates: [],
      isLoadingTemplates: false,

      // ─── Auth: Listen for auth state changes ───
      initAuthListener: () => {
        if (!isFirebaseConfigured) {
          set({ isAuthInitialized: true });
          return () => {};
        }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in — load data from Firestore
            const firestoreData = await loadUserFromFirestore(firebaseUser.uid);

            if (firestoreData) {
              set({
                authUser: firebaseUser,
                user: firestoreData,
                isAuthInitialized: true,
              });
            } else {
              // First login (e.g., social login) — create user document
              const newUser = await createUserDocument(
                firebaseUser.uid,
                firebaseUser.displayName || 'User',
                firebaseUser.email || ''
              );
              set({
                authUser: firebaseUser,
                user: newUser,
                isAuthInitialized: true,
              });
            }
          } else {
            // User is signed out
            set({
              authUser: null,
              user: DEFAULT_USER,
              isAuthInitialized: true,
            });
          }
        });

        return unsubscribe;
      },

      // ─── Auth: Email Sign In ───
      signIn: async (email: string, password: string) => {
        set({ isAuthLoading: true });
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } finally {
          set({ isAuthLoading: false });
        }
      },

      // ─── Auth: Email Sign Up ───
      signUp: async (email: string, password: string, name: string) => {
        set({ isAuthLoading: true });
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(credential.user, { displayName: name });
          // Create Firestore document
          const newUser = await createUserDocument(credential.user.uid, name, email);
          set({ user: newUser });
        } finally {
          set({ isAuthLoading: false });
        }
      },

      // ─── Auth: Sign Out ───
      signOut: async () => {
        // Sync any pending data before signing out
        const { authUser, user } = get();
        if (authUser && syncTimer) {
          clearTimeout(syncTimer);
          await syncUserToFirestore(authUser.uid, user);
        }
        await firebaseSignOut(auth);
        set({ authUser: null, user: DEFAULT_USER, currentProduct: null, scanError: null });
      },

      // ─── Auth: Google Sign In ───
      signInWithGoogle: async () => {
        // Note: Full Google Sign-In requires expo-auth-session configuration
        // with Google OAuth Client ID. This is a placeholder that will work
        // once the Google Cloud Console is configured.
        throw new Error('Google Sign-In requires OAuth configuration. Please use email login.');
      },

      // ─── Auth: Skip Login (Demo Mode) ───
      skipLogin: () => {
        const demoUser: User = {
          id: 'demo_user',
          name: 'Demo User',
          email: 'demo@smartspend.app',
          monthlyBudget: 3000,
          spent: 847.5,
          goals: [
            {
              id: 'demo_goal_1',
              title: 'Japan Trip',
              icon: '🗼',
              targetAmount: 4500,
              savedAmount: 1280,
              createdAt: '2025-12-01T00:00:00Z',
            },
            {
              id: 'demo_goal_2',
              title: 'Emergency Fund',
              icon: '🛡️',
              targetAmount: 5000,
              savedAmount: 3200,
              createdAt: '2025-10-15T00:00:00Z',
            },
          ],
          scanHistory: [],
        };
        set({
          authUser: { uid: 'demo_user' } as any,
          user: demoUser,
          isAuthInitialized: true,
        });
      },

      // ─── Barcode Scan ───
      scanBarcode: async (upc: string) => {
        set({ isScanning: true, scanError: null, currentProduct: null });

        try {
          const product = await lookupProduct(upc);

          if (!product) {
            set({ isScanning: false, scanError: 'Product not found. Try another barcode.' });
            return;
          }

          set({ isScanning: false, currentProduct: product });
        } catch (error: any) {
          set({
            isScanning: false,
            scanError: error.message || 'Failed to look up product.',
          });
        }
      },

      // ─── URL Scan ───
      scanURL: async (url: string) => {
        set({ isScanning: true, scanError: null, currentProduct: null });

        try {
          const product = await lookupProductByURL(url);

          if (!product) {
            set({ isScanning: false, scanError: 'Could not extract product info from this URL.' });
            return;
          }

          set({ isScanning: false, currentProduct: product });
        } catch (error: any) {
          set({
            isScanning: false,
            scanError: error.message || 'Failed to look up product from URL.',
          });
        }
      },

      // ─── Photo Scan ───
      scanPhoto: async (imageUri: string) => {
        set({ isScanning: true, scanError: null, currentProduct: null });

        try {
          const product = await lookupProductByPhoto(imageUri);

          if (!product) {
            set({ isScanning: false, scanError: 'Could not identify product from photo. Try a clearer image.' });
            return;
          }

          set({ isScanning: false, currentProduct: product });
        } catch (error: any) {
          set({
            isScanning: false,
            scanError: error.message || 'Failed to analyze photo.',
          });
        }
      },

      clearScan: () => {
        set({ currentProduct: null, scanError: null });
      },

      // ─── Record Purchase Decision ───
      recordDecision: (decision: 'bought' | 'skipped') => {
        const { currentProduct, user, authUser } = get();
        if (!currentProduct) return;

        const bestPrice = currentProduct.prices[0]?.price || currentProduct.msrp;
        const savedAmount = decision === 'skipped' ? bestPrice : 0;

        const historyItem: ScanHistoryItem = {
          id: `scan_${Date.now()}`,
          product: currentProduct,
          decision,
          savedAmount,
          scannedAt: new Date().toISOString(),
        };

        const updatedUser = {
          ...user,
          spent: decision === 'bought' ? user.spent + bestPrice : user.spent,
          scanHistory: [historyItem, ...user.scanHistory],
          goals: decision === 'skipped'
            ? user.goals.map((g) =>
                g.id === user.goals[0]?.id
                  ? { ...g, savedAmount: g.savedAmount + savedAmount }
                  : g
              )
            : user.goals,
        };

        set({ user: updatedUser });

        // Sync to Firestore
        if (authUser) {
          debouncedSync(authUser.uid, updatedUser);
        }
      },

      // ─── Goals ───
      addGoal: (goal) => {
        const { user, authUser } = get();
        const newGoal: UserGoal = {
          ...goal,
          id: `goal_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const updatedUser = { ...user, goals: [...user.goals, newGoal] };
        set({ user: updatedUser });
        if (authUser) debouncedSync(authUser.uid, updatedUser);
      },

      updateGoalProgress: (goalId: string, amount: number) => {
        const { user, authUser } = get();
        const updatedUser = {
          ...user,
          goals: user.goals.map((g) =>
            g.id === goalId
              ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) }
              : g
          ),
        };
        set({ user: updatedUser });
        if (authUser) debouncedSync(authUser.uid, updatedUser);
      },

      updateBudget: (amount: number) => {
        const { user, authUser } = get();
        const updatedUser = { ...user, monthlyBudget: amount };
        set({ user: updatedUser });
        if (authUser) debouncedSync(authUser.uid, updatedUser);
      },

      resetMonthlySpent: () => {
        const { user, authUser } = get();
        const updatedUser = { ...user, spent: 0 };
        set({ user: updatedUser });
        if (authUser) debouncedSync(authUser.uid, updatedUser);
      },

      // ─── Social / Templates ───
      loadTemplates: async () => {
        set({ isLoadingTemplates: true });
        try {
          let templates = await loadGoalTemplates();
          // Seed defaults if Firestore is empty
          if (templates.length === 0) {
            templates = await seedDefaultTemplates();
          }
          set({ goalTemplates: templates, isLoadingTemplates: false });
        } catch {
          set({ isLoadingTemplates: false });
        }
      },

      publishTemplate: async (data) => {
        const { authUser, user } = get();
        if (!authUser) return;

        const template: Omit<GoalTemplate, 'id'> = {
          ...data,
          authorId: authUser.uid,
          authorName: user.name || 'Anonymous',
          copiedCount: 0,
          likedBy: [],
          createdAt: new Date().toISOString(),
        };

        const published = await publishGoalTemplate(template);
        set((s) => ({ goalTemplates: [published, ...s.goalTemplates] }));
      },

      copyTemplate: (template) => {
        const { user, authUser } = get();
        const newGoal: UserGoal = {
          id: `goal_${Date.now()}`,
          title: template.title,
          icon: template.icon,
          targetAmount: template.targetAmount,
          savedAmount: 0,
          templateId: template.id,
          createdAt: new Date().toISOString(),
        };

        const updatedUser = { ...user, goals: [...user.goals, newGoal] };
        set({ user: updatedUser });
        if (authUser) debouncedSync(authUser.uid, updatedUser);

        // Increment copy count in Firestore + local
        incrementCopyCount(template.id);
        set((s) => ({
          goalTemplates: s.goalTemplates.map((t) =>
            t.id === template.id ? { ...t, copiedCount: t.copiedCount + 1 } : t
          ),
        }));
      },

      toggleTemplateLike: async (templateId) => {
        const { authUser, goalTemplates } = get();
        if (!authUser) return;
        const uid = authUser.uid;

        // Capture original state before optimistic update
        const original = goalTemplates.find((t) => t.id === templateId);
        const wasLiked = original?.likedBy.includes(uid) || false;

        // Optimistic local update
        set((s) => ({
          goalTemplates: s.goalTemplates.map((t) => {
            if (t.id !== templateId) return t;
            return {
              ...t,
              likedBy: wasLiked
                ? t.likedBy.filter((id) => id !== uid)
                : [...t.likedBy, uid],
            };
          }),
        }));

        // Sync to Firestore
        await toggleLike(templateId, uid, wasLiked);
      },
    }),
    {
      name: 'smartspend-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not transient scan/auth state
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
