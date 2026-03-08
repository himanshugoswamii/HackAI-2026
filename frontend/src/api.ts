/**
 * API client for Neural Threads api backend
 * Update API_BASE for your deployed backend
 */
import { Platform } from 'react-native';

// Web: use localhost; native: use 10.0.2.2 for Android, localhost for iOS
const API_BASE = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:8000',
      default: 'http://localhost:8000',
    }) ?? 'http://localhost:8000'
  : 'https://your-backend.ondigitalocean.app';

/** Fetch with timeout. Throws if the request takes longer than timeoutMs. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...options, signal: ctrl.signal });
    return r;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Check that the API is running at ${API_BASE} and try again.`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export function getImageUrl(imagePath: string): string {
  const base = imagePath.startsWith('http') ? '' : API_BASE;
  return imagePath.startsWith('http') ? imagePath : `${base}/${imagePath}`;
}

export type WardrobeItem = {
  id: number;
  type: string;
  color: string;
  style: string;
  season: string;
  formality: string;
  image_path: string;
  last_worn: string | null;
  created_at: string | null;
};

export type Classification = {
  type: string;
  color: string;
  style: string;
  season: string;
  formality: string;
};

export async function uploadClothingImage(uri: string, mimeType = 'image/jpeg'): Promise<{
  image_path: string;
  message: string;
  classification: Classification;
}> {
  const fd = new FormData();

  // Web: fetch blob from URI (blob: or data:) and append as File
  // Native: append { uri, name, type } (React Native FormData handles it)
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const file = new File([blob], 'image.jpg', { type: mimeType });
    fd.append('file', file);
  } else {
    fd.append('file', {
      uri,
      name: 'image.jpg',
      type: mimeType,
    } as unknown as Blob);
  }

  const r = await fetchWithTimeout(
    `${API_BASE}/upload-clothing-image`,
    { method: 'POST', body: fd },
    90000
  );
  if (!r.ok) {
    const err = await r.text();
    throw new Error(err || 'Upload failed');
  }
  return r.json();
}

export async function addToWardrobe(item: {
  type: string;
  color: string;
  style: string;
  season: string;
  formality: string;
  image_path: string;
}): Promise<WardrobeItem> {
  const r = await fetch(`${API_BASE}/wardrobe/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function seedWardrobe(): Promise<{ message: string; seeded: boolean }> {
  const r = await fetch(`${API_BASE}/wardrobe/seed`, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const WARDROBE_CACHE_MS = 15000; // 15 seconds - avoid refetch on every tab switch
let wardrobeCache: { data: WardrobeItem[]; at: number } | null = null;

export async function getWardrobeList(): Promise<WardrobeItem[]> {
  const r = await fetchWithTimeout(`${API_BASE}/wardrobe/list`, {}, 20000);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  wardrobeCache = { data, at: Date.now() };
  return data;
}

/** Returns cached wardrobe if fresh (< 15s), then refetches in background. Use for fast tab switching. */
export async function getWardrobeListCached(): Promise<WardrobeItem[]> {
  const now = Date.now();
  if (wardrobeCache && now - wardrobeCache.at < WARDROBE_CACHE_MS) {
    fetchWithTimeout(`${API_BASE}/wardrobe/list`, {}, 20000)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<WardrobeItem[]>;
      })
      .then((data) => {
        wardrobeCache = { data, at: Date.now() };
      })
      .catch(() => {});
    return wardrobeCache!.data;
  }
  const r = await fetchWithTimeout(`${API_BASE}/wardrobe/list`, {}, 20000);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  wardrobeCache = { data, at: Date.now() };
  return data;
}

export function invalidateWardrobeCache(): void {
  wardrobeCache = null;
}

export async function deleteWardrobeItem(id: number): Promise<{ deleted: boolean }> {
  const r = await fetch(`${API_BASE}/wardrobe/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type OutfitItemImage = {
  label: string;
  image_path: string;
};

export type Outfit = {
  title: string;
  items: string[];
  reason: string;
  item_images?: OutfitItemImage[];
};

export async function suggestOutfits(
  age: number,
  stylePreference: string,
  wardrobeItems: WardrobeItem[],
  options?: { season?: string; inspirationDescription?: string; lat?: number; lon?: number }
): Promise<{ outfits: Outfit[] }> {
  const lat = options?.lat ?? 40.71;
  const lon = options?.lon ?? -74.01;
  const r = await fetch(
    `${API_BASE}/stylist/suggest-outfits?lat=${lat}&lon=${lon}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age,
        style_preference: stylePreference,
        wardrobe_items: wardrobeItems,
        season: options?.season ?? null,
        inspiration_description: options?.inspirationDescription ?? null,
      }),
    }
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type DeclutterSuggestion = {
  item: WardrobeItem;
  explanation: string;
};

export async function getDeclutterSuggestions(
  lat = 40.71,
  lon = -74.01
): Promise<{ suggestions: DeclutterSuggestion[] }> {
  const r = await fetch(
    `${API_BASE}/wardrobe/declutter-suggestions?lat=${lat}&lon=${lon}`
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function checkSimilarInWardrobe(
  uri: string,
  mimeType = 'image/jpeg'
): Promise<{ similar_items: WardrobeItem[]; count: number }> {
  const fd = new FormData();
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const file = new File([blob], 'image.jpg', { type: mimeType });
    fd.append('file', file);
  } else {
    fd.append('file', {
      uri,
      name: 'image.jpg',
      type: mimeType,
    } as unknown as Blob);
  }
  const r = await fetchWithTimeout(
    `${API_BASE}/api/wardrobe/similar-check`,
    { method: 'POST', body: fd },
    90000
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
