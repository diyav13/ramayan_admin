import type { MapMarker, StoryMapDocument } from "@/types/map-marker";

const STORAGE_KEY = "ramayan-admin:story-map:v2";
const LEGACY_MARKERS_KEY = "ramayan-admin:story-map-markers:v1";

export const STORY_MAP_IMAGE = "/map/story-map.png";
/** Design aspect from Figma map frame (440×666). */
export const STORY_MAP_ASPECT = 440 / 666;

/**
 * Internal zoom factor: 1 = fitted to map view height (cannot go below).
 * Displayed %: 0% at fit, then increases as you zoom in (25%, 50%, …).
 */
export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 4;
export const MAP_ZOOM_STEP = 0.25;

/** UI percentage: fit/default = 0%, zoomed in = higher. */
export function zoomToPercent(zoom: number): number {
  const z = Number.isFinite(zoom) ? zoom : MAP_ZOOM_MIN;
  const clamped = Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, z));
  return Math.round((clamped - MAP_ZOOM_MIN) * 100);
}

function isFinitePercent(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function asOptionalUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isMarker(value: unknown): value is MapMarker {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.locationId === null || typeof m.locationId === "string") &&
    typeof m.name === "string" &&
    typeof m.subtitle === "string" &&
    typeof m.description === "string" &&
    (m.kind === "place" || m.kind === "journey") &&
    (m.imageUrl === null ||
      m.imageUrl === undefined ||
      typeof m.imageUrl === "string" ||
      m.imageDataUrl === null ||
      m.imageDataUrl === undefined ||
      typeof m.imageDataUrl === "string") &&
    isFinitePercent(m.xPercent) &&
    isFinitePercent(m.yPercent) &&
    typeof m.updatedAt === "string"
  );
}

function normalizeMarker(raw: MapMarker): MapMarker {
  const legacy = raw as MapMarker & {
    bodyHtml?: unknown;
    characterIds?: unknown;
    eventIds?: unknown;
    imageDataUrl?: unknown;
    detailImageDataUrl?: unknown;
    imageUrl?: unknown;
    detailImageUrl?: unknown;
    saved?: unknown;
  };
  return {
    ...raw,
    // Prefer S3 URLs; ignore legacy local data URLs (not valid for API save).
    imageUrl:
      asOptionalUrl(legacy.imageUrl) ??
      (typeof legacy.imageDataUrl === "string" &&
      legacy.imageDataUrl.startsWith("http")
        ? legacy.imageDataUrl
        : null),
    detailImageUrl:
      asOptionalUrl(legacy.detailImageUrl) ??
      (typeof legacy.detailImageDataUrl === "string" &&
      legacy.detailImageDataUrl.startsWith("http")
        ? legacy.detailImageDataUrl
        : null),
    bodyHtml: typeof legacy.bodyHtml === "string" ? legacy.bodyHtml : "",
    characterIds: asStringArray(legacy.characterIds),
    eventIds: asStringArray(legacy.eventIds),
    // Legacy pins without `saved` count as saved only if they have a name.
    saved:
      typeof legacy.saved === "boolean"
        ? legacy.saved
        : raw.name.trim().length > 0,
  };
}

function emptyDocument(): StoryMapDocument {
  return { version: 2, markers: [], pathIds: [] };
}

function migrateLegacyMarkers(): StoryMapDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_MARKERS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const markers = parsed
      .filter(isMarker)
      .map(normalizeMarker)
      .filter((marker) => marker.saved && marker.name.trim().length > 0);
    return { version: 2, markers, pathIds: [] };
  } catch {
    return null;
  }
}

export function loadStoryMap(): StoryMapDocument {
  if (typeof window === "undefined") return emptyDocument();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const doc = parsed as Partial<StoryMapDocument>;
        const markers = Array.isArray(doc.markers)
          ? doc.markers
              .filter(isMarker)
              .map(normalizeMarker)
              .filter((marker) => marker.saved && marker.name.trim().length > 0)
          : [];
        const markerIds = new Set(markers.map((m) => m.id));
        const pathIds = Array.isArray(doc.pathIds)
          ? doc.pathIds.filter(
              (id): id is string =>
                typeof id === "string" && markerIds.has(id)
            )
          : [];
        return { version: 2, markers, pathIds };
      }
    }
  } catch {
    // fall through to legacy
  }

  const legacy = migrateLegacyMarkers();
  if (legacy) {
    saveStoryMap(legacy);
    window.localStorage.removeItem(LEGACY_MARKERS_KEY);
    return legacy;
  }
  return emptyDocument();
}

/** Drop unsaved / empty pins so local + API persistence stay aligned. */
export function toPersistableStoryMap(doc: StoryMapDocument): StoryMapDocument {
  const markers = doc.markers.filter(
    (marker) => marker.saved && marker.name.trim().length > 0
  );
  const markerIds = new Set(markers.map((m) => m.id));
  return {
    version: 2,
    markers,
    pathIds: doc.pathIds.filter((id) => markerIds.has(id)),
  };
}

export function saveStoryMap(doc: StoryMapDocument): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(toPersistableStoryMap(doc))
  );
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(
    MAP_ZOOM_MAX,
    Math.max(MAP_ZOOM_MIN, Math.round(value * 100) / 100)
  );
}

export function createMarkerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

