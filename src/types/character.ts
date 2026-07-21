export interface Character {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterInput {
  name: string;
  description?: string;
  /** Set on create; send `null` on update to clear. */
  imageUrl?: string | null;
}

export type UpdateCharacterInput = Partial<CreateCharacterInput>;

export interface CharacterListParams {
  search?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
