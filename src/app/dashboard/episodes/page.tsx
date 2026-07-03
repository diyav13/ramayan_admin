"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { FormActions } from "@/components/FormActions";
import { PublishBadge } from "@/components/StatusBadges";
import { useCrud } from "@/hooks/useCrud";
import {
  generateId,
  pluralize,
  readCheckbox,
  readNumber,
  readText,
  today,
} from "@/lib/utils";
import { initialChapters } from "@/lib/chapters";
import { formatDuration, initialEpisodes, type Episode } from "@/lib/episodes";

const columns = [
  { label: "#" },
  { label: "Episode" },
  { label: "Chapter" },
  { label: "Duration" },
  { label: "Status" },
  { label: "Actions", align: "right" as const },
];

const chapterOptions = [...initialChapters]
  .sort((a, b) => a.orderIndex - b.orderIndex)
  .map((c) => ({ value: c.id, label: c.title }));

const findChapter = (id: string) => initialChapters.find((c) => c.id === id);
const chapterTitle = (id: string) => findChapter(id)?.title ?? "—";
const chapterAccent = (id: string) => findChapter(id)?.accentColor ?? "#e8a020";

export default function EpisodesPage() {
  const crud = useCrud<Episode>(initialEpisodes);
  const sorted = [...crud.items].sort(
    (a, b) =>
      a.chapterId.localeCompare(b.chapterId) || a.orderIndex - b.orderIndex
  );

  function handleSave(e: FormEvent<HTMLFormElement>, existing: Episode | null) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data = {
      chapterId: readText(form, "chapterId"),
      title: readText(form, "title"),
      description: readText(form, "description"),
      thumbnailUrl: readText(form, "thumbnailUrl"),
      videoUrl: readText(form, "videoUrl"),
      orderIndex: readNumber(form, "orderIndex"),
      durationSeconds: readNumber(form, "durationSeconds"),
      isPublished: readCheckbox(form, "isPublished"),
    };

    if (existing) {
      crud.updateItem(existing.id, { ...data, updatedAt: today() });
    } else {
      crud.addItem({
        ...data,
        id: generateId("ep"),
        createdAt: today(),
        updatedAt: today(),
      });
    }
    crud.closeEditor();
  }

  if (crud.isEditing) {
    const episode = crud.editingItem;
    return (
      <EditView
        title={crud.creating ? "Add Episode" : "Edit Episode"}
        subtitle={
          crud.creating
            ? "Create a new episode"
            : `Editing ${episode?.title ?? "episode"}`
        }
      >
        <EpisodeForm
          episode={episode}
          onSave={(e) => handleSave(e, episode)}
          onCancel={crud.closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Episode Management"
        subtitle={`${pluralize(crud.items.length, "episode")} total`}
        actionLabel="Add Episode"
        onAction={crud.startCreate}
      />

      <DataTable columns={columns}>
        {sorted.map((episode) => (
          <tr
            key={episode.id}
            className="border-b border-white/5 last:border-0 hover:bg-white/5"
          >
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {episode.orderIndex}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-8 shrink-0 rounded"
                  style={{ backgroundColor: chapterAccent(episode.chapterId) }}
                />
                <div>
                  <p className="font-serif capitalize text-white">
                    {episode.title}
                  </p>
                  <p className="line-clamp-1 max-w-xs text-xs text-[var(--text-muted)]">
                    {episode.description}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {chapterTitle(episode.chapterId)}
            </td>
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {formatDuration(episode.durationSeconds)}
            </td>
            <td className="px-4 py-3">
              <PublishBadge published={episode.isPublished} />
            </td>
            <td className="px-4 py-3">
              <RowActions
                confirming={crud.confirmDeleteId === episode.id}
                onEdit={() => crud.startEdit(episode.id)}
                onAskDelete={() => crud.askDelete(episode.id)}
                onCancelDelete={crud.cancelDelete}
                onConfirmDelete={() => {
                  crud.removeItem(episode.id);
                  crud.cancelDelete();
                }}
              />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function EpisodeForm({
  episode,
  onSave,
  onCancel,
}: {
  episode: Episode | null;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" defaultValue={episode?.title} required />
        <Select
          label="Chapter"
          name="chapterId"
          options={chapterOptions}
          defaultValue={episode?.chapterId ?? chapterOptions[0]?.value}
        />
      </div>
      <Textarea
        label="Description"
        name="description"
        defaultValue={episode?.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Order"
          name="orderIndex"
          type="number"
          min={0}
          defaultValue={episode?.orderIndex ?? 0}
        />
        <Input
          label="Duration (seconds)"
          name="durationSeconds"
          type="number"
          min={0}
          defaultValue={episode?.durationSeconds ?? 0}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Thumbnail URL"
          name="thumbnailUrl"
          placeholder="https://…"
          defaultValue={episode?.thumbnailUrl}
        />
        <Input
          label="Video URL"
          name="videoUrl"
          placeholder="https://…"
          defaultValue={episode?.videoUrl}
        />
      </div>
      <Checkbox
        label="Published"
        name="isPublished"
        defaultChecked={episode?.isPublished}
      />
      <FormActions
        submitLabel={episode ? "Save Changes" : "Create Episode"}
        onCancel={onCancel}
      />
    </form>
  );
}
