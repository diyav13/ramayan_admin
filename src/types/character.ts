export type CharacterLocationRef = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type CharacterEventRef = {
  id: string;
  name: string;
  imageUrl: string | null;
  location?: { id: string; name: string } | null;
};

export type CharacterKeyEventRef = CharacterEventRef;

export interface Character {
  id: string;
  name: string;
  /** Explore list subtitle / short role (e.g. "Prince of Ayodhya"). */
  title: string | null;
  /** Explore detail meta (e.g. "IKSHVAKU DYNASTY · KOSALA"). */
  lineage: string | null;
  /** Dive Deeper + Explore biography. */
  description: string | null;
  /** Explore relationships intro (no graph). */
  relationshipsBlurb: string | null;
  imageUrl: string | null;
  keyEventId: string | null;
  keyEvent: CharacterKeyEventRef | null;
  locations: CharacterLocationRef[];
  locationIds: string[];
  /** Events linked via Event.characterIds (read-only on Character form). */
  events?: CharacterEventRef[];
  eventIds?: string[];
  episodeCount?: number;
  eventCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterInput {
  name: string;
  title: string;
  lineage: string;
  description: string;
  relationshipsBlurb: string;
  /** Required on create; send `null` on update to clear. */
  imageUrl?: string | null;
  /** Optional journey places. */
  locationIds?: string[];
  /** Optional key event. */
  keyEventId?: string | null;
}

export type UpdateCharacterInput = Partial<
  Omit<CreateCharacterInput, "description" | "title" | "lineage" | "relationshipsBlurb">
> & {
  title?: string | null;
  lineage?: string | null;
  description?: string | null;
  relationshipsBlurb?: string | null;
};

export interface CharacterListParams {
  /** When true, omit page/limit so BE returns the full filtered set. */
  all?: boolean;
  search?: string;
  episodeId?: string;
  /** Characters linked to this place (or via events there). */
  locationId?: string;
  page?: number;
  limit?: number;
}
