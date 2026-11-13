export type CharacterLocationRef = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type CharacterKeyEventRef = {
  id: string;
  name: string;
  imageUrl: string | null;
  location?: { id: string; name: string } | null;
};

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
  episodeCount?: number;
  eventCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterInput {
  name: string;
  title?: string;
  lineage?: string;
  description?: string;
  relationshipsBlurb?: string;
  /** Set on create; send `null` on update to clear. */
  imageUrl?: string | null;
  locationIds?: string[];
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
  search?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
