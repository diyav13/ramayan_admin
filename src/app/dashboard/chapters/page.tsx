"use client";

import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListState } from "@/components/ListState";
import { ChapterForm } from "@/components/chapters/ChapterForm";
import { PublishBadge, PremiumLabel } from "@/components/StatusBadges";
import { useChapters } from "@/hooks/useChapters";
import { formatDate, pluralize } from "@/lib/utils";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

const columns = [
  { label: "#" },
  { label: "Chapter" },
  { label: "Status" },
  { label: "Access" },
  { label: "Updated" },
  { label: "Actions", align: "right" as const },
];

export default function ChaptersPage() {
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
        title={creating ? "Add Chapter" : "Edit Chapter"}
        subtitle={
          creating
            ? "Create a new chapter"
            : `Editing ${chapter?.title ?? "chapter"}`
        }
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
    <div className="space-y-5">
      <PageHeader
        title="Chapter Management"
        subtitle={
          loading
            ? "Loading chapters…"
            : `${pluralize(items.length, "chapter")} total`
        }
        actionLabel="Add Chapter"
        onAction={startCreate}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ListState message="Loading chapters…" />
      ) : items.length === 0 ? (
        <ListState
          message="No chapters found"
          hint="Create your first chapter to get started."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} minWidth={760} embedded>
            {sorted.map((chapter) => (
              <tr
                key={chapter.id}
                className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3.5 text-[var(--text-muted)]">
                  {chapter.orderIndex + 1}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-8 shrink-0 rounded"
                      style={{ backgroundColor: chapter.accentColor ?? "#666" }}
                    />
                    <div>
                      <p className="font-serif capitalize text-white">
                        {chapter.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {chapter.tagline ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <PublishBadge published={chapter.isPublished} />
                </td>
                <td className="px-4 py-3.5">
                  <PremiumLabel premium={chapter.isPremium} />
                </td>
                <td className="px-4 py-3.5 text-[var(--text-muted)]">
                  {formatDate(chapter.updatedAt)}
                </td>
                <td className="px-4 py-3.5">
                  <RowActions
                    confirming={confirmDeleteId === chapter.id}
                    onEdit={() => startEdit(chapter.id)}
                    onAskDelete={() => askDelete(chapter.id)}
                    onCancelDelete={cancelDelete}
                    onConfirmDelete={() => void deleteChapter(chapter.id)}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
