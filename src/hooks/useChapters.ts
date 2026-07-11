"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { getErrorMessage } from "@/lib/api/errors";
import { chapterService } from "@/services/chapters";
import type {
  Chapter,
  CreateChapterInput,
  UpdateChapterInput,
} from "@/types/chapter";

export function useChapters() {
  const [items, setItems] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Chapter>();
  const mutation = useMutationState();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chapters = await chapterService.getAllAdmin();
      setItems(chapters);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load chapters"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        await chapterService.create(data);
        await load();
        editor.closeEditor();
      },
      "Failed to create chapter",
      { rethrow: true }
    );
  };

  const updateChapter = async (id: string, data: UpdateChapterInput) => {
    await mutation.run(
      async () => {
        await chapterService.update(id, data);
        await load();
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
      await load();
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
