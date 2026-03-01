// ─────────────────────────────────────────────
// SmartSpend AI — Design System
// Target: US MZ Gen (clean, dark, neon accents)
// ─────────────────────────────────────────────

export const COLORS = {
  // Background
  bg: {
    primary: '#0A0A0F',
    secondary: '#141420',
    tertiary: '#1A1A2E',
    card: '#161622',
  },

  // Brand Gradient
  brand: {
    green: '#00FF88',
    cyan: '#00D4FF',
    gradient: ['#00FF88', '#00D4FF'],
  },

  // Accent
  accent: {
    warning: '#FF6B35',
    danger: '#FF3B30',
    gold: '#FFD700',
    purple: '#A855F7',
  },

  // Text
  text: {
    primary: '#F5F5F7',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    muted: '#6B7280',
    disabled: '#4B5563',
  },

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.04)',
    light: 'rgba(255,255,255,0.06)',
    medium: 'rgba(255,255,255,0.10)',
    brand: 'rgba(0,255,136,0.15)',
  },

  // Overlays
  overlay: {
    light: 'rgba(255,255,255,0.02)',
    medium: 'rgba(255,255,255,0.04)',
    brand: 'rgba(0,255,136,0.06)',
    brandStrong: 'rgba(0,255,136,0.08)',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const FONTS = {
  // Use system fonts; swap with custom fonts via react-native-asset
  heading: {
    fontFamily: undefined, // defaults to system; replace with 'DMSans-Bold'
    fontWeight: '800' as const,
  },
  subheading: {
    fontFamily: undefined,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: undefined,
    fontWeight: '400' as const,
  },
  mono: {
    fontFamily: undefined, // replace with 'SpaceMono-Regular'
    fontWeight: '700' as const,
  },
  caption: {
    fontFamily: undefined,
    fontWeight: '600' as const,
  },
} as const;

export const FONT_SIZE = {
  xs: 10,
  sm: 11,
  md: 13,
  base: 14,
  lg: 15,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

// Opportunity cost conversion rates (USD)
export const EQUIVALENTS = {
  starbucks: { icon: '☕', label: 'Starbucks Lattes', unitPrice: 6.50 },
  netflix: { icon: '🎬', label: 'Netflix Months', unitPrice: 17.99 },
  pizza: { icon: '🍕', label: 'Pizza Nights', unitPrice: 15.00 },
  gas: { icon: '⛽', label: 'Gas Tank Fills', unitPrice: 52.00 },
  chipotle: { icon: '🌯', label: 'Chipotle Bowls', unitPrice: 11.50 },
  spotify: { icon: '🎵', label: 'Spotify Months', unitPrice: 11.99 },
} as const;

// API Configuration
export const API_CONFIG = {
  BARCODE_LOOKUP_KEY: process.env.EXPO_PUBLIC_BARCODE_LOOKUP_KEY || '',
  BARCODE_LOOKUP_URL: 'https://api.barcodelookup.com/v3/products',
  UPC_ITEMDB_URL: 'https://api.upcitemdb.com/prod/trial/lookup',
  OPEN_FOOD_FACTS_URL: 'https://world.openfoodfacts.org/api/v2/product',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
} as const;

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
} as const;
