import { BiryaniSpot } from "@/types/spot";
import { supabase } from "./supabase";

const STORAGE_KEY = "biryani_spots_data";
const USE_SUPABASE =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate and sanitize like/dislike counts
function sanitizeCount(value: any): number {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 99999) {
    return 0; // Reset invalid values to 0
  }
  return Math.floor(num);
}

// ============ LocalStorage Functions (Backup) ============
function encode(data: string): string {
  return btoa(unescape(encodeURIComponent(data)));
}

function decode(data: string): string {
  return decodeURIComponent(escape(atob(data)));
}

function saveSpotsLocal(spots: BiryaniSpot[]): void {
  try {
    const json = JSON.stringify(spots);
    localStorage.setItem(STORAGE_KEY, encode(json));
  } catch (e) {
    console.error("Failed to save spots locally", e);
  }
}

function loadSpotsLocal(): BiryaniSpot[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = decode(raw);
    const parsed = JSON.parse(json);
    return parsed.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      likes: sanitizeCount(s.likes),
      dislikes: sanitizeCount(s.dislikes),
    }));
  } catch (e) {
    console.error("Failed to load spots locally", e);
    return null;
  }
}

// ============ Supabase Functions ============
export async function loadSpots(): Promise<BiryaniSpot[] | null> {
  if (!USE_SUPABASE) {
    return loadSpotsLocal();
  }

  try {
    const { data, error } = await supabase
      .from("biryani_spots")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase load error:", error);
      return loadSpotsLocal(); // Fallback to local
    }

    return data.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      likes: sanitizeCount(s.likes),
      dislikes: sanitizeCount(s.dislikes),
    }));
  } catch (e) {
    console.error("Failed to load spots from Supabase", e);
    return loadSpotsLocal();
  }
}

export async function saveSpots(spots: BiryaniSpot[]): Promise<void> {
  saveSpotsLocal(spots); // Always save locally as backup

  if (!USE_SUPABASE) {
    return;
  }

  // Note: This function is kept for compatibility but individual operations are preferred
  console.log(
    "Batch save not implemented for Supabase, use addSpot/updateSpot instead",
  );
}

export async function addSpot(
  spot: Omit<BiryaniSpot, "id" | "createdAt">,
): Promise<BiryaniSpot | null> {
  const newSpot: BiryaniSpot = {
    ...spot,
    id: Date.now().toString(),
    createdAt: new Date(),
  };

  if (!USE_SUPABASE) {
    const existing = loadSpotsLocal() || [];
    saveSpotsLocal([newSpot, ...existing]);
    return newSpot;
  }

  try {
    const { data, error } = await supabase
      .from("biryani_spots")
      .insert([
        {
          id: newSpot.id,
          name: newSpot.name,
          address: newSpot.address,
          description: newSpot.description,
          addedBy: newSpot.addedBy,
          lat: newSpot.lat,
          lng: newSpot.lng,
          isActive: newSpot.isActive,
          rating: newSpot.rating,
          likes: newSpot.likes,
          dislikes: newSpot.dislikes,
          createdAt: newSpot.createdAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      const existing = loadSpotsLocal() || [];
      saveSpotsLocal([newSpot, ...existing]);
      return newSpot;
    }

    return {
      ...data,
      createdAt: new Date(data.createdAt),
    };
  } catch (e) {
    console.error("Failed to add spot to Supabase", e);
    const existing = loadSpotsLocal() || [];
    saveSpotsLocal([newSpot, ...existing]);
    return newSpot;
  }
}

export async function updateSpot(
  id: string,
  updates: Partial<BiryaniSpot>,
): Promise<boolean> {
  // Sanitize likes and dislikes if they are being updated
  const sanitizedUpdates = { ...updates };
  if ("likes" in sanitizedUpdates) {
    sanitizedUpdates.likes = sanitizeCount(sanitizedUpdates.likes);
  }
  if ("dislikes" in sanitizedUpdates) {
    sanitizedUpdates.dislikes = sanitizeCount(sanitizedUpdates.dislikes);
  }

  if (!USE_SUPABASE) {
    const existing = loadSpotsLocal() || [];
    const updated = existing.map((s) =>
      s.id === id ? { ...s, ...sanitizedUpdates } : s,
    );
    saveSpotsLocal(updated);
    return true;
  }

  try {
    const { error } = await supabase
      .from("biryani_spots")
      .update(sanitizedUpdates)
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Failed to update spot in Supabase", e);
    return false;
  }
}
