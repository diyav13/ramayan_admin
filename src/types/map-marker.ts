/** Normalized map position — percent of map image width/height (0–100). */
export type MapPoint = {
  xPercent: number;
  yPercent: number;
};

export type MapMarkerKind = "place" | "journey";

/** Place = add & edit locations. Path = build Rama’s journey order. */
export type MapTool = "place" | "path";

/**
 * Admin-side pin on the Explore story map.
 * xPercent / yPercent are the Explore map source of truth (not Location rows).
 *
 * Content fields mirror the Explore location preview + detail screens:
 * short description (sheet), HTML body (detail), linked characters & events.
 */
export type MapMarker = MapPoint & {
  id: string;
  /**
   * Optional linked catalog location (content sync + unlock chapter).
   * Pin placement does not require a catalog link.
   */
  locationId: string | null;
  name: string;
  /** Short gold subtitle under the name (e.g. "Capital of Kosala · On the Sarayu"). */
  subtitle: string;
  /** Plain short blurb for the map preview sheet. */
  description: string;
  /** HTML for the location detail screen (Role in the story, etc.). */
  bodyHtml: string;
  /** Character ids shown as “Connected characters” chips (many allowed). */
  characterIds: string[];
  /** Event ids shown as key-event rows on the detail screen (many allowed). */
  eventIds: string[];
  kind: MapMarkerKind;
  /** S3 public URL for the map pin icon (`assets/map/pins/...`). */
  imageUrl: string | null;
  /** S3 public URL for the place detail hero (`assets/map/details/...`). */
  detailImageUrl: string | null;
  /** Only saved markers are kept on refresh. */
  saved: boolean;
  updatedAt: string;
};

export type MapMarkerDraft = {
  locationId: string | null;
  name: string;
  subtitle: string;
  description: string;
  bodyHtml: string;
  characterIds: string[];
  eventIds: string[];
  kind: MapMarkerKind;
  imageUrl: string | null;
  detailImageUrl: string | null;
  xPercent: number;
  yPercent: number;
};

export type StoryMapDocument = {
  version: 2;
  markers: MapMarker[];
  /** Ordered marker ids for Rama’s journey dashed path. */
  pathIds: string[];
};
