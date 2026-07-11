export interface Location {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export type UpdateLocationInput = Partial<CreateLocationInput>;

export interface LocationListParams {
  search?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
