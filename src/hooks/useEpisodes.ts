"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { getErrorMessage } from "@/lib/api/errors";
import { normalizeEpisodeListItems } from "@/lib/episodes";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { chapterService } from "@/services/chapters";
import { characterService } from "@/services/characters";
import { episodeService } from "@/services/episodes";
import { locationService } from "@/services/locations";
import type { PaginationMeta } from "@/types/api";
import type { Chapter } from "@/types/chapter";
import type { Character } from "@/types/character";
import type {
  CreateEpisodeInput,
  Episode,
  EpisodeListItem,
  EpisodeListParams,
  UpdateEpisodeInput,
} from "@/types/episode";
import type { Location } from "@/types/location";

/** Load enough options for episode multi-select dropdowns. */
const ENTITY_OPTIONS_LIMIT = 100;

export function useEpisodes() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<EpisodeListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [chapterId, setChapterId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Episode>();
  const mutation = useMutationState();
  const chaptersRef = useRef<Chapter[]>([]);

  const isPaginated = !chapterId;
  const hasActiveFilters = Boolean(chapterId || debouncedSearch.trim());

  const ensureChapters = useCallback(async (): Promise<Chapter[]> => {
    if (chaptersRef.current.length > 0) {
      return chaptersRef.current;
    }

    try {
      const chapterList = await chapterService.getAllAdmin();
      chaptersRef.current = chapterList;
      setChapters(chapterList);
      return chapterList;
    } catch {
      chaptersRef.current = [];
      setChapters([]);
      return [];
    }
  }, []);

  const loadInfoEntities = useCallback(async () => {
    const [characterResult, locationResult] = await Promise.all([
      characterService
        .list({ page: 1, limit: ENTITY_OPTIONS_LIMIT })
        .catch(() => ({ data: [] as Character[] })),
      locationService
        .list({ page: 1, limit: ENTITY_OPTIONS_LIMIT })
        .catch(() => ({ data: [] as Location[] })),
    ]);
    setCharacters(characterResult.data);
    setLocations(locationResult.data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: EpisodeListParams = {
      chapterId: chapterId || undefined,
      search: debouncedSearch.trim() || undefined,
      page: isPaginated ? page : undefined,
      limit: isPaginated ? DEFAULT_LIMIT : undefined,
      userRole: "admin",
    };

    try {
      const [chapterList] = await Promise.all([
        ensureChapters(),
        loadInfoEntities(),
      ]);
      const result = await episodeService.list(params);
      setItems(
        normalizeEpisodeListItems(
          result.data,
          chapterList,
          chapterId || undefined
        )
      );
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load episodes"));
    } finally {
      setLoading(false);
    }
  }, [
    chapterId,
    debouncedSearch,
    page,
    isPaginated,
    ensureChapters,
    loadInfoEntities,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [chapterId, debouncedSearch]);

  const startEdit = async (id: string) => {
    mutation.clearError();

    try {
      const episode = await episodeService.getById(id);
      editor.startEdit(episode);
    } catch {
      const row = items.find((item) => item.id === id);
      if (!row) {
        mutation.setError("Episode not found");
        return;
      }
      editor.startEdit({
        ...row,
        moralOfTheStory: row.moralOfTheStory ?? null,
        videoUrl: null,
        slideshowData: null,
        createdAt: "",
        updatedAt: "",
        isPublished: row.isPublished ?? false,
        characterIds: row.characterIds ?? [],
        locationIds: row.locationIds ?? [],
      });
    }
  };

  const createEpisode = async (data: CreateEpisodeInput) => {
    await mutation.run(
      async () => {
        await episodeService.create(data);
        await load();
        editor.closeEditor();
      },
      "Failed to create episode",
      { rethrow: true }
    );
  };

  const updateEpisode = async (id: string, data: UpdateEpisodeInput) => {
    await mutation.run(
      async () => {
        await episodeService.update(id, data);
        await load();
        editor.closeEditor();
      },
      "Failed to update episode",
      { rethrow: true }
    );
  };

  const deleteEpisode = async (id: string) => {
    await mutation.run(async () => {
      await episodeService.remove(id);
      editor.cancelDelete();
      await load();
    }, "Failed to delete episode");
  };

  const totalCount = totalFromPagination(pagination, items.length);
  const pageRange = computePageRange(pagination, items.length, isPaginated);

  return {
    chapters,
    characters,
    locations,
    items,
    pagination,
    totalCount,
    pageRange,
    chapterId,
    setChapterId,
    searchInput,
    setSearchInput,
    clearFilters: () => {
      setChapterId("");
      setSearchInput("");
      setPage(1);
    },
    clearSearch: () => setSearchInput(""),
    hasActiveFilters,
    page,
    setPage,
    isPaginated,
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
    createEpisode,
    updateEpisode,
    deleteEpisode,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
