// ─── Product Types ───
export interface ProductPrice {
  store: string;
  price: number;
  url: string;
  affiliateUrl?: string;
  badge?: 'Lowest' | 'Prime' | 'Sale' | null;
}

export interface OpportunityCostItem {
  icon: string;
  label: string;
  count: number;
}

export interface Product {
  upc: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  imageUrl: string;
  msrp: number;
  prices: ProductPrice[];
  equivalents: OpportunityCostItem[];
  fetchedAt: string;
}

// ─── User & Goal Types ───
export interface UserGoal {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  createdAt: string;
  templateId?: string;
}

export interface GoalTemplate {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  icon: string;
  skippedItem: string;
  investedIn: string;
  targetAmount: number;
  story: string;
  copiedCount: number;
  likedBy: string[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  createdAt?: string;
  monthlyBudget: number;
  spent: number;
  goals: UserGoal[];
  scanHistory: ScanHistoryItem[];
}

export interface ScanHistoryItem {
  id: string;
  product: Product;
  decision: 'bought' | 'skipped' | 'pending';
  savedAmount?: number;
  scannedAt: string;
}

// ─── API Response Types ───
export interface BarcodeLookupResponse {
  items: Array<{
    ean: string;
    title: string;
    brand: string;
    category: string;
    description: string;
    images: string[];
    stores: Array<{
      name: string;
      price: string;
      link: string;
      currency: string;
    }>;
  }>;
}

// ─── Navigation Types ───
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Scanner: undefined;
  ProductResult: { product: Product };
};

export type MainTabParamList = {
  Home: undefined;
  Goals: undefined;
  Social: undefined;
  Settings: undefined;
};
