"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListState } from "@/components/ListState";
import { ChapterForm } from "@/components/chapters/ChapterForm";
import { PublishBadge, PremiumLabel } from "@/components/StatusBadges";
import { useChapters } from "@/hooks/useChapters";
import { pluralize } from "@/lib/utils";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

const columns = [
  { label: "#", width: "2.25rem" },
  { label: "Chapter" }, // fluid — absorbs space reclaimed from meta cols
  {
    label: "Status",
    hideBelow: "md" as const,
    width: "5.5rem",
    align: "right" as const,
  },
  {
    label: "Access",
    hideBelow: "md" as const,
    width: "4.5rem",
    align: "right" as const,
  },
  {
    label: "Eps",
    hideBelow: "md" as const,
    width: "2.75rem",
    align: "right" as const,
  },
  { label: "Actions", align: "right" as const, width: "7.25rem" },
];

const hideMd = columnHideClass("md");
/** Tighter pad for Status / Access / Eps so they pack toward Actions. */
const metaPad = "px-1 py-2.5 sm:px-1.5 sm:py-3.5 md:px-2";

const SKELETON_ROWS = 6;

const chapterThumbClass =
  "h-8 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/10 sm:h-10 sm:w-14 sm:rounded-lg";

function ChapterThumb({
  title,
  thumbnailUrl,
}: {
  title: string;
  thumbnailUrl: string | null;
}) {
  if (thumbnailUrl) {
    return (
      <img src={thumbnailUrl} alt={title} className={chapterThumbClass} />
    );
  }

  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${chapterThumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";

function ChaptersTableSkeleton() {
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
              <div className="flex items-center gap-2 sm:gap-3">
                <SkeletonBar className="h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[10rem]" />
                  <SkeletonBar className="h-3 w-[45%] max-w-[7rem]" />
                </div>
              </div>
            </td>
            <td className={`${metaPad} ${hideMd}`}>
              <div className="flex justify-end">
                <SkeletonBar className="h-5 w-14 rounded-full" />
              </div>
            </td>
            <td className={`${metaPad} ${hideMd}`}>
              <div className="flex justify-end">
                <SkeletonBar className="h-3.5 w-10" />
              </div>
            </td>
            <td className={`${metaPad} ${hideMd}`}>
              <div className="flex justify-end">
                <SkeletonBar className="h-3.5 w-4" />
              </div>
            </td>
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading chapters…</span>
    </div>
  );
}

export default function ChaptersPage() {
  const router = useRouter();
  const {
    items,
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
    createChapter,
    updateChapter,
    deleteChapter,
    askDelete,
    cancelDelete,
  } = useChapters();

  const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  async function handleSave(
    payload: CreateChapterInput | UpdateChapterInput,
    existing: Chapter | null
  ) {
    if (existing) {
      await updateChapter(existing.id, payload as UpdateChapterInput);
    } else {
      await createChapter(payload as CreateChapterInput);
    }
  }

  if (isEditing) {
    const chapter = editingItem;
    return (
      <EditView
        title={creating ? "Add Chapter" : chapter?.title ?? "Chapter"}
        subtitle={creating ? "Create a new chapter" : "Edit Chapter"}
        onBack={closeEditor}
      >
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <ChapterForm
          chapter={chapter}
          saving={saving}
          creating={creating}
          defaultDisplayOrder={sorted.length + 1}
          onSave={(payload) => handleSave(payload, chapter)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Chapter Management"
        subtitle={
          loading
            ? "Loading chapters…"
            : `${pluralize(items.length, "chapter")} total`
        }
        actionLabel="Add Chapter"
        onAction={startCreate}
        actionDisabled={loading}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ChaptersTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No chapters found"
          hint="Create your first chapter to get started."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} embedded>
            {sorted.map((chapter) => {
              const episodeCount = chapter._count?.episodes ?? 0;

              return (
                <tr
                  key={chapter.id}
                  className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
                  style={{
                    borderLeft: `2px solid ${chapter.accentColor ?? "#666"}`,
                  }}
                >
                  <td
                    className={`${cellPad} text-[var(--text-muted)] align-middle`}
                  >
                    {chapter.orderIndex + 1}
                  </td>
                  <td className={`${cellPad} overflow-hidden align-middle`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <ChapterThumb
                        title={chapter.title}
                        thumbnailUrl={chapter.thumbnailUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9375rem] font-semibold capitalize tracking-[-0.01em] text-white sm:text-base">
                          {chapter.title}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-muted)] sm:text-xs">
                          {chapter.tagline ?? "—"}
                        </p>
                        {/* Mobile-only meta: replaces Status / Access / Episodes cols */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                          <PublishBadge published={chapter.isPublished} />
                          <PremiumLabel premium={chapter.isPremium} />
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {episodeCount} ep
                            {episodeCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${metaPad} ${hideMd} align-middle text-right`}
                  >
                    <PublishBadge published={chapter.isPublished} />
                  </td>
                  <td
                    className={`${metaPad} ${hideMd} align-middle text-right`}
                  >
                    <PremiumLabel premium={chapter.isPremium} />
                  </td>
                  <td
                    className={`${metaPad} ${hideMd} align-middle text-right tabular-nums text-[var(--text-muted)]`}
                  >
                    {episodeCount}
                  </td>
                  <td className={`${cellPad} align-middle`}>
                    <RowActions
                      confirming={confirmDeleteId === chapter.id}
                      onEpisodes={() =>
                        router.push(
                          `/dashboard/episodes?chapterId=${chapter.id}`
                        )
                      }
                      onEdit={() => startEdit(chapter.id)}
                      onAskDelete={() => askDelete(chapter.id)}
                      onCancelDelete={cancelDelete}
                      onConfirmDelete={() => void deleteChapter(chapter.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
      )}
    </div>
  );
}
