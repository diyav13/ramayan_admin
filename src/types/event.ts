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

export interface Event {
  id: string;
  name: string;
  /** HTML body for the Explore event detail screen (incl. What happens / Why it matters). */
  description: string | null;
  imageUrl: string | null;
  /** Optional primary place — character/location links are optional in admin. */
  locationId: string | null;
  location: EventLocationRef | null;
  chapterId: string | null;
  chapter: EventChapterRef | null;
  characters: EventCharacterRef[];
  characterIds: string[];
  places?: EventLocationRef[];
  episodeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  name: string;
  description: string;
  /** Set on create; send `null` on update to clear. */
  imageUrl?: string | null;
  /** Optional — events can exist without a linked place. */
  locationId?: string | null;
  chapterId: string;
  characterIds?: string[];
}

export type UpdateEventInput = Partial<
  Omit<CreateEventInput, "description">
> & {
  description?: string | null;
};

export interface EventListParams {
  /** When true, omit page/limit so BE returns the full filtered set. */
  all?: boolean;
  search?: string;
  locationId?: string;
  chapterId?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
