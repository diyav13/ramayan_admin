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
import { clearCharactersCatalogCache } from "@/lib/catalog/options";
import { characterService } from "@/services/characters";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

const fetchCharactersOnce = createInflightDedupe<PaginatedResult<Character>>();
const charactersCache = createSessionCache<ListCachePayload<Character>>(
  "characters"
);

const DEFAULT_CHARACTERS_KEY = "characters:1:";

export function useCharacters() {
  const initial = charactersCache.get(DEFAULT_CHARACTERS_KEY);
  const [items, setItems] = useState<Character[]>(
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

  const editor = useEditorState<Character>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm);
  const filtersRef = useRef({ searchTerm: "" });

  const invalidateLists = useCallback(() => {
    charactersCache.clear();
    clearCharactersCatalogCache();
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
    const fetchKey = `characters:${pageToLoad}:${searchTerm}`;

    const cached = charactersCache.get(fetchKey);
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
        const result = await fetchCharactersOnce(
          () =>
            characterService.list({
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
        charactersCache.set(payload, fetchKey);
        setItems(payload.items);
        setPagination(payload.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load characters"));
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
      mutation.setError("Character not found");
      return;
    }
    editor.startEdit(row);
  };

  const createCharacter = async (data: CreateCharacterInput) => {
    await mutation.run(
      async () => {
        await characterService.create(data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to create character",
      { rethrow: true }
    );
  };

  const updateCharacter = async (id: string, data: UpdateCharacterInput) => {
    await mutation.run(
      async () => {
        await characterService.update(id, data);
        editor.closeEditor();
        invalidateLists();
      },
      "Failed to update character",
      { rethrow: true }
    );
  };

  const deleteCharacter = async (id: string) => {
    await mutation.run(async () => {
      await characterService.remove(id);
      editor.cancelDelete();
      invalidateLists();
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
    createCharacter,
    updateCharacter,
    deleteCharacter,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
