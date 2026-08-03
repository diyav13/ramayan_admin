export interface QuizInstruction {
  id: string;
  instruction: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizInstructionInput {
  instruction: string;
  /** Set on create; send `null` on update to clear. */
  imageUrl?: string | null;
}

export type UpdateQuizInstructionInput = Partial<CreateQuizInstructionInput>;

export interface QuizInstructionListParams {
  search?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}
