"use client";

import { useEffect, useRef, useState } from "react";
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
import { eventService } from "@/services/events";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from "@/types/event";

const fetchEventsOnce = createInflightDedupe<PaginatedResult<Event>>();
const eventsCache = createSessionCache<ListCachePayload<Event>>("events");

function matchesFilters(
  event: Event,
  search: string,
  locationId: string
): boolean {
  if (locationId && event.locationId !== locationId) return false;
  if (!search) return true;
  const haystack = [
    event.name,
    event.location?.name,
    ...(event.characters?.map((c) => c.name) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
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

const DEFAULT_EVENTS_KEY = "events:1::";

export function useEvents(enabled = true) {
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(() => !initial);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Event>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm || locationFilter);
  const filtersRef = useRef({
    searchTerm: "",
    locationFilter: "",
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const filtersChanged =
      filtersRef.current.searchTerm !== searchTerm ||
      filtersRef.current.locationFilter !== locationFilter;

    if (filtersChanged) {
      filtersRef.current = { searchTerm, locationFilter };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;
    const fetchKey = `events:${pageToLoad}:${searchTerm}:${locationFilter}`;

    const cached = eventsCache.get(fetchKey);
    if (cached) {
      setItems(cached.data.items);
      setPagination(cached.data.pagination);
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
              page: pageToLoad,
              limit: DEFAULT_LIMIT,
            }),
          fetchKey
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
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, searchTerm, locationFilter, page]);

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
        const created = await eventService.create(data);

        if (matchesFilters(created, searchTerm, locationFilter)) {
          if (page === 1) {
            setItems((prev) => [created, ...prev].slice(0, DEFAULT_LIMIT));
          }
          setPagination((prev) => bumpPagination(prev, 1));
        } else {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        eventsCache.clear();
        editor.closeEditor();
      },
      "Failed to create event",
      { rethrow: true }
    );
  };

  const updateEvent = async (id: string, data: UpdateEventInput) => {
    await mutation.run(
      async () => {
        const updated = await eventService.update(id, data);
        const visible = matchesFilters(updated, searchTerm, locationFilter);

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

        eventsCache.clear();
        editor.closeEditor();
      },
      "Failed to update event",
      { rethrow: true }
    );
  };

  const deleteEvent = async (id: string) => {
    await mutation.run(async () => {
      await eventService.remove(id);
      editor.cancelDelete();
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => bumpPagination(prev, -1));
      eventsCache.clear();
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
    createEvent,
    updateEvent,
    deleteEvent,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
