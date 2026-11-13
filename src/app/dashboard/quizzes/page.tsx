"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PublishBadge } from "@/components/StatusBadges";
import { ListState } from "@/components/ListState";
import { Pagination } from "@/components/Pagination";
import { QuizFiltersBar } from "@/components/quizzes/QuizFiltersBar";
import { QuizForm } from "@/components/quizzes/QuizForm";
import { useQuizzes } from "@/hooks/useQuizzes";
import {
  quizTypeLabel,
  resolveQuizChapterAccentColor,
  resolveQuizChapterTitle,
  resolveQuizEpisodeTitle,
} from "@/lib/quizzes";
import { pluralize } from "@/lib/utils";
import type {
  CreateQuizInput,
  Quiz,
  UpdateQuizInput,
} from "@/types/quiz";

const columns = [
  { label: "#", width: "2.5rem" },
  // Only unconstrained column — receives remaining width under table-fixed.
  { label: "Question" },
  // Detail cols collapse only on smaller screens; Status stays put.
  { label: "Type", hideBelow: "lg" as const, width: "6.5rem" },
  { label: "Chapter", hideBelow: "lg" as const, width: "7rem" },
  { label: "Episode", hideBelow: "lg" as const, width: "9.5rem" },
  { label: "Status", width: "5.5rem" },
  { label: "Actions", align: "right" as const, width: "5rem" },
];

const hideLg = columnHideClass("lg");
const SKELETON_ROWS = 6;
const cellPad = "px-1.5 py-2.5 sm:px-2.5 sm:py-3 md:px-3";

/** Compact type label for the narrow Type column (full name via title). */
function quizTypeShortLabel(type: string): string {
  switch (type) {
    case "TRUE_FALSE":
      return "True/False";
    case "MCQ":
      return "MCQ";
    case "IMAGE_SEQUENCE":
      return "Sequence";
    default:
      return type;
  }
}

function QuizMetaChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-tight text-[var(--text-muted)]"
      title={`${label}: ${value}`}
    >
      <span className="shrink-0 text-white/35">{label}</span>
      <span className="min-w-0 truncate text-white/70">{value}</span>
    </span>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function QuizzesTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={columns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{
              borderLeft: "2px solid transparent",
              opacity: 1 - index * 0.07,
            }}
          >
            <td className={cellPad}>
              <SkeletonBar className="h-3.5 w-4" />
            </td>
            <td className={cellPad}>
              <div className="min-w-0 space-y-1.5">
                <SkeletonBar className="h-3.5 w-[85%] max-w-[16rem]" />
                <SkeletonBar className="h-3 w-[50%] max-w-[10rem]" />
                <div className="mt-1 flex flex-wrap gap-1.5 lg:hidden">
                  <SkeletonBar className="h-5 w-16 rounded" />
                  <SkeletonBar className="h-5 w-20 rounded" />
                </div>
              </div>
            </td>
            <td className={`${cellPad} ${hideLg}`}>
              <SkeletonBar className="h-3.5 w-12" />
            </td>
            <td className={`${cellPad} ${hideLg}`}>
              <SkeletonBar className="h-3.5 w-14" />
            </td>
            <td className={`${cellPad} ${hideLg}`}>
              <SkeletonBar className="h-3.5 w-16" />
            </td>
            <td className={cellPad}>
              <SkeletonBar className="h-5 w-14 rounded-full" />
            </td>
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading quiz questions…</span>
    </div>
  );
}

export default function QuizzesPage() {
  const searchParams = useSearchParams();
  const urlChapterId = searchParams.get("chapterId") ?? "";
  const urlEpisodeId = searchParams.get("episodeId") ?? "";

  const {
    chapters,
    episodes,
    formEpisodes,
    formEpisodesLoading,
    items,
    pagination,
    totalCount,
    pageRange,
    chapterId,
    setChapterId,
    episodeId,
    setEpisodeId,
    typeFilter,
    setTypeFilter,
    searchInput,
    setSearchInput,
    clearSearch,
    hasActiveFilters,
    page,
    setPage,
    isPaginated,
    loading,
    saving,
    error,
    editingItem,
    isEditing,
    creating,
    confirmDeleteId,
    startCreate,
    startEdit,
    closeEditor,
    loadFormEpisodes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    askDelete,
    cancelDelete,
  } = useQuizzes(urlChapterId, urlEpisodeId);

  const chapterOptions = [...chapters]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((chapter) => ({
      value: chapter.id,
      label: chapter.title,
      accentColor: chapter.accentColor,
    }));

  const chapterFilterOptions = [
    { value: "", label: "All chapters" },
    ...[...chapters]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((chapter) => ({
        value: chapter.id,
        label: chapter.title,
        accentColor: chapter.accentColor,
      })),
  ];

  const episodeFilterOptions = [
    { value: "", label: chapterId ? "All episodes" : "Select chapter first" },
    ...[...episodes]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((episode) => ({ value: episode.id, label: episode.title })),
  ];

  const formEpisodeOptions = [...formEpisodes]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((episode) => ({
      value: episode.id,
      label: episode.title,
      maxQuizQuestions: episode.maxQuizQuestions ?? 5,
      quizQuestionCount: episode.quizQuestionCount ?? 0,
    }));

  const typeFilterOptions = [
    { value: "", label: "All types" },
    { value: "TRUE_FALSE", label: "True / False" },
    { value: "MCQ", label: "MCQ" },
    { value: "IMAGE_SEQUENCE", label: "Image sequence" },
  ];

  const paginationSummary =
    isPaginated && pageRange
      ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
      : undefined;

  async function handleSave(
    payload: CreateQuizInput | UpdateQuizInput,
    existing: Quiz | null
  ) {
    if (existing) {
      await updateQuiz(existing.id, payload as UpdateQuizInput);
    } else {
      await createQuiz(payload as CreateQuizInput);
    }
  }

  if (isEditing) {
    const quiz = editingItem;
    return (
      <EditView
        title={creating ? "Add Quiz Question" : "Edit Quiz Question"}
        subtitle={
          creating
            ? "Attach a question to a chapter episode"
            : quiz?.question
              ? quiz.question
              : "Update this quiz question"
        }
        onBack={closeEditor}
      >
        {error && <p className="mb-4 text-left text-sm text-red-400">{error}</p>}
        <QuizForm
          quiz={quiz}
          chapterOptions={chapterOptions}
          episodeOptions={formEpisodeOptions}
          episodesLoading={formEpisodesLoading}
          saving={saving}
          creating={creating}
          onChapterChange={(id) => void loadFormEpisodes(id)}
          onSave={(payload) => handleSave(payload, quiz)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Quiz Management"
        subtitle={
          loading
            ? "Loading quiz questions…"
            : `${pluralize(totalCount, "question")} in library`
        }
        actionLabel="Add Question"
        onAction={startCreate}
        actionDisabled={loading}
      />

      <QuizFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        chapterId={chapterId}
        onChapterChange={setChapterId}
        chapterOptions={chapterFilterOptions}
        episodeId={episodeId}
        onEpisodeChange={setEpisodeId}
        episodeOptions={episodeFilterOptions}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        typeOptions={typeFilterOptions}
        disabled={loading}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <QuizzesTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No quiz questions found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Create your first quiz question to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} embedded>
            {items.map((quiz, index) => {
              const chapterColor = resolveQuizChapterAccentColor(
                quiz,
                chapters,
                chapterId || undefined
              );
              const serialNumber = isPaginated
                ? (page - 1) * (pagination?.limit ?? items.length) + index + 1
                : index + 1;
              const typeLabel = quizTypeLabel(quiz.type);
              const typeShort = quizTypeShortLabel(quiz.type);
              const chapterTitle = resolveQuizChapterTitle(
                quiz,
                chapters,
                chapterId || undefined
              );
              const episodeTitle = resolveQuizEpisodeTitle(
                quiz,
                episodes,
                episodeId || undefined
              );

              return (
                <tr
                  key={quiz.id}
                  className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                  style={{
                    borderLeft: `2px solid ${chapterColor}`,
                  }}
                >
                  <td
                    className={`${cellPad} align-top text-xs text-[var(--text-muted)]`}
                  >
                    {serialNumber}
                  </td>
                  <td className={`${cellPad} overflow-hidden align-top`}>
                    <div className="min-w-0 w-full">
                      <p
                        className="line-clamp-2 break-words text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-base"
                        title={quiz.question}
                      >
                        {quiz.question}
                      </p>
                      {quiz.description ? (
                        <p
                          className="mt-0.5 line-clamp-1 break-words text-[11px] text-[var(--text-muted)] sm:text-xs"
                          title={quiz.description}
                        >
                          {quiz.description}
                        </p>
                      ) : null}
                      {/* Compact chips when Type/Chapter/Episode columns are hidden */}
                      <div className="mt-1.5 flex flex-wrap gap-1 lg:hidden">
                        <QuizMetaChip label="Type" value={typeShort} />
                        <QuizMetaChip label="Chapter" value={chapterTitle} />
                        <QuizMetaChip label="Episode" value={episodeTitle} />
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${cellPad} ${hideLg} overflow-hidden align-top text-[var(--text-muted)]`}
                  >
                    <p className="truncate text-xs" title={typeLabel}>
                      {typeShort}
                    </p>
                  </td>
                  <td
                    className={`${cellPad} ${hideLg} overflow-hidden align-top text-[var(--text-muted)]`}
                  >
                    <p className="truncate text-xs" title={chapterTitle}>
                      {chapterTitle}
                    </p>
                  </td>
                  <td
                    className={`${cellPad} ${hideLg} overflow-hidden align-top text-[var(--text-muted)]`}
                  >
                    <p className="truncate text-xs" title={episodeTitle}>
                      {episodeTitle}
                    </p>
                  </td>
                  <td className={`${cellPad} align-top`}>
                    <PublishBadge published={quiz.isPublished ?? false} />
                  </td>
                  <td className={`${cellPad} align-top`}>
                    <RowActions
                      confirming={confirmDeleteId === quiz.id}
                      onEdit={() => void startEdit(quiz.id)}
                      onAskDelete={() => askDelete(quiz.id)}
                      onCancelDelete={cancelDelete}
                      onConfirmDelete={() => void deleteQuiz(quiz.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </DataTable>

          {isPaginated && pagination && (
            <Pagination
              pagination={pagination}
              page={page}
              onPageChange={setPage}
              loading={loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
