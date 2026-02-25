/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Product Lookup Service
 * 
 * Multi-source barcode/UPC lookup with fallback:
 *   1. Barcode Lookup API (primary, rich data)
 *   2. UPC Item DB (free tier fallback)
 *   3. Open Food Facts (food/grocery items)
 * 
 * Price comparison via Rainforest / BlueCart APIs.
 * ─────────────────────────────────────────────
 */

import axios, { AxiosError } from 'axios';
import { Product, ProductPrice, BarcodeLookupResponse } from '../types';
import { API_CONFIG, EQUIVALENTS } from '../constants/theme';

// ─── Barcode Lookup API (Primary) ───
async function lookupViaBarcodeLookup(upc: string): Promise<Product | null> {
  try {
    const response = await axios.get<BarcodeLookupResponse>(
      API_CONFIG.BARCODE_LOOKUP_URL,
      {
        params: {
          barcode: upc,
          formatted: 'y',
          key: API_CONFIG.BARCODE_LOOKUP_KEY,
        },
        timeout: 8000,
      }
    );

    const item = response.data.items?.[0];
    if (!item) return null;

    const prices: ProductPrice[] = (item.stores || [])
      .map((store) => ({
        store: store.name,
        price: parseFloat(store.price) || 0,
        url: store.link,
        badge: null,
      }))
      .filter((p) => p.price > 0)
      .sort((a, b) => a.price - b.price);

    // Tag the lowest price
    if (prices.length > 0) {
      prices[0].badge = 'Lowest';
    }

    const msrp = prices.length > 0
      ? Math.max(...prices.map((p) => p.price))
      : 0;

    return {
      upc,
      name: item.title,
      brand: item.brand || 'Unknown Brand',
      category: item.category || 'General',
      description: item.description,
      imageUrl: item.images?.[0] || '',
      msrp,
      prices,
      equivalents: calculateEquivalents(msrp),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[BarcodeLookup] Failed:', (error as AxiosError).message);
    return null;
  }
}

// ─── UPC Item DB (Free Fallback) ───
async function lookupViaUPCItemDB(upc: string): Promise<Product | null> {
  try {
    const response = await axios.get(API_CONFIG.UPC_ITEMDB_URL, {
      params: { upc },
      timeout: 8000,
    });

    const item = response.data.items?.[0];
    if (!item) return null;

    const prices: ProductPrice[] = (item.offers || [])
      .map((offer: any) => ({
        store: offer.merchant,
        price: parseFloat(offer.price) || 0,
        url: offer.link,
        badge: null,
      }))
      .filter((p: ProductPrice) => p.price > 0)
      .sort((a: ProductPrice, b: ProductPrice) => a.price - b.price);

    if (prices.length > 0) {
      prices[0].badge = 'Lowest';
    }

    const msrp = prices.length > 0
      ? Math.max(...prices.map((p) => p.price))
      : parseFloat(item.lowest_recorded_price) || 0;

    return {
      upc,
      name: item.title,
      brand: item.brand || 'Unknown Brand',
      category: item.category || 'General',
      description: item.description,
      imageUrl: item.images?.[0] || '',
      msrp,
      prices,
      equivalents: calculateEquivalents(msrp),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[UPCItemDB] Failed:', (error as AxiosError).message);
    return null;
  }
}

// ─── Open Food Facts (Grocery / Food Items) ───
async function lookupViaOpenFoodFacts(upc: string): Promise<Product | null> {
  try {
    const response = await axios.get(
      `${API_CONFIG.OPEN_FOOD_FACTS_URL}/${upc}.json`,
      { timeout: 8000 }
    );

    const product = response.data.product;
    if (!product || response.data.status === 0) return null;

    return {
      upc,
      name: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      category: product.categories_tags?.[0]?.replace('en:', '') || 'Food & Grocery',
      description: product.generic_name || '',
      imageUrl: product.image_url || product.image_front_url || '',
      msrp: 0, // OFF doesn't provide pricing
      prices: [],
      equivalents: [],
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[OpenFoodFacts] Failed:', (error as AxiosError).message);
    return null;
  }
}

// ─── Opportunity Cost Calculator ───
function calculateEquivalents(price: number) {
  if (price <= 0) return [];

  return Object.values(EQUIVALENTS).map((eq) => ({
    icon: eq.icon,
    label: eq.label,
    count: Math.floor(price / eq.unitPrice),
  }));
}

// ─── Goal Impact Calculator ───
export function calculateGoalDelay(
  price: number,
  dailySavingsRate: number = 15 // default $15/day
): number {
  return Math.ceil(price / dailySavingsRate);
}

// ─── Main Lookup Function (Multi-source Cascade) ───
export async function lookupProduct(upc: string): Promise<Product | null> {
  // Clean UPC (remove spaces, dashes)
  const cleanUPC = upc.replace(/[\s\-]/g, '');

  // Validate UPC format (8, 12, or 13 digits)
  if (!/^\d{8,13}$/.test(cleanUPC)) {
    throw new Error(`Invalid UPC format: "${upc}". Expected 8-13 digits.`);
  }

  console.log(`[ProductLookup] Searching for UPC: ${cleanUPC}`);

  // Try sources in priority order
  const sources = [
    { name: 'BarcodeLookup', fn: () => lookupViaBarcodeLookup(cleanUPC) },
    { name: 'UPCItemDB', fn: () => lookupViaUPCItemDB(cleanUPC) },
    { name: 'OpenFoodFacts', fn: () => lookupViaOpenFoodFacts(cleanUPC) },
  ];

  for (const source of sources) {
    console.log(`[ProductLookup] Trying ${source.name}...`);
    const result = await source.fn();
    if (result) {
      console.log(`[ProductLookup] ✓ Found via ${source.name}: "${result.name}"`);
      return result;
    }
  }

  console.log(`[ProductLookup] ✗ Product not found for UPC: ${cleanUPC}`);
  return null;
}

// ─── Price Comparison Enhancement ───
// Call this separately after initial lookup to enrich with more store prices
export async function enrichPrices(product: Product): Promise<ProductPrice[]> {
  // Placeholder for Rainforest API (Amazon) + BlueCart (Walmart) integration
  // In production, these would be real API calls:
  //
  // const amazonPrice = await rainforestAPI.search(product.name);
  // const walmartPrice = await blueCartAPI.search(product.name);
  //
  // For now, return existing prices
  return product.prices;
}

// ─── Affiliate Link Wrapper ───
export function wrapAffiliateLink(url: string, store: string): string {
  // Placeholder for Skimlinks / PA-API affiliate wrapping
  // In production:
  //   return `https://go.skimlinks.com/?id=YOUR_ID&url=${encodeURIComponent(url)}`;
  return url;
}

export default {
  lookupProduct,
  enrichPrices,
  wrapAffiliateLink,
  calculateGoalDelay,
};
