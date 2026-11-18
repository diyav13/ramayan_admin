"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { createInflightDedupe } from "@/lib/api/inflight";
import {
  createSessionCache,
  type ListCachePayload,
} from "@/lib/api/session-cache";
import { getErrorMessage } from "@/lib/api/errors";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { clearLocationsCatalogCache } from "@/lib/catalog/options";
import { locationService } from "@/services/locations";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "@/types/location";

const fetchLocationsOnce = createInflightDedupe<PaginatedResult<Location>>();
const locationsCache = createSessionCache<ListCachePayload<Location>>(
  "locations"
);

const DEFAULT_LOCATIONS_KEY = "locations:1:";

export function useLocations() {
  const initial = locationsCache.get(DEFAULT_LOCATIONS_KEY);
  const [items, setItems] = useState<Location[]>(
    () => initial?.data.items ?? []
  );
  const [pagination, setPagination] = useState<PaginationMeta | null>(
    () => initial?.data.pagination ?? null
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(() => !initial);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => Boolean(initial));
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Location>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm);
  const filtersRef = useRef({ searchTerm: "" });

  const invalidateLists = useCallback(() => {
    locationsCache.clear();
    clearLocationsCatalogCache();
    setReloadKey((key) => key + 1);
  }, []);

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
    const fetchKey = `locations:${pageToLoad}:${searchTerm}`;

    const cached = locationsCache.get(fetchKey);
    if (cached) {
      setItems(cached.data.items);
      setPagination(cached.data.pagination);
      setHasLoadedOnce(true);
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
          `${fetchKey}:r${reloadKey}`
        );
        if (cancelled) return;
        const payload = {
          items: result.data,
          pagination: result.pagination ?? null,
        };
        locationsCache.set(payload, fetchKey);
        setItems(payload.items);
        setPagination(payload.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load locations"));
      } finally {
        if (!cancelled) {
          setHasLoadedOnce(true);
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, page, reloadKey]);

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
        await locationService.create(data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to create location",
      { rethrow: true }
    );
  };

  const updateLocation = async (id: string, data: UpdateLocationInput) => {
    await mutation.run(
      async () => {
        await locationService.update(id, data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to update location",
      { rethrow: true }
    );
  };

  const deleteLocation = async (id: string) => {
    await mutation.run(async () => {
      await locationService.remove(id);
      editor.cancelDelete();
      invalidateLists();
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
    loading,
    initialLoading: loading && !hasLoadedOnce,
    isSearching:
      searchInput.trim() !== searchTerm || (loading && hasLoadedOnce),
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
