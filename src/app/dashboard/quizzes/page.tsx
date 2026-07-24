"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
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
  { label: "#" },
  { label: "Question" },
  { label: "Type" },
  { label: "Chapter" },
  { label: "Episode" },
  { label: "Status" },
  { label: "Actions", align: "right" as const },
];

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
    .map((episode) => ({ value: episode.id, label: episode.title }));

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
          defaultDisplayOrder={
            items.length > 0
              ? Math.max(...items.map((item) => item.orderIndex)) + 2
              : 1
          }
          onChapterChange={(id) => void loadFormEpisodes(id)}
          onSave={(payload) => handleSave(payload, quiz)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quiz Management"
        subtitle={
          loading
            ? "Loading quiz questions…"
            : `${pluralize(totalCount, "question")} in library`
        }
        actionLabel="Add Question"
        onAction={startCreate}
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
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ListState message="Loading quiz questions…" />
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
          <DataTable columns={columns} minWidth={900} embedded>
            {items.map((quiz) => {
              const chapterColor = resolveQuizChapterAccentColor(
                quiz,
                chapters,
                chapterId || undefined
              );

              return (
              <tr
                key={quiz.id}
                className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                style={{
                  borderLeft: `2px solid ${chapterColor}`,
                }}
              >
                <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                  {quiz.orderIndex + 1}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <p className="line-clamp-2 font-serif text-[15px] text-white">
                    {quiz.question}
                  </p>
                  {quiz.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">
                      {quiz.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                  {quizTypeLabel(quiz.type)}
                </td>
                <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                  {resolveQuizChapterTitle(
                    quiz,
                    chapters,
                    chapterId || undefined
                  )}
                </td>
                <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                  {resolveQuizEpisodeTitle(
                    quiz,
                    episodes,
                    episodeId || undefined
                  )}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <PublishBadge published={quiz.isPublished ?? false} />
                </td>
                <td className="px-4 py-3.5 align-top">
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
