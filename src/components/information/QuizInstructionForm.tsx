"use client";

import { FormEvent, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { InfoImageField } from "@/components/information/InfoImageField";
import { Textarea } from "@/components/ui/Textarea";
import { optionalField, readText } from "@/lib/utils";
import type {
  CreateQuizInstructionInput,
  QuizInstruction,
  UpdateQuizInstructionInput,
} from "@/types/quiz-instruction";

/** Persist uploaded S3 URLs; allow clearing on update when user removes the image. */
function resolveImageForSave(
  previewUrl: string,
  existingUrl: string | null | undefined
): string | undefined | null {
  if (!previewUrl) {
    return existingUrl ? null : undefined;
  }
  return optionalField(previewUrl);
}

type QuizInstructionFormProps = {
  entity: QuizInstruction | null;
  saving: boolean;
  creating: boolean;
  onSave: (
    payload: CreateQuizInstructionInput | UpdateQuizInstructionInput
  ) => Promise<void>;
  onCancel: () => void;
};

export function QuizInstructionForm({
  entity,
  saving,
  creating,
  onSave,
  onCancel,
}: QuizInstructionFormProps) {
  const [imageUrl, setImageUrl] = useState(entity?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave({
      instruction: readText(form, "instruction"),
      imageUrl: resolveImageForSave(imageUrl, entity?.imageUrl),
    });
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <InfoImageField
          value={imageUrl}
          onChange={setImageUrl}
          variant="landscape"
          uploadType="quizInstruction"
          entityId={entity?.id}
          onUploadingChange={setImageUploading}
        />
        <Textarea
          label="Instruction"
          name="instruction"
          defaultValue={entity?.instruction ?? ""}
          required
          placeholder="e.g. Tap the correct answer before time runs out."
        />
      </div>

      <FormActions
        submitLabel={
          saving
            ? "Saving…"
            : creating
              ? "Create Quiz Instruction"
              : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving || imageUploading}
      />
    </form>
  );
}
