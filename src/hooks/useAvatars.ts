"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarStatusFilter } from "@/components/avatars/AvatarFiltersBar";
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
import { avatarService } from "@/services/avatars";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  Avatar,
  CreateAvatarInput,
  UpdateAvatarInput,
} from "@/types/avatar";

const fetchAvatarsOnce = createInflightDedupe<PaginatedResult<Avatar>>();

function matchesSearch(name: string, search: string): boolean {
  if (!search) return true;
  return name.toLowerCase().includes(search.toLowerCase());
}

function matchesStatusFilter(
  isActive: boolean,
  filter: AvatarStatusFilter
): boolean {
  if (filter === "all") return true;
  return filter === "active" ? isActive : !isActive;
}

function resolveIsActiveParam(
  filter: AvatarStatusFilter
): boolean | undefined {
  if (filter === "active") return true;
  if (filter === "inactive") return false;
  return undefined;
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

export function useAvatars() {
  const [items, setItems] = useState<Avatar[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<AvatarStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Avatar>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== "all";
  const filtersRef = useRef({ searchTerm: "", statusFilter: "all" as AvatarStatusFilter });
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const filtersChanged =
      filtersRef.current.searchTerm !== searchTerm ||
      filtersRef.current.statusFilter !== statusFilter;
    if (filtersChanged) {
      filtersRef.current = { searchTerm, statusFilter };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;
    const fetchKey = `avatars:${pageToLoad}:${searchTerm}:${statusFilter}`;

    if (lastFetchKeyRef.current === fetchKey) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAvatarsOnce(
          () =>
            avatarService.list({
              search: searchTerm || undefined,
              isActive: resolveIsActiveParam(statusFilter),
              page: pageToLoad,
              limit: DEFAULT_LIMIT,
            }),
          fetchKey
        );
        if (cancelled) return;
        setItems(result.data);
        setPagination(result.pagination ?? null);
        lastFetchKeyRef.current = fetchKey;
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load avatars"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, statusFilter, page]);

  const startEdit = (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);
    if (!row) {
      mutation.setError("Avatar not found");
      return;
    }
    editor.startEdit(row);
  };

  const createAvatar = async (data: CreateAvatarInput) => {
    await mutation.run(
      async () => {
        const created = await avatarService.create(data);

        if (
          matchesSearch(created.name, searchTerm) &&
          matchesStatusFilter(created.isActive, statusFilter)
        ) {
          if (page === 1) {
            setItems((prev) => [created, ...prev].slice(0, DEFAULT_LIMIT));
          }
          setPagination((prev) => bumpPagination(prev, 1));
        } else {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        editor.closeEditor();
      },
      "Failed to create avatar",
      { rethrow: true }
    );
  };

  const updateAvatar = async (id: string, data: UpdateAvatarInput) => {
    await mutation.run(
      async () => {
        const updated = await avatarService.update(id, data);
        const visible =
          matchesSearch(updated.name, searchTerm) &&
          matchesStatusFilter(updated.isActive, statusFilter);

        setItems((prev) => {
          const exists = prev.some((item) => item.id === id);
          if (!visible) {
            return prev.filter((item) => item.id !== id);
          }
          if (!exists) {
            return [updated, ...prev].slice(0, DEFAULT_LIMIT);
          }
          return prev.map((item) => (item.id === id ? updated : item));
        });

        editor.closeEditor();
      },
      "Failed to update avatar",
      { rethrow: true }
    );
  };

  const deleteAvatar = async (id: string) => {
    await mutation.run(async () => {
      await avatarService.remove(id);
      editor.cancelDelete();
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => bumpPagination(prev, -1));
    }, "Failed to delete avatar");
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
    statusFilter,
    setStatusFilter,
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
    createAvatar,
    updateAvatar,
    deleteAvatar,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
