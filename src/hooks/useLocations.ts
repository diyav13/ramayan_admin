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
import { locationService } from "@/services/locations";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "@/types/location";

const fetchLocationsOnce = createInflightDedupe<PaginatedResult<Location>>();

function matchesSearch(name: string, search: string): boolean {
  if (!search) return true;
  return name.toLowerCase().includes(search.toLowerCase());
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

export function useLocations(enabled = true) {
  const [items, setItems] = useState<Location[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Location>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm);
  const filtersRef = useRef({ searchTerm: "" });
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

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
    const fetchKey = `locations:${pageToLoad}:${searchTerm}`;

    if (lastFetchKeyRef.current === fetchKey) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLocationsOnce(
          () =>
            locationService.list({
              search: searchTerm || undefined,
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
        setError(getErrorMessage(err, "Failed to load locations"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, searchTerm, page]);

  const startEdit = (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);
    if (!row) {
      mutation.setError("Location not found");
      return;
    }
    editor.startEdit(row);
  };

  const createLocation = async (data: CreateLocationInput) => {
    await mutation.run(
      async () => {
        const created = await locationService.create(data);

        if (matchesSearch(created.name, searchTerm)) {
          if (page === 1) {
            setItems((prev) => [created, ...prev].slice(0, DEFAULT_LIMIT));
          }
          setPagination((prev) => bumpPagination(prev, 1));
        } else {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        editor.closeEditor();
      },
      "Failed to create location",
      { rethrow: true }
    );
  };

  const updateLocation = async (id: string, data: UpdateLocationInput) => {
    await mutation.run(
      async () => {
        const updated = await locationService.update(id, data);
        const visible = matchesSearch(updated.name, searchTerm);

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
      "Failed to update location",
      { rethrow: true }
    );
  };

  const deleteLocation = async (id: string) => {
    await mutation.run(async () => {
      await locationService.remove(id);
      editor.cancelDelete();
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => bumpPagination(prev, -1));
    }, "Failed to delete location");
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
    loading: enabled ? loading : false,
    saving: mutation.saving,
    error: error ?? mutation.error,
    editingItem: editor.editingItem,
    isEditing: editor.isEditing,
    creating: editor.creating,
    confirmDeleteId: editor.confirmDeleteId,
    startCreate: editor.startCreate,
    startEdit,
    closeEditor: editor.closeEditor,
    createLocation,
    updateLocation,
    deleteLocation,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
