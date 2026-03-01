/**
 * ─────────────────────────────────────────────
 * SmartSpend AI — Photo Product Lookup Service
 *
 * Uses Google Gemini Vision to identify products
 * from camera photos or gallery images.
 * ─────────────────────────────────────────────
 */

import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../types';
import { API_CONFIG } from '../constants/theme';
import { calculateEquivalents } from './productLookup';

const VISION_PROMPT = `You are a product identification expert. Analyze this product photo and extract the following information.

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "name": "Full product name",
  "brand": "Brand name",
  "category": "Product category (e.g. Electronics, Food & Grocery, Clothing, Home & Kitchen, Beauty, Sports, Toys, etc.)",
  "description": "Brief product description (1-2 sentences)",
  "estimatedPrice": 0.00
}

Rules:
- "estimatedPrice" should be the typical US retail price in USD
- If you cannot identify the product, set name to null
- Be as specific as possible with the product name (include model, size, variant)
- Category should be one of: Electronics, Food & Grocery, Clothing, Home & Kitchen, Beauty & Personal Care, Sports & Outdoors, Toys & Games, Books, Office, Automotive, Health, Pet Supplies, General`;

interface GeminiProductResponse {
  name: string | null;
  brand: string;
  category: string;
  description: string;
  estimatedPrice: number;
}

export async function lookupProductByPhoto(imageUri: string): Promise<Product | null> {
  const apiKey = API_CONFIG.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  console.log('[PhotoLookup] Reading image...');

  // Read image as base64
  const base64 = await readAsStringAsync(imageUri, {
    encoding: EncodingType.Base64,
  });

  console.log('[PhotoLookup] Calling Gemini Vision API...');

  // Call Gemini API
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    VISION_PROMPT,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    },
  ]);

  const responseText = result.response.text();
  console.log('[PhotoLookup] Gemini response:', responseText);

  // Parse JSON response
  let parsed: GeminiProductResponse;
  try {
    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[PhotoLookup] Failed to parse Gemini response');
    return null;
  }

  if (!parsed.name) {
    console.log('[PhotoLookup] Could not identify product in photo');
    return null;
  }

  const price = parsed.estimatedPrice || 0;

  const product: Product = {
    upc: `photo_${Date.now()}`,
    name: parsed.name,
    brand: parsed.brand || 'Unknown Brand',
    category: parsed.category || 'General',
    description: parsed.description,
    imageUrl: imageUri,
    msrp: price,
    prices: price > 0
      ? [{ store: 'AI Estimated', price, url: '', badge: null }]
      : [],
    equivalents: calculateEquivalents(price),
    fetchedAt: new Date().toISOString(),
  };

  console.log(`[PhotoLookup] Identified: "${product.name}" (~$${price})`);
  return product;
}
