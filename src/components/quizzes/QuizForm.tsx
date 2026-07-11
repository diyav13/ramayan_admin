"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { QuizImageSequenceField } from "@/components/quizzes/QuizImageSequenceField";
import { QuizMcqOptionsField } from "@/components/quizzes/QuizMcqOptionsField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { imagesInCorrectOrder } from "@/lib/quizzes";
import { optionalField, readCheckbox, readNumber, readText } from "@/lib/utils";
import type {
  CreateQuizInput,
  Quiz,
  QuizType,
  UpdateQuizInput,
} from "@/types/quiz";

const QUIZ_TYPE_OPTIONS = [
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "MCQ", label: "MCQ" },
  { value: "IMAGE_SEQUENCE", label: "Image sequence" },
] as const;

const TRUE_FALSE_OPTIONS = [
  { value: "true", label: "True" },
  { value: "false", label: "False" },
];

/** While upload API is disabled, ignore local blob previews when saving. */
function resolveImagesForSave(
  images: string[],
  existingImages: string[] | null | undefined
): string[] {
  const persisted = images.filter((url) => url && !url.startsWith("blob:"));
  if (persisted.length > 0) return persisted;
  if (existingImages && existingImages.length > 0) return existingImages;
  return [];
}

function toApiOrder(displayOrder: number): number {
  return Math.max(0, displayOrder - 1);
}

function mcqAnswerText(quiz: Quiz | null): string {
  if (!quiz || quiz.type !== "MCQ" || !quiz.options) return "";
  if (typeof quiz.answer === "number") {
    return quiz.options[quiz.answer] ?? "";
  }
  return typeof quiz.answer === "string" ? quiz.answer : "";
}

function trueFalseDefault(quiz: Quiz | null): string {
  if (!quiz || quiz.type !== "TRUE_FALSE") return "true";
  if (typeof quiz.answer === "boolean") return quiz.answer ? "true" : "false";
  return String(quiz.answer);
}

function buildQuizPayload(
  form: FormData,
  type: QuizType,
  mcqOptions: string[],
  mcqAnswer: string,
  images: string[],
  existingImages: string[] | null | undefined
): CreateQuizInput | UpdateQuizInput {
  const base = {
    episodeId: readText(form, "episodeId"),
    type,
    question: readText(form, "question"),
    description: optionalField(readText(form, "description")),
    orderIndex: toApiOrder(readNumber(form, "orderIndex")),
    isPublished: readCheckbox(form, "isPublished"),
  };

  if (type === "TRUE_FALSE") {
    return {
      ...base,
      answer: readText(form, "answer") === "true",
    };
  }

  if (type === "MCQ") {
    const options = mcqOptions.map((opt) => opt.trim()).filter(Boolean);
    const answerIndex = options.findIndex((opt) => opt === mcqAnswer.trim());
    return {
      ...base,
      options,
      answer: answerIndex >= 0 ? answerIndex : 0,
    };
  }

  const resolvedImages = resolveImagesForSave(images, existingImages);
  return {
    ...base,
    images: resolvedImages,
    // Images are stored in correct order; answer is identity indices.
    answer: resolvedImages.map((_, i) => i),
  };
}

export function QuizForm({
  quiz,
  chapterOptions,
  episodeOptions,
  episodesLoading,
  saving,
  creating,
  defaultDisplayOrder = 1,
  onChapterChange,
  onSave,
  onCancel,
}: {
  quiz: Quiz | null;
  chapterOptions: { value: string; label: string }[];
  episodeOptions: { value: string; label: string }[];
  episodesLoading?: boolean;
  saving: boolean;
  creating: boolean;
  defaultDisplayOrder?: number;
  onChapterChange: (chapterId: string) => void;
  onSave: (payload: CreateQuizInput | UpdateQuizInput) => Promise<void>;
  onCancel: () => void;
}) {
  const initialChapterId =
    quiz?.chapterId ??
    quiz?.episode?.chapterId ??
    quiz?.episode?.chapter?.id ??
    "";

  const [chapterId, setChapterId] = useState(initialChapterId);
  const [episodeId, setEpisodeId] = useState(quiz?.episodeId ?? "");
  const [type, setType] = useState<QuizType>(quiz?.type ?? "TRUE_FALSE");
  const [mcqOptions, setMcqOptions] = useState<string[]>(
    quiz?.options && quiz.options.length >= 2 ? quiz.options : ["", ""]
  );
  const [mcqAnswer, setMcqAnswer] = useState(mcqAnswerText(quiz));
  const [images, setImages] = useState<string[]>(() =>
    imagesInCorrectOrder(quiz?.images, quiz?.answer)
  );
  const [formError, setFormError] = useState<string | null>(null);

  const displayOrder = quiz ? quiz.orderIndex + 1 : defaultDisplayOrder;
  const didInitChapterRef = useRef(false);

  const chapterSelectOptions = [
    { value: "", label: "Select chapter" },
    ...chapterOptions,
  ];

  const episodeSelectOptions = episodesLoading
    ? [{ value: "", label: "Loading episodes…" }]
    : [
        {
          value: "",
          label: chapterId ? "Select episode" : "Select chapter first",
        },
        ...episodeOptions,
      ];

  useEffect(() => {
    if (didInitChapterRef.current) return;
    didInitChapterRef.current = true;
    if (chapterId) {
      onChapterChange(chapterId);
    }
  }, [chapterId, onChapterChange]);

  useEffect(() => {
    if (!creating && quiz) {
      const nextChapter =
        quiz.chapterId ??
        quiz.episode?.chapterId ??
        quiz.episode?.chapter?.id ??
        "";
      if (nextChapter) setChapterId(nextChapter);
      setEpisodeId(quiz.episodeId);
      setImages(imagesInCorrectOrder(quiz.images, quiz.answer));
    }
  }, [creating, quiz]);

  useEffect(() => {
    if (
      episodeId &&
      episodeOptions.length > 0 &&
      !episodeOptions.some((opt) => opt.value === episodeId)
    ) {
      setEpisodeId("");
    }
  }, [episodeOptions, episodeId]);

  function handleChapterChange(nextChapterId: string) {
    setChapterId(nextChapterId);
    setEpisodeId("");
    onChapterChange(nextChapterId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!chapterId) {
      setFormError("Please select a chapter.");
      return;
    }
    if (!episodeId) {
      setFormError("Please select an episode.");
      return;
    }

    if (type === "MCQ") {
      const filled = mcqOptions.map((opt) => opt.trim()).filter(Boolean);
      if (filled.length < 2) {
        setFormError("MCQ questions need at least two options.");
        return;
      }
      if (!mcqAnswer.trim() || !filled.includes(mcqAnswer.trim())) {
        setFormError("Please select a valid correct answer.");
        return;
      }
    }

    if (type === "IMAGE_SEQUENCE") {
      const hasPersisted = images.some((url) => !url.startsWith("blob:"));
      const hasExisting = (quiz?.images?.length ?? 0) > 0;
      if (!hasPersisted && !hasExisting && images.length < 2) {
        setFormError("Image sequence needs at least two images.");
        return;
      }
      if (images.length < 2 && !hasExisting) {
        setFormError("Image sequence needs at least two images.");
        return;
      }
    }

    const form = new FormData(event.currentTarget);
    const payload = buildQuizPayload(
      form,
      type,
      mcqOptions,
      mcqAnswer,
      images,
      quiz?.images
    );
    await onSave(payload);
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="w-full max-w-3xl space-y-4 text-left"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Chapter"
          name="chapterId"
          options={chapterSelectOptions}
          value={chapterId}
          onChange={(e) => handleChapterChange(e.target.value)}
          required
        />
        <Select
          label="Episode"
          name="episodeId"
          options={episodeSelectOptions}
          value={episodeId}
          onChange={(e) => setEpisodeId(e.target.value)}
          required
          disabled={!chapterId || episodesLoading}
        />
      </div>

      <Select
        label="Question type"
        name="type"
        options={[...QUIZ_TYPE_OPTIONS]}
        value={type}
        onChange={(e) => setType(e.target.value as QuizType)}
        required
      />

      <Textarea
        label="Question"
        name="question"
        defaultValue={quiz?.question ?? ""}
        required
        rows={3}
      />

      {type === "TRUE_FALSE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Correct answer"
            name="answer"
            options={TRUE_FALSE_OPTIONS}
            defaultValue={trueFalseDefault(quiz)}
            required
          />
        </div>
      )}

      {type === "MCQ" && (
        <QuizMcqOptionsField
          options={mcqOptions}
          answer={mcqAnswer}
          onOptionsChange={setMcqOptions}
          onAnswerChange={setMcqAnswer}
        />
      )}

      {type === "IMAGE_SEQUENCE" && (
        <QuizImageSequenceField images={images} onChange={setImages} />
      )}

      <Textarea
        label="Description"
        name="description"
        defaultValue={quiz?.description ?? ""}
        rows={2}
        placeholder="Optional explanation shown after answering"
      />

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-28 shrink-0">
          <Input
            label="Order"
            name="orderIndex"
            type="number"
            min={1}
            defaultValue={displayOrder}
          />
        </div>
        <div className="pb-4">
          <Checkbox
            label="Published"
            name="isPublished"
            defaultChecked={quiz?.isPublished ?? false}
          />
        </div>
      </div>

      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <FormActions
        submitLabel={
          saving
            ? "Saving…"
            : creating
              ? "Create Question"
              : "Save Changes"
        }
        onCancel={onCancel}
        submitDisabled={saving}
      />
    </form>
  );
}
