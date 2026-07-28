"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FormActions } from "@/components/FormActions";
import { ChapterSelectField } from "@/components/chapters/ChapterSelectField";
import type { ChapterSelectOption } from "@/components/chapters/ChapterSelectField";
import { QuizImageSequenceField } from "@/components/quizzes/QuizImageSequenceField";
import { QuizMcqOptionsField } from "@/components/quizzes/QuizMcqOptionsField";
import { Checkbox } from "@/components/ui/Checkbox";
import { DarkSelectField } from "@/components/ui/DarkSelectField";
import { Textarea } from "@/components/ui/Textarea";
import {
  quizItemsForForm,
  resolveItemsForSave,
  type QuizImageSequenceFormItem,
} from "@/lib/quizzes";
import { optionalField, readCheckbox, readText } from "@/lib/utils";
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
  sequenceItems: QuizImageSequenceFormItem[]
): CreateQuizInput | UpdateQuizInput {
  const base = {
    episodeId: readText(form, "episodeId"),
    type,
    question: readText(form, "question"),
    description: optionalField(readText(form, "description")),
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

  return {
    ...base,
    items: resolveItemsForSave(sequenceItems),
  };
}

export function QuizForm({
  quiz,
  chapterOptions,
  episodeOptions,
  episodesLoading,
  saving,
  creating,
  onChapterChange,
  onSave,
  onCancel,
}: {
  quiz: Quiz | null;
  chapterOptions: ChapterSelectOption[];
  episodeOptions: {
    value: string;
    label: string;
    maxQuizQuestions?: number;
    quizQuestionCount?: number;
  }[];
  episodesLoading?: boolean;
  saving: boolean;
  creating: boolean;
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
  const [sequenceItems, setSequenceItems] = useState<QuizImageSequenceFormItem[]>(
    () => quizItemsForForm(quiz)
  );
  const [imageUploading, setImageUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const didInitChapterRef = useRef(false);

  const episodeSelectOptions = episodesLoading ? [] : episodeOptions;

  const selectedEpisode = episodeSelectOptions.find(
    (option) => option.value === episodeId
  );
  const maxQuizQuestions = selectedEpisode?.maxQuizQuestions ?? 5;
  const quizQuestionCount = selectedEpisode?.quizQuestionCount ?? 0;
  const quizAtLimit = creating && quizQuestionCount >= maxQuizQuestions;

  const episodePlaceholder = episodesLoading
    ? "Loading episodes…"
    : chapterId
      ? "Select episode"
      : "Select chapter first";

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
      setType(quiz.type);
      setMcqOptions(
        quiz.options && quiz.options.length >= 2 ? quiz.options : ["", ""]
      );
      setMcqAnswer(mcqAnswerText(quiz));
      setSequenceItems(quizItemsForForm(quiz));
    }
  }, [creating, quiz]);

  useEffect(() => {
    if (episodesLoading) return;
    if (
      episodeId &&
      episodeOptions.length > 0 &&
      !episodeOptions.some((opt) => opt.value === episodeId)
    ) {
      setEpisodeId("");
    }
  }, [episodeOptions, episodeId, episodesLoading]);

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

    if (creating && quizQuestionCount >= maxQuizQuestions) {
      setFormError(
        `This episode already has the maximum of ${maxQuizQuestions} quiz questions.`
      );
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
      if (imageUploading) {
        setFormError("Please wait for image uploads to finish.");
        return;
      }
      const persisted = resolveItemsForSave(sequenceItems);
      if (persisted.length < 2) {
        setFormError("Image sequence needs at least two images.");
        return;
      }
    }

    const form = new FormData(event.currentTarget);
    await onSave(
      buildQuizPayload(form, type, mcqOptions, mcqAnswer, sequenceItems)
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="w-full max-w-3xl space-y-4 text-left"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ChapterSelectField
          label="Chapter"
          name="chapterId"
          options={chapterOptions}
          value={chapterId}
          onChange={handleChapterChange}
          required
        />
        <div>
          <DarkSelectField
            label="Episode"
            name="episodeId"
            options={episodeSelectOptions}
            value={episodeId}
            onChange={setEpisodeId}
            placeholder={episodePlaceholder}
            required
            disabled={!chapterId || episodesLoading}
          />
          {creating && episodeId ? (
            <p
              className={`mt-1.5 text-xs ${
                quizAtLimit ? "text-red-400" : "text-[var(--text-muted)]"
              }`}
            >
              {quizQuestionCount} / {maxQuizQuestions} questions used
              {quizAtLimit ? " — limit reached" : ""}
            </p>
          ) : null}
        </div>
      </div>

      <DarkSelectField
        label="Question type"
        name="type"
        options={[...QUIZ_TYPE_OPTIONS]}
        value={type}
        onChange={(nextType) => setType(nextType as QuizType)}
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
          <DarkSelectField
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
        <QuizImageSequenceField
          items={sequenceItems}
          onChange={setSequenceItems}
          chapterId={chapterId}
          episodeId={episodeId}
          questionId={quiz?.id}
          onUploadingChange={setImageUploading}
        />
      )}

      <Textarea
        label="Description"
        name="description"
        defaultValue={quiz?.description ?? ""}
        rows={2}
        placeholder="Optional explanation shown after answering"
      />

      <div className="pb-1">
        <Checkbox
          label="Published"
          name="isPublished"
          defaultChecked={quiz?.isPublished ?? false}
        />
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
        submitDisabled={saving || imageUploading || quizAtLimit}
      />
    </form>
  );
}
