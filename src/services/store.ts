/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Global State (Zustand + Persist)
 * ─────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, User, UserGoal, ScanHistoryItem } from '../types';
import { lookupProduct } from '../services/productLookup';
import { lookupProductByURL } from '../services/urlLookup';

interface AppState {
  // User
  user: User;

  // Scan state (not persisted)
  isScanning: boolean;
  scanError: string | null;
  currentProduct: Product | null;

  // Actions
  scanBarcode: (upc: string) => Promise<void>;
  scanURL: (url: string) => Promise<void>;
  clearScan: () => void;
  recordDecision: (decision: 'bought' | 'skipped') => void;
  addGoal: (goal: Omit<UserGoal, 'id' | 'createdAt'>) => void;
  updateGoalProgress: (goalId: string, amount: number) => void;
  updateBudget: (amount: number) => void;
  resetMonthlySpent: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Initial State ───
      user: {
        id: 'user_001',
        name: 'Demo User',
        monthlyBudget: 3000,
        spent: 1247,
        goals: [
          {
            id: 'goal_001',
            title: 'Japan Trip Fund',
            icon: '✈️',
            targetAmount: 3000,
            savedAmount: 1847,
            deadline: '2026-09-01',
            createdAt: '2025-01-15T00:00:00Z',
          },
        ],
        scanHistory: [],
      },

      isScanning: false,
      scanError: null,
      currentProduct: null,

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

      clearScan: () => {
        set({ currentProduct: null, scanError: null });
      },

      // ─── Record Purchase Decision ───
      recordDecision: (decision: 'bought' | 'skipped') => {
        const { currentProduct, user } = get();
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

        set({
          user: {
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
          },
        });
      },

      // ─── Goals ───
      addGoal: (goal) => {
        const { user } = get();
        const newGoal: UserGoal = {
          ...goal,
          id: `goal_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set({ user: { ...user, goals: [...user.goals, newGoal] } });
      },

      updateGoalProgress: (goalId: string, amount: number) => {
        const { user } = get();
        set({
          user: {
            ...user,
            goals: user.goals.map((g) =>
              g.id === goalId
                ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) }
                : g
            ),
          },
        });
      },

      updateBudget: (amount: number) => {
        const { user } = get();
        set({ user: { ...user, monthlyBudget: amount } });
      },

      resetMonthlySpent: () => {
        const { user } = get();
        set({ user: { ...user, spent: 0 } });
      },
    }),
    {
      name: 'smartspend-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not transient scan state
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
