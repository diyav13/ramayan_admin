export type LocationChapterRef = {
  id: string;
  title: string;
  orderIndex: number;
  accentColor?: string | null;
};

export type LocationCharacterRef = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type LocationEventRef = {
  id: string;
  name: string;
  imageUrl: string | null;
  chapterId?: string | null;
};

export interface Location {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  /** Chapter that unlocks this place on the Explore map. */
  chapterId: string | null;
  chapter: LocationChapterRef | null;
  /**
   * Characters connected to this place (character_locations + people on
   * events at this place). Multiple allowed; reusable across map pins.
   */
  characters?: LocationCharacterRef[];
  characterIds?: string[];
  /** Events whose primary locationId is this place (many allowed). */
  events?: LocationEventRef[];
  eventIds?: string[];
  /** Derived from chapter unlock for the current user (always false for admin). */
  isLocked?: boolean;
  episodeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  name: string;
  description: string;
  /** Required on create; send `null` on update to clear. */
  imageUrl?: string | null;
  /** Chapter that unlocks this location (required on create). */
  chapterId: string | null;
  /** Optional — replaces linked characters on update; omit to leave unchanged. */
  characterIds?: string[];
  /**
   * Optional — moves these events onto this location (sets Event.locationId).
   * Omitted events are not unlinked — reassign via the Event module.
   */
  eventIds?: string[];
}

export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface LocationListParams {
  /** When true, omit page/limit so BE returns the full filtered set. */
  all?: boolean;
  search?: string;
  episodeId?: string;
  chapterId?: string;
  page?: number;
  limit?: number;
}
