"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorField } from "@/components/ui/ColorField";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { FormActions } from "@/components/FormActions";
import { PublishBadge, PremiumLabel } from "@/components/StatusBadges";
import { useCrud } from "@/hooks/useCrud";
import {
  generateId,
  pluralize,
  readCheckbox,
  readNumber,
  readText,
  today,
} from "@/lib/utils";
import { initialChapters, type Chapter } from "@/lib/chapters";

const columns = [
  { label: "#" },
  { label: "Chapter" },
  { label: "Status" },
  { label: "Access" },
  { label: "Updated" },
  { label: "Actions", align: "right" as const },
];

export default function ChaptersPage() {
  const crud = useCrud<Chapter>(initialChapters);
  const sorted = [...crud.items].sort((a, b) => a.orderIndex - b.orderIndex);

  function handleSave(e: FormEvent<HTMLFormElement>, existing: Chapter | null) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data = {
      title: readText(form, "title"),
      tagline: readText(form, "tagline"),
      description: readText(form, "description"),
      accentColor: readText(form, "accentColor"),
      thumbnailUrl: readText(form, "thumbnailUrl"),
      orderIndex: readNumber(form, "orderIndex"),
      isPublished: readCheckbox(form, "isPublished"),
      isPremium: readCheckbox(form, "isPremium"),
    };

    if (existing) {
      crud.updateItem(existing.id, { ...data, updatedAt: today() });
    } else {
      crud.addItem({
        ...data,
        id: generateId("ch"),
        createdAt: today(),
        updatedAt: today(),
      });
    }
    crud.closeEditor();
  }

  if (crud.isEditing) {
    const chapter = crud.editingItem;
    return (
      <EditView
        title={crud.creating ? "Add Chapter" : "Edit Chapter"}
        subtitle={
          crud.creating
            ? "Create a new chapter"
            : `Editing ${chapter?.title ?? "chapter"}`
        }
      >
        <ChapterForm
          chapter={chapter}
          onSave={(e) => handleSave(e, chapter)}
          onCancel={crud.closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chapter Management"
        subtitle={`${pluralize(crud.items.length, "chapter")} total`}
        actionLabel="Add Chapter"
        onAction={crud.startCreate}
      />

      <DataTable columns={columns} minWidth={760}>
        {sorted.map((chapter) => (
          <tr
            key={chapter.id}
            className="border-b border-white/5 last:border-0 hover:bg-white/5"
          >
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {chapter.orderIndex}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-8 shrink-0 rounded"
                  style={{ backgroundColor: chapter.accentColor }}
                />
                <div>
                  <p className="font-serif capitalize text-white">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {chapter.tagline}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <PublishBadge published={chapter.isPublished} />
            </td>
            <td className="px-4 py-3">
              <PremiumLabel premium={chapter.isPremium} />
            </td>
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {chapter.updatedAt}
            </td>
            <td className="px-4 py-3">
              <RowActions
                confirming={crud.confirmDeleteId === chapter.id}
                onEdit={() => crud.startEdit(chapter.id)}
                onAskDelete={() => crud.askDelete(chapter.id)}
                onCancelDelete={crud.cancelDelete}
                onConfirmDelete={() => {
                  crud.removeItem(chapter.id);
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

function ChapterForm({
  chapter,
  onSave,
  onCancel,
}: {
  chapter: Chapter | null;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" defaultValue={chapter?.title} required />
        <Input label="Tagline" name="tagline" defaultValue={chapter?.tagline} />
      </div>
      <Textarea
        label="Description"
        name="description"
        defaultValue={chapter?.description}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Order"
          name="orderIndex"
          type="number"
          min={0}
          defaultValue={chapter?.orderIndex ?? 0}
        />
        <ColorField
          label="Accent Color"
          name="accentColor"
          defaultValue={chapter?.accentColor}
        />
        <Input
          label="Thumbnail URL"
          name="thumbnailUrl"
          placeholder="https://…"
          defaultValue={chapter?.thumbnailUrl}
        />
      </div>
      <div className="flex gap-6">
        <Checkbox
          label="Published"
          name="isPublished"
          defaultChecked={chapter?.isPublished}
        />
        <Checkbox
          label="Premium"
          name="isPremium"
          defaultChecked={chapter?.isPremium}
        />
      </div>
      <FormActions
        submitLabel={chapter ? "Save Changes" : "Create Chapter"}
        onCancel={onCancel}
      />
    </form>
  );
}
