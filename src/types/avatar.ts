/**
 * Admin avatar catalog entry.
 * Mobile app lists active avatars; selecting one updates the user profile
 * (`User.avatarUrl`) with the chosen `imageUrl`.
 */
export interface Avatar {
  id: string;
  name: string;
  /** Public S3 URL under `assets/avatars/`. */
  imageUrl: string | null;
  /** When false, hidden from the mobile select-avatar screen. */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvatarInput {
  name: string;
  /** S3 public URL under `assets/avatars/`; required for a usable avatar. */
  imageUrl?: string | null;
  isActive?: boolean;
}

export type UpdateAvatarInput = Partial<CreateAvatarInput>;

export interface AvatarListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
