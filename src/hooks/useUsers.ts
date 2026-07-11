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
import { userService } from "@/services/users";
import type { PaginationMeta } from "@/types/api";
import type { UpdateUserInput, User } from "@/types/user";

export function useUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<User>();
  const mutation = useMutationState();

  const hasActiveFilters = Boolean(debouncedSearch.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.list({
        search: debouncedSearch.trim() || undefined,
        role: "USER",
        page,
        limit: DEFAULT_LIMIT,
      });
      setItems(result.data);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users"));
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
      const user = await userService.getById(id);
      editor.startEdit(user);
    } catch {
      const row = items.find((item) => item.id === id);
      if (!row) {
        mutation.setError("User not found");
        return;
      }
      editor.startEdit(row);
    }
  };

  const updateUser = async (id: string, data: UpdateUserInput) => {
    await mutation.run(
      async () => {
        await userService.update(id, data);
        await load();
        editor.closeEditor();
      },
      "Failed to update user",
      { rethrow: true }
    );
  };

  const deleteUser = async (id: string) => {
    await mutation.run(async () => {
      await userService.remove(id);
      editor.cancelDelete();
      await load();
    }, "Failed to delete user");
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
    confirmDeleteId: editor.confirmDeleteId,
    startEdit,
    closeEditor: editor.closeEditor,
    updateUser,
    deleteUser,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
