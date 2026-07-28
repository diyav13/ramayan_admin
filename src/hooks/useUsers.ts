"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { createInflightDedupe } from "@/lib/api/inflight";
import { getErrorMessage } from "@/lib/api/errors";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { userService } from "@/services/users";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type { UpdateUserInput, User } from "@/types/user";

const fetchUsersOnce = createInflightDedupe<PaginatedResult<User>>();

function matchesSearch(user: User, search: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    (user.name?.toLowerCase().includes(q) ?? false) ||
    (user.email?.toLowerCase().includes(q) ?? false) ||
    (user.phone?.toLowerCase().includes(q) ?? false)
  );
}

function bumpPagination(
  current: PaginationMeta | null,
  delta: number
): PaginationMeta | null {
  if (!current) return current;
  const total = Math.max(0, current.total + delta);
  return {
    ...current,
    total,
    totalPages: Math.max(1, Math.ceil(total / current.limit)),
  };
}

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
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm);
  const filtersRef = useRef({ searchTerm: "" });

  useEffect(() => {
    let cancelled = false;

    const filtersChanged = filtersRef.current.searchTerm !== searchTerm;
    if (filtersChanged) {
      filtersRef.current = { searchTerm };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;
    const fetchKey = `users:USER:${pageToLoad}:${searchTerm}`;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchUsersOnce(
          () =>
            userService.list({
              search: searchTerm || undefined,
              role: "USER",
              page: pageToLoad,
              limit: DEFAULT_LIMIT,
            }),
          fetchKey
        );
        if (cancelled) return;
        setItems(result.data);
        setPagination(result.pagination ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load users"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, page]);

  const startEdit = (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);
    if (!row) {
      mutation.setError("User not found");
      return;
    }
    editor.startEdit(row);
  };

  const updateUser = async (id: string, data: UpdateUserInput) => {
    await mutation.run(
      async () => {
        const updated = await userService.update(id, data);
        const visible = matchesSearch(updated, searchTerm);

        setItems((prev) => {
          const exists = prev.some((item) => item.id === id);
          if (!visible) {
            return prev.filter((item) => item.id !== id);
          }
          if (!exists) {
            return [updated, ...prev].slice(0, DEFAULT_LIMIT);
          }
          return prev.map((item) =>
            item.id === id ? { ...item, ...updated } : item
          );
        });

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
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => bumpPagination(prev, -1));
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
