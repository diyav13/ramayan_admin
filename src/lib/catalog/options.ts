import { createInflightDedupe } from "@/lib/api/inflight";
import { createSessionCache } from "@/lib/api/session-cache";
import { characterService } from "@/services/characters";
import { eventService } from "@/services/events";
import { locationService } from "@/services/locations";
import type { Character } from "@/types/character";
import type { Event } from "@/types/event";
import type { Location } from "@/types/location";

const CATALOG_KEY = "all";

const fetchLocationsCatalogOnce = createInflightDedupe<Location[]>();
const fetchCharactersCatalogOnce = createInflightDedupe<Character[]>();
const fetchEventsCatalogOnce = createInflightDedupe<Event[]>();

const locationsCatalogCache = createSessionCache<Location[]>(
  "catalog:locations"
);
const charactersCatalogCache = createSessionCache<Character[]>(
  "catalog:characters"
);
const eventsCatalogCache = createSessionCache<Event[]>("catalog:events");

/** Shared locations catalog (filters / form pickers). Dedupes Strict Mode remounts. */
export async function loadLocationsCatalog(): Promise<Location[]> {
  const cached = locationsCatalogCache.get(CATALOG_KEY);
  if (cached) return cached.data;

  return fetchLocationsCatalogOnce(async () => {
    const result = await locationService.list({ all: true });
    locationsCatalogCache.set(result.data, CATALOG_KEY);
    return result.data;
  }, CATALOG_KEY);
}

/** Shared characters catalog (form pickers). Dedupes Strict Mode remounts. */
export async function loadCharactersCatalog(
  locationId?: string | null
): Promise<Character[]> {
  const key = locationId?.trim() || CATALOG_KEY;
  const cached = charactersCatalogCache.get(key);
  if (cached) return cached.data;

  return fetchCharactersCatalogOnce(async () => {
    const result = await characterService.list({
      all: true,
      locationId: locationId?.trim() || undefined,
    });
    charactersCatalogCache.set(result.data, key);
    return result.data;
  }, key);
}

/** Shared events catalog (form pickers). Dedupes Strict Mode remounts. */
export async function loadEventsCatalog(
  locationId?: string | null
): Promise<Event[]> {
  const key = locationId?.trim() || CATALOG_KEY;
  const cached = eventsCatalogCache.get(key);
  if (cached) return cached.data;

  return fetchEventsCatalogOnce(async () => {
    const result = await eventService.list({
      all: true,
      locationId: locationId?.trim() || undefined,
    });
    eventsCatalogCache.set(result.data, key);
    return result.data;
  }, key);
}

export function clearLocationsCatalogCache(): void {
  locationsCatalogCache.clear();
}

export function clearCharactersCatalogCache(): void {
  charactersCatalogCache.clear();
}

export function clearEventsCatalogCache(): void {
  eventsCatalogCache.clear();
}
