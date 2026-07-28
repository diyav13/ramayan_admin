"use client";

import { useEffect, useState } from "react";
import { createInflightDedupe } from "@/lib/api/inflight";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { getErrorMessage } from "@/lib/api/errors";
import { chapterService } from "@/services/chapters";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

const fetchChaptersOnce = createInflightDedupe<Chapter[]>();

export function useChapters() {
  const [items, setItems] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Chapter>();
  const mutation = useMutationState();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const chapters = await fetchChaptersOnce(() =>
          chapterService.getAllAdmin()
        );
        if (cancelled) return;
        setItems(chapters);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load chapters"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = (id: string) => {
    mutation.clearError();
    const chapter = items.find((item) => item.id === id);
    if (!chapter) {
      mutation.setError("Chapter not found");
      return;
    }
    editor.startEdit(chapter);
  };

  const createChapter = async (data: CreateChapterInput) => {
    await mutation.run(
      async () => {
        const created = await chapterService.create(data);
        setItems((prev) =>
          [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex)
        );
        editor.closeEditor();
      },
      "Failed to create chapter",
      { rethrow: true }
    );
  };

  const updateChapter = async (id: string, data: UpdateChapterInput) => {
    await mutation.run(
      async () => {
        const updated = await chapterService.update(id, data);
        setItems((prev) =>
          prev
            .map((item) => (item.id === id ? updated : item))
            .sort((a, b) => a.orderIndex - b.orderIndex)
        );
        editor.closeEditor();
      },
      "Failed to update chapter",
      { rethrow: true }
    );
  };

  const deleteChapter = async (id: string) => {
    await mutation.run(async () => {
      await chapterService.remove(id);
      editor.cancelDelete();
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, "Failed to delete chapter");
  };

  return {
    items,
    loading,
    saving: mutation.saving,
    error: error ?? mutation.error,
    editingItem: editor.editingItem,
    isEditing: editor.isEditing,
    creating: editor.creating,
    confirmDeleteId: editor.confirmDeleteId,
    startCreate: editor.startCreate,
    startEdit,
    closeEditor: editor.closeEditor,
    createChapter,
    updateChapter,
    deleteChapter,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
