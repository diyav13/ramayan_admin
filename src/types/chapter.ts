export interface Chapter {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  orderIndex: number;
  isPremium: boolean;
  isPublished: boolean;
  accentColor: string | null;
  tagline: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { episodes: number };
}

export interface CreateChapterInput {
  title: string;
  description?: string;
  /** Set on create; send `null` on update to clear. */
  thumbnailUrl?: string | null;
  orderIndex: number;
  isPremium?: boolean;
  isPublished?: boolean;
  accentColor?: string;
  tagline?: string;
}

export type UpdateChapterInput = Partial<CreateChapterInput>;

export interface ReorderChapterInput {
  id: string;
  orderIndex: number;
}

export interface ReorderChaptersPayload {
  chapters: ReorderChapterInput[];
}

export interface ChapterThumbnailUploadUrlInput {
  fileName: string;
  contentType: string;
  /** Omit for create (draft folder); pass when replacing an existing chapter thumbnail. */
  entityId?: string;
}

export interface ChapterThumbnailUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
  headers?: Record<string, string>;
}
