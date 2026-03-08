/**
 * API client for Neural Threads backend (api/ on port 8000).
 * In dev: use '' so Vite proxy forwards to localhost:8000 (avoids CORS).
 * In prod: set VITE_API_BASE in web/.env to your deployed API URL.
 */
const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE !== undefined && String(import.meta.env.VITE_API_BASE).trim() !== ''
    ? (import.meta.env.VITE_API_BASE as string).replace(/\/$/, '')
    : '';

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
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      const apiHint = API_BASE ? API_BASE : 'http://localhost:8000 (or ensure the dev proxy is running)';
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. Check that the API is running at ${apiHint} and try again.`
      );
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/** Parse API error body so 503/4xx show a clean message (e.g. from FastAPI detail). */
async function errorMessage(r: Response, fallback: string): Promise<string> {
  const text = await r.text();
  if (!text) return fallback;
  try {
    const j = JSON.parse(text) as { detail?: string };
    if (typeof j.detail === 'string' && j.detail.trim()) return j.detail.trim();
  } catch {
    // not JSON
  }
  return text.length > 200 ? text.slice(0, 200) + '…' : text;
}

export function getImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) return imagePath;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${base}${path}`;
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

export async function uploadClothingImage(
  file: File
): Promise<{ image_path: string; message: string; classification: Classification }> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetchWithTimeout(
    `${API_BASE}/upload-clothing-image`,
    { method: 'POST', body: fd },
    90000
  );
  if (!r.ok) throw new Error(await errorMessage(r, 'Upload failed'));
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
  if (!r.ok) throw new Error(await errorMessage(r, 'Add to wardrobe failed'));
  return r.json();
}

export async function seedWardrobe(): Promise<{ message: string; seeded: boolean }> {
  const r = await fetch(`${API_BASE}/wardrobe/seed`, { method: 'POST' });
  if (!r.ok) throw new Error(await errorMessage(r, 'Seed failed'));
  return r.json();
}

export async function getWardrobeList(): Promise<WardrobeItem[]> {
  const r = await fetchWithTimeout(`${API_BASE}/wardrobe/list`, {}, 20000);
  if (!r.ok) throw new Error(await errorMessage(r, 'Wardrobe list failed'));
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

export async function deleteWardrobeItem(id: number): Promise<{ deleted: boolean }> {
  const r = await fetch(`${API_BASE}/wardrobe/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(await errorMessage(r, 'Delete failed'));
  return r.json();
}

export type OutfitItemImage = { label: string; image_path: string };
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
  const r = await fetchWithTimeout(
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
    },
    60000
  );
  if (!r.ok) throw new Error(await errorMessage(r, 'Outfit suggestions failed'));
  const data = await r.json();
  const outfits = data?.outfits;
  return { outfits: Array.isArray(outfits) ? outfits : [] };
}

export type SavedOutfitItem = {
  id: number;
  title: string;
  items: string[];
  item_images: OutfitItemImage[];
  reason: string;
  created_at: string | null;
};

export async function saveOutfit(outfit: {
  title: string;
  items: string[];
  reason?: string;
  item_images?: OutfitItemImage[];
}): Promise<SavedOutfitItem> {
  const r = await fetch(`${API_BASE}/outfits/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: outfit.title,
      items: outfit.items,
      reason: outfit.reason ?? '',
      item_images: outfit.item_images ?? [],
    }),
  });
  if (!r.ok) throw new Error(await errorMessage(r, 'Save outfit failed'));
  return r.json();
}

export async function getSavedOutfits(): Promise<SavedOutfitItem[]> {
  const r = await fetch(`${API_BASE}/outfits/list`);
  if (!r.ok) throw new Error(await errorMessage(r, 'Load outfits failed'));
  const data = await r.json();
  const list = data?.outfits;
  return Array.isArray(list) ? list : [];
}

export type DeclutterSuggestion = { item: WardrobeItem; explanation: string };

export async function getDeclutterSuggestions(
  lat = 40.71,
  lon = -74.01
): Promise<{ suggestions: DeclutterSuggestion[] }> {
  const r = await fetchWithTimeout(
    `${API_BASE}/wardrobe/declutter-suggestions?lat=${lat}&lon=${lon}`,
    {},
    180000
  );
  if (!r.ok) throw new Error(await errorMessage(r, 'Declutter suggestions failed'));
  const data = await r.json();
  const suggestions = data?.suggestions;
  return { suggestions: Array.isArray(suggestions) ? suggestions : [] };
}

export async function checkSimilarInWardrobe(
  file: File
): Promise<{ similar_items: WardrobeItem[]; count: number; response_preview?: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetchWithTimeout(
    `${API_BASE}/api/wardrobe/similar-check`,
    { method: 'POST', body: fd },
    90000
  );
  if (!r.ok) throw new Error(await errorMessage(r, 'Similar check failed'));
  const data = await r.json();
  const similar = data?.similar_items;
  const count = typeof data?.count === 'number' ? data.count : (Array.isArray(similar) ? similar.length : 0);
  const response_preview = typeof data?.response_preview === 'string' ? data.response_preview : undefined;
  return { similar_items: Array.isArray(similar) ? similar : [], count, response_preview };
}
