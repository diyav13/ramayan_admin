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
import { clearEventsCatalogCache } from "@/lib/catalog/options";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { eventService } from "@/services/events";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@/types/event";

const fetchEventsOnce = createInflightDedupe<PaginatedResult<Event>>();
const eventsCache = createSessionCache<ListCachePayload<Event>>("events");

const DEFAULT_EVENTS_KEY = "events:1:::";

export function useEvents() {
  const initial = eventsCache.get(DEFAULT_EVENTS_KEY);
  const [items, setItems] = useState<Event[]>(
    () => initial?.data.items ?? []
  );
  const [pagination, setPagination] = useState<PaginationMeta | null>(
    () => initial?.data.pagination ?? null
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [locationFilter, setLocationFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(() => !initial);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => Boolean(initial));
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Event>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(
    searchTerm || locationFilter || chapterFilter
  );
  const filtersRef = useRef({
    searchTerm: "",
    locationFilter: "",
    chapterFilter: "",
  });

  const invalidateLists = useCallback(() => {
    eventsCache.clear();
    clearEventsCatalogCache();
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const filtersChanged =
      filtersRef.current.searchTerm !== searchTerm ||
      filtersRef.current.locationFilter !== locationFilter ||
      filtersRef.current.chapterFilter !== chapterFilter;

    if (filtersChanged) {
      filtersRef.current = { searchTerm, locationFilter, chapterFilter };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;
    const fetchKey = `events:${pageToLoad}:${searchTerm}:${locationFilter}:${chapterFilter}`;

    const cached = eventsCache.get(fetchKey);
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
        const result = await fetchEventsOnce(
          () =>
            eventService.list({
              search: searchTerm || undefined,
              locationId: locationFilter || undefined,
              chapterId: chapterFilter || undefined,
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
        eventsCache.set(payload, fetchKey);
        setItems(payload.items);
        setPagination(payload.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load events"));
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
  }, [searchTerm, locationFilter, chapterFilter, page, reloadKey]);

  const startEdit = (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);
    if (!row) {
      mutation.setError("Event not found");
      return;
    }
    editor.startEdit(row);
  };

  const createEvent = async (data: CreateEventInput) => {
    await mutation.run(
      async () => {
        await eventService.create(data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to create event",
      { rethrow: true }
    );
  };

  const updateEvent = async (id: string, data: UpdateEventInput) => {
    await mutation.run(
      async () => {
        await eventService.update(id, data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to update event",
      { rethrow: true }
    );
  };

  const deleteEvent = async (id: string) => {
    await mutation.run(async () => {
      await eventService.remove(id);
      editor.cancelDelete();
      invalidateLists();
    }, "Failed to delete event");
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
    locationFilter,
    setLocationFilter,
    chapterFilter,
    setChapterFilter,
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
    createEvent,
    updateEvent,
    deleteEvent,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
