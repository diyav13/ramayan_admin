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
import { characterService } from "@/services/characters";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "@/types/character";

const fetchCharactersOnce = createInflightDedupe<PaginatedResult<Character>>();
const charactersCache = createSessionCache<ListCachePayload<Character>>("characters");

function matchesSearch(
  character: Pick<Character, "name" | "title">,
  search: string
): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    character.name.toLowerCase().includes(q) ||
    (character.title?.toLowerCase().includes(q) ?? false)
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

const DEFAULT_CHARACTERS_KEY = "characters:1:";

export function useCharacters(enabled = true) {
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
  const [loading, setLoading] = useState(() => !initial);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Character>();
  const mutation = useMutationState();
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(searchTerm);
  const filtersRef = useRef({ searchTerm: "" });

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
    const fetchKey = `characters:${pageToLoad}:${searchTerm}`;

    const cached = charactersCache.get(fetchKey);
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
        const result = await fetchCharactersOnce(
          () =>
            characterService.list({
              search: searchTerm || undefined,
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
        charactersCache.set(payload, fetchKey);
        setItems(payload.items);
        setPagination(payload.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load characters"));
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
      mutation.setError("Character not found");
      return;
    }
    editor.startEdit(row);
  };

  const createCharacter = async (data: CreateCharacterInput) => {
    await mutation.run(
      async () => {
        const created = await characterService.create(data);

        if (matchesSearch(created, searchTerm)) {
          if (page === 1) {
            setItems((prev) => [created, ...prev].slice(0, DEFAULT_LIMIT));
          }
          setPagination((prev) => bumpPagination(prev, 1));
        } else {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        charactersCache.clear();
        editor.closeEditor();
      },
      "Failed to create character",
      { rethrow: true }
    );
  };

  const updateCharacter = async (id: string, data: UpdateCharacterInput) => {
    await mutation.run(
      async () => {
        const updated = await characterService.update(id, data);
        const visible = matchesSearch(updated, searchTerm);

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

        charactersCache.clear();
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
      setItems((prev) => prev.filter((item) => item.id !== id));
      setPagination((prev) => bumpPagination(prev, -1));
      charactersCache.clear();
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
    createCharacter,
    updateCharacter,
    deleteCharacter,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
