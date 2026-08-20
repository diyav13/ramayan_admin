import type { PaginationMeta } from "@/types/api";
import type { Chapter } from "@/types/chapter";
import type { Character } from "@/types/character";
import type { Location } from "@/types/location";
import type { QuizInstruction } from "@/types/quiz-instruction";

export type ContentType = "VIDEO" | "SLIDESHOW";

/** Nested entity returned on episode detail / list when mapped. */
export interface EpisodeEntityRef {
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
}

/** Nested quiz instruction on episode detail / list. */
export interface EpisodeQuizInstructionRef {
  id: string;
  instruction: string;
  imageUrl?: string | null;
}

/** INFO tab content returned by the app episode detail API. */
export interface EpisodeInfo {
  title: string;
  description: string | null;
}

export interface EpisodeChapterRef {
  id: string;
  title: string;
  orderIndex: number;
  isPremium: boolean;
  accentColor?: string | null;
}

export interface Episode {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  moralOfTheStory: string | null;
  infoTitle: string | null;
  infoDescription: string | null;
  maxQuizQuestions: number;
  /** Admin — total quiz questions linked to this episode. */
  quizQuestionCount?: number;
  thumbnailUrl: string | null;
  contentType: ContentType;
  videoUrl: string | null;
  slideshowData: unknown | null;
  orderIndex: number;
  durationSeconds: number | null;
  isPublished: boolean;
  accentColor: string | null;
  videoUploadStatus?:
    | "DRAFT"
    | "INITIALIZING"
    | "UPLOADING"
    | "UPLOADED"
    | "PROCESSING"
    | "READY"
    | "FAILED"
    | "CANCELLED";
  processingError?: string | null;
  characterIds?: string[];
  locationIds?: string[];
  quizInstructionIds?: string[];
  characters?: EpisodeEntityRef[];
  locations?: EpisodeEntityRef[];
  quizInstructions?: EpisodeQuizInstructionRef[];
  chapter?: EpisodeChapterRef;
  /** App episode detail — INFO tab payload. */
  info?: EpisodeInfo;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeListItem {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  moralOfTheStory?: string | null;
  infoTitle?: string | null;
  infoDescription?: string | null;
  maxQuizQuestions?: number;
  /** Admin — total quiz questions linked to this episode. */
  quizQuestionCount?: number;
  thumbnailUrl: string | null;
  contentType: ContentType;
  orderIndex: number;
  durationSeconds: number | null;
  accentColor: string | null;
  isPublished?: boolean;
  /** Present on admin listing — used for edit without a get-by-id call. */
  videoUrl?: string | null;
  slideshowData?: unknown | null;
  videoUploadStatus?: Episode["videoUploadStatus"];
  processingError?: string | null;
  characterIds?: string[];
  locationIds?: string[];
  quizInstructionIds?: string[];
  characters?: EpisodeEntityRef[];
  locations?: EpisodeEntityRef[];
  quizInstructions?: EpisodeQuizInstructionRef[];
  chapter?: EpisodeChapterRef;
  createdAt?: string;
  updatedAt?: string;
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

/** Combined admin listing response (episodes + catalogs in one call). */
export interface AdminEpisodeListingResponse {
  episodes: EpisodeListItem[];
  pagination: PaginationMeta;
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  quizInstructions: QuizInstruction[];
}

export interface AdminEpisodesByChapterResponse {
  episodes: EpisodeListItem[];
}

export interface CreateEpisodeInput {
  chapterId: string;
  title: string;
  description?: string;
  /** Set on create; send `null` on update to clear. */
  moralOfTheStory?: string | null;
  infoTitle?: string | null;
  infoDescription?: string | null;
  maxQuizQuestions?: number;
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
  /** Required 1–4 quiz instruction cards for the episode. */
  quizInstructionIds?: string[];
}

export type UpdateEpisodeInput = Partial<CreateEpisodeInput>;

export interface EpisodeThumbnailUploadUrlInput {
  fileName: string;
  contentType: string;
  /** Asset folder — episode (default), character, location, or quiz instruction. */
  type?: "episode" | "character" | "location" | "quizInstruction" | "avatar" | "misc";
  /** Existing character / location / quiz-instruction / episode id for the S3 folder. */
  entityId?: string;
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
