/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — URL Product Lookup Service
 *
 * Extracts product info from a shopping URL:
 *   1. Fetch HTML from URL
 *   2. Parse Open Graph / meta tags for title, image, price
 *   3. Extract price from structured data (JSON-LD)
 *   4. Build Product object for display
 * ─────────────────────────────────────────────
 */

import axios from 'axios';
import { Product, ProductPrice } from '../types';
import { EQUIVALENTS } from '../constants/theme';

// ─── HTML Meta Tag Extraction ───
function extractMeta(html: string, property: string): string | null {
  // Match og:property, product:price, etc.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

// ─── Extract <title> tag ───
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || 'Unknown Product';
}

// ─── Extract price from JSON-LD structured data ───
function extractJsonLdPrice(html: string): number | null {
  const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Check for Product schema
      const product = data['@type'] === 'Product' ? data : data['@graph']?.find?.((item: any) => item['@type'] === 'Product');
      if (product) {
        const offers = product.offers;
        if (offers) {
          const price = offers.price || offers.lowPrice || offers[0]?.price;
          if (price) return parseFloat(price);
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null;
}

// ─── Extract price from meta tags ───
function extractMetaPrice(html: string): number | null {
  const priceStr =
    extractMeta(html, 'product:price:amount') ||
    extractMeta(html, 'og:price:amount') ||
    extractMeta(html, 'product:price') ||
    extractMeta(html, 'twitter:data1');

  if (priceStr) {
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    if (!isNaN(price) && price > 0) return price;
  }
  return null;
}

// ─── Detect store name from URL ───
function detectStore(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  const storeMap: Record<string, string> = {
    'amazon.com': 'Amazon',
    'walmart.com': 'Walmart',
    'target.com': 'Target',
    'bestbuy.com': 'Best Buy',
    'costco.com': 'Costco',
    'ebay.com': 'eBay',
    'homedepot.com': 'Home Depot',
    'lowes.com': "Lowe's",
    'macys.com': "Macy's",
    'nordstrom.com': 'Nordstrom',
    'newegg.com': 'Newegg',
    'etsy.com': 'Etsy',
    'zappos.com': 'Zappos',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'apple.com': 'Apple',
  };

  for (const [domain, name] of Object.entries(storeMap)) {
    if (hostname.includes(domain)) return name;
  }

  // Fallback: use domain name
  const parts = hostname.replace('www.', '').split('.');
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

// ─── Detect category from URL/title ───
function detectCategory(url: string, title: string): string {
  const text = `${url} ${title}`.toLowerCase();
  const categories: Record<string, string[]> = {
    'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphone', 'speaker', 'tv', 'monitor', 'camera', 'gaming'],
    'Clothing': ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'hoodie', 'sneaker', 'apparel', 'wear'],
    'Home & Kitchen': ['kitchen', 'furniture', 'home', 'decor', 'mattress', 'pillow', 'cookware'],
    'Beauty': ['beauty', 'skincare', 'makeup', 'cosmetic', 'perfume', 'fragrance'],
    'Sports': ['sports', 'fitness', 'gym', 'outdoor', 'bike', 'running'],
    'Books': ['book', 'kindle', 'reading'],
    'Toys & Games': ['toy', 'game', 'lego', 'puzzle'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return 'General';
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

// ─── Main URL Lookup Function ───
export async function lookupProductByURL(url: string): Promise<Product | null> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format. Please enter a valid product URL.');
  }

  console.log(`[URLLookup] Fetching: ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
    });

    const html = typeof response.data === 'string' ? response.data : '';
    if (!html) {
      throw new Error('Could not load page content.');
    }

    // Extract product data
    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractTitle(html);

    const imageUrl =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      '';

    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'description') ||
      '';

    const brand =
      extractMeta(html, 'product:brand') ||
      extractMeta(html, 'og:brand') ||
      detectStore(url);

    // Extract price
    const price = extractJsonLdPrice(html) || extractMetaPrice(html);

    if (!title || title === 'Unknown Product') {
      return null;
    }

    const store = detectStore(url);
    const msrp = price || 0;

    const prices: ProductPrice[] = price
      ? [{ store, price, url, badge: 'Lowest' as const }]
      : [];

    const product: Product = {
      upc: `url_${Date.now()}`,
      name: cleanTitle(title),
      brand,
      category: detectCategory(url, title),
      description: description.slice(0, 200),
      imageUrl,
      msrp,
      prices,
      equivalents: calculateEquivalents(msrp),
      fetchedAt: new Date().toISOString(),
    };

    console.log(`[URLLookup] ✓ Found: "${product.name}" at $${msrp}`);
    return product;
  } catch (error: any) {
    if (error.message?.includes('Invalid URL')) throw error;
    console.warn('[URLLookup] Failed:', error.message);
    throw new Error('Could not fetch product info. The site may be blocking requests.');
  }
}

// ─── Clean up product title ───
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|:]\s*(Amazon|Walmart|Target|Best Buy|eBay).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 100);
}

export default { lookupProductByURL };
