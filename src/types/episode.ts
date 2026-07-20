export type ContentType = "VIDEO" | "SLIDESHOW";

/** Nested entity returned on episode detail / list when mapped. */
export interface EpisodeEntityRef {
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
}

export interface Episode {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  moralOfTheStory: string | null;
  thumbnailUrl: string | null;
  contentType: ContentType;
  videoUrl: string | null;
  slideshowData: unknown | null;
  orderIndex: number;
  durationSeconds: number | null;
  isPublished: boolean;
  accentColor: string | null;
  characterIds?: string[];
  locationIds?: string[];
  characters?: EpisodeEntityRef[];
  locations?: EpisodeEntityRef[];
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeListItem {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  moralOfTheStory?: string | null;
  thumbnailUrl: string | null;
  contentType: ContentType;
  orderIndex: number;
  durationSeconds: number | null;
  accentColor: string | null;
  isPublished?: boolean;
  characterIds?: string[];
  locationIds?: string[];
  characters?: EpisodeEntityRef[];
  locations?: EpisodeEntityRef[];
  chapter?: {
    id: string;
    title: string;
    orderIndex: number;
    isPremium: boolean;
    accentColor?: string | null;
  };
}

export type EpisodeListUserRole = "admin";

export interface EpisodeListParams {
  chapterId?: string;
  contentType?: ContentType;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  userRole?: EpisodeListUserRole;
}

export interface CreateEpisodeInput {
  chapterId: string;
  title: string;
  description?: string;
  /** Set on create; send `null` on update to clear. */
  moralOfTheStory?: string | null;
  /** Set on create; send `null` on update to clear. */
  thumbnailUrl?: string | null;
  contentType?: ContentType;
  videoUrl?: string;
  slideshowData?: unknown | null;
  orderIndex: number;
  durationSeconds?: number;
  isPublished?: boolean;
  accentColor?: string;
  characterIds?: string[];
  locationIds?: string[];
}

export type UpdateEpisodeInput = Partial<CreateEpisodeInput>;

export interface EpisodeThumbnailUploadUrlInput {
  fileName: string;
  contentType: string;
  /** Omit for create (draft folder); pass when replacing an existing episode thumbnail. */
  episodeId?: string;
}

export interface EpisodeThumbnailUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
  headers?: Record<string, string>;
}
