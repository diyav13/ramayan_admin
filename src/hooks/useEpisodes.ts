"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { createInflightDedupe } from "@/lib/api/inflight";
import { getErrorMessage } from "@/lib/api/errors";
import { normalizeEpisodeListItems } from "@/lib/episodes";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { episodeService } from "@/services/episodes";
import { quizInstructionService } from "@/services/quiz-instructions";
import type { PaginationMeta } from "@/types/api";
import type { Chapter } from "@/types/chapter";
import type { Character } from "@/types/character";
import type {
  CreateEpisodeInput,
  Episode,
  EpisodeListItem,
  UpdateEpisodeInput,
} from "@/types/episode";
import type { Location } from "@/types/location";
import type { QuizInstruction } from "@/types/quiz-instruction";

const fetchListingOnce = createInflightDedupe<
  Awaited<ReturnType<typeof episodeService.adminListing>>
>();
const fetchByChapterOnce = createInflightDedupe<
  Awaited<ReturnType<typeof episodeService.adminByChapter>>
>();
const fetchQuizInstructionCatalogOnce = createInflightDedupe<
  QuizInstruction[]
>();

async function loadQuizInstructionCatalog(
  fromListing?: QuizInstruction[]
): Promise<QuizInstruction[]> {
  // Backend now always includes the catalog; use it even when empty.
  if (fromListing !== undefined) {
    return fromListing;
  }

  try {
    return await fetchQuizInstructionCatalogOnce(async () => {
      const result = await quizInstructionService.list({
        page: 1,
        limit: 100,
      });
      return result.data;
    }, "quiz-instructions:catalog");
  } catch {
    return [];
  }
}

function matchesListFilters(
  episode: Pick<EpisodeListItem, "chapterId" | "title">,
  chapterId: string,
  search: string
): boolean {
  if (chapterId && episode.chapterId !== chapterId) return false;
  if (search && !episode.title.toLowerCase().includes(search.toLowerCase())) {
    return false;
  }
  return true;
}

function toListItem(
  episode: Episode,
  chapters: Chapter[]
): EpisodeListItem {
  const chapter =
    episode.chapter ??
    (() => {
      const found = chapters.find((item) => item.id === episode.chapterId);
      if (!found) return undefined;
      return {
        id: found.id,
        title: found.title,
        orderIndex: found.orderIndex,
        isPremium: found.isPremium,
        accentColor: found.accentColor,
      };
    })();

  return {
    id: episode.id,
    chapterId: episode.chapterId,
    title: episode.title,
    description: episode.description,
    moralOfTheStory: episode.moralOfTheStory,
    infoTitle: episode.infoTitle,
    infoDescription: episode.infoDescription,
    maxQuizQuestions: episode.maxQuizQuestions,
    quizQuestionCount: episode.quizQuestionCount,
    thumbnailUrl: episode.thumbnailUrl,
    contentType: episode.contentType,
    orderIndex: episode.orderIndex,
    durationSeconds: episode.durationSeconds,
    accentColor: episode.accentColor,
    isPublished: episode.isPublished,
    videoUrl: episode.videoUrl,
    slideshowData: episode.slideshowData,
    videoUploadStatus: episode.videoUploadStatus,
    processingError: episode.processingError,
    characterIds: episode.characterIds ?? [],
    locationIds: episode.locationIds ?? [],
    quizInstructionIds: episode.quizInstructionIds ?? [],
    characters: episode.characters,
    locations: episode.locations,
    quizInstructions: episode.quizInstructions,
    chapter,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  };
}

function toEditableEpisode(row: EpisodeListItem): Episode {
  return {
    ...row,
    moralOfTheStory: row.moralOfTheStory ?? null,
    infoTitle: row.infoTitle ?? null,
    infoDescription: row.infoDescription ?? null,
    maxQuizQuestions: row.maxQuizQuestions ?? 5,
    videoUrl: row.videoUrl ?? null,
    slideshowData: row.slideshowData ?? null,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    isPublished: row.isPublished ?? false,
    characterIds: row.characterIds ?? [],
    locationIds: row.locationIds ?? [],
    quizInstructionIds: row.quizInstructionIds ?? [],
  };
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

export function useEpisodes(initialChapterId = "") {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [quizInstructions, setQuizInstructions] = useState<QuizInstruction[]>(
    []
  );
  const [items, setItems] = useState<EpisodeListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Episode>();
  const mutation = useMutationState();
  const chaptersRef = useRef<Chapter[]>([]);
  const catalogsReadyRef = useRef(false);

  const isPaginated = !chapterId;
  const hasActiveFilters = Boolean(chapterId || debouncedSearch.trim());
  const searchTerm = debouncedSearch.trim();
  const filtersRef = useRef({ chapterId: "", searchTerm: "" });

  useEffect(() => {
    setChapterId(initialChapterId);
  }, [initialChapterId]);

  useEffect(() => {
    let cancelled = false;

    const filtersChanged =
      filtersRef.current.chapterId !== chapterId ||
      filtersRef.current.searchTerm !== searchTerm;

    if (filtersChanged) {
      filtersRef.current = { chapterId, searchTerm };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (chapterId) {
          let chapterList = chaptersRef.current;
          if (!catalogsReadyRef.current || chapterList.length === 0) {
            const bootstrap = await fetchListingOnce(
              () =>
                episodeService.adminListing({
                  page: 1,
                  limit: DEFAULT_LIMIT,
                }),
              "listing:bootstrap"
            );
            if (cancelled) return;
            chapterList = bootstrap.chapters;
            chaptersRef.current = chapterList;
            catalogsReadyRef.current = true;
            setChapters(bootstrap.chapters);
            setCharacters(bootstrap.characters);
            setLocations(bootstrap.locations);
            setQuizInstructions(
              await loadQuizInstructionCatalog(bootstrap.quizInstructions)
            );
          }

          const result = await fetchByChapterOnce(
            () =>
              episodeService.adminByChapter({
                chapterId,
                search: searchTerm || undefined,
              }),
            `bychapter:${chapterId}:${searchTerm}`
          );
          if (cancelled) return;

          setItems(
            normalizeEpisodeListItems(
              result.episodes,
              chapterList,
              chapterId
            )
          );
          setPagination(null);
        } else {
          const result = await fetchListingOnce(
            () =>
              episodeService.adminListing({
                search: searchTerm || undefined,
                page: pageToLoad,
                limit: DEFAULT_LIMIT,
              }),
            `listing:${pageToLoad}:${searchTerm}`
          );
          if (cancelled) return;

          chaptersRef.current = result.chapters;
          catalogsReadyRef.current = true;
          setChapters(result.chapters);
          setCharacters(result.characters);
          setLocations(result.locations);
          setQuizInstructions(
            await loadQuizInstructionCatalog(result.quizInstructions)
          );
          setItems(
            normalizeEpisodeListItems(result.episodes, result.chapters)
          );
          setPagination(result.pagination);
        }
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load episodes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [chapterId, searchTerm, page]);

  const startEdit = (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);
    if (!row) {
      mutation.setError("Episode not found");
      return;
    }
    editor.startEdit(toEditableEpisode(row));
  };

  const createEpisode = async (data: CreateEpisodeInput) => {
    await mutation.run(
      async () => {
        const created = await episodeService.create(data);
        const listItem = toListItem(created, chaptersRef.current);

        if (matchesListFilters(listItem, chapterId, searchTerm)) {
          if (isPaginated) {
            if (page === 1) {
              setItems((prev) =>
                normalizeEpisodeListItems(
                  [listItem, ...prev].slice(0, DEFAULT_LIMIT),
                  chaptersRef.current
                )
              );
            }
            setPagination((prev) => bumpPagination(prev, 1));
          } else {
            setItems((prev) =>
              normalizeEpisodeListItems(
                [...prev, listItem].sort(
                  (a, b) => a.orderIndex - b.orderIndex
                ),
                chaptersRef.current,
                chapterId
              )
            );
          }
        } else if (isPaginated) {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        editor.closeEditor();
      },
      "Failed to create episode",
      { rethrow: true }
    );
  };

  const updateEpisode = async (id: string, data: UpdateEpisodeInput) => {
    await mutation.run(
      async () => {
        const updated = await episodeService.update(id, data);
        const listItem = toListItem(updated, chaptersRef.current);
        const visible = matchesListFilters(listItem, chapterId, searchTerm);

        setItems((prev) => {
          const exists = prev.some((item) => item.id === id);
          if (!visible) {
            return prev.filter((item) => item.id !== id);
          }
          if (!exists) {
            return normalizeEpisodeListItems(
              isPaginated
                ? [listItem, ...prev].slice(0, DEFAULT_LIMIT)
                : [...prev, listItem].sort(
                    (a, b) => a.orderIndex - b.orderIndex
                  ),
              chaptersRef.current,
              chapterId || undefined
            );
          }
          return normalizeEpisodeListItems(
            prev.map((item) => (item.id === id ? listItem : item)),
            chaptersRef.current,
            chapterId || undefined
          );
        });

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
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (isPaginated) {
        setPagination((prev) => bumpPagination(prev, -1));
      }
    }, "Failed to delete episode");
  };

  const totalCount = totalFromPagination(pagination, items.length);
  const pageRange = computePageRange(pagination, items.length, isPaginated);

  return {
    chapters,
    characters,
    locations,
    quizInstructions,
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
