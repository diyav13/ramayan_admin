"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { getErrorMessage } from "@/lib/api/errors";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { characterService } from "@/services/characters";
import type { PaginationMeta } from "@/types/api";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

export function useCharacters() {
  const [items, setItems] = useState<Character[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Character>();
  const mutation = useMutationState();

  const hasActiveFilters = Boolean(debouncedSearch.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await characterService.list({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: DEFAULT_LIMIT,
      });
      setItems(result.data);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load characters"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const startEdit = async (id: string) => {
    mutation.clearError();

    try {
      const character = await characterService.getById(id);
      editor.startEdit(character);
    } catch {
      const row = items.find((item) => item.id === id);
      if (!row) {
        mutation.setError("Character not found");
        return;
      }
      editor.startEdit(row);
    }
  };

  const createCharacter = async (data: CreateCharacterInput) => {
    await mutation.run(
      async () => {
        await characterService.create(data);
        await load();
        editor.closeEditor();
      },
      "Failed to create character",
      { rethrow: true }
    );
  };

  const updateCharacter = async (id: string, data: UpdateCharacterInput) => {
    await mutation.run(
      async () => {
        await characterService.update(id, data);
        await load();
        editor.closeEditor();
      },
      "Failed to update character",
      { rethrow: true }
    );
  };

  const deleteCharacter = async (id: string) => {
    await mutation.run(async () => {
      await characterService.remove(id);
      editor.cancelDelete();
      await load();
    }, "Failed to delete character");
  };

  const totalCount = totalFromPagination(pagination, items.length);
  const pageRange = computePageRange(pagination, items.length);

  return {
    items,
    pagination,
    totalCount,
    pageRange,
    searchInput,
    setSearchInput,
    clearSearch: () => setSearchInput(""),
    hasActiveFilters,
    page,
    setPage,
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
    createCharacter,
    updateCharacter,
    deleteCharacter,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
