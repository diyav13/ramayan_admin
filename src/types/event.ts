export type EventCharacterRef = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type EventLocationRef = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type EventChapterRef = {
  id: string;
  title: string;
  orderIndex: number;
};

/** Figma “What happens” beat on the event detail screen. */
export type EventWhatHappensBeat = {
  label: string;
  text: string;
};

export interface Event {
  id: string;
  name: string;
  /** HTML body for the Explore event detail screen. */
  description: string | null;
  whyItMatters: string | null;
  whatHappens: EventWhatHappensBeat[];
  imageUrl: string | null;
  locationId: string;
  location: EventLocationRef;
  chapterId: string | null;
  chapter: EventChapterRef | null;
  orderIndex: number;
  characters: EventCharacterRef[];
  characterIds: string[];
  places?: EventLocationRef[];
  episodeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  name: string;
  description?: string;
  whyItMatters?: string;
  whatHappens?: EventWhatHappensBeat[];
  /** Set on create; send `null` on update to clear. */
  imageUrl?: string | null;
  locationId: string;
  chapterId?: string | null;
  orderIndex?: number;
  characterIds?: string[];
}

export type UpdateEventInput = Partial<
  Omit<CreateEventInput, "description" | "whyItMatters" | "whatHappens">
> & {
  description?: string | null;
  whyItMatters?: string | null;
  whatHappens?: EventWhatHappensBeat[] | null;
};

export interface EventListParams {
  search?: string;
  locationId?: string;
  chapterId?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
