"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { quizItemsForForm } from "@/lib/quizzes";
import { chapterService } from "@/services/chapters";
import { episodeService } from "@/services/episodes";
import { quizService } from "@/services/quizzes";
import type { PaginatedResult, PaginationMeta } from "@/types/api";
import type { Chapter } from "@/types/chapter";
import type { EpisodeListItem } from "@/types/episode";
import type {
  CreateQuizInput,
  Quiz,
  QuizListItem,
  QuizType,
  UpdateQuizInput,
} from "@/types/quiz";

const fetchQuizzesOnce = createInflightDedupe<PaginatedResult<QuizListItem>>();
const fetchQuizOnce = createInflightDedupe<Quiz>();
const fetchChaptersOnce = createInflightDedupe<Chapter[]>();
const fetchEpisodesOnce = createInflightDedupe<EpisodeListItem[]>();

/** Survives Strict Mode remounts — chapters loaded once per page session. */
let chaptersCache: Chapter[] | null = null;

/** Episodes by chapter — shared by list filter and edit/create form. */
const episodesByChapterCache = new Map<string, EpisodeListItem[]>();

/**
 * Full quiz payloads (list summaries omit answer/options/items).
 * Filled by getById / create / update so re-edit skips another GET.
 */
const quizDetailCache = new Map<string, Quiz>();

function resolveQuizChapterId(quiz: Pick<QuizListItem, "chapterId" | "episode">): string {
  return (
    quiz.chapterId ??
    quiz.episode?.chapterId ??
    quiz.episode?.chapter?.id ??
    ""
  );
}

function matchesListFilters(
  quiz: QuizListItem,
  chapterId: string,
  episodeId: string,
  typeFilter: QuizType | "",
  search: string
): boolean {
  const quizChapterId = resolveQuizChapterId(quiz);
  if (chapterId && quizChapterId !== chapterId) return false;
  if (episodeId && quiz.episodeId !== episodeId) return false;
  if (typeFilter && quiz.type !== typeFilter) return false;
  if (
    search &&
    !quiz.question.toLowerCase().includes(search.toLowerCase())
  ) {
    return false;
  }
  return true;
}

function toListItem(quiz: Quiz): QuizListItem {
  return {
    id: quiz.id,
    chapterId: quiz.chapterId ?? resolveQuizChapterId(quiz),
    episodeId: quiz.episodeId,
    type: quiz.type,
    question: quiz.question,
    description: quiz.description,
    answer: quiz.answer,
    options: quiz.options,
    items: quiz.items,
    images: quiz.images,
    isPublished: quiz.isPublished,
    episode: quiz.episode,
    chapter: quiz.chapter,
  };
}

function toEditableQuiz(quiz: Quiz | QuizListItem): Quiz {
  const chapterId = resolveQuizChapterId(quiz) || quiz.chapterId;
  return {
    id: quiz.id,
    chapterId,
    episodeId: quiz.episodeId,
    type: quiz.type,
    question: quiz.question,
    description: quiz.description,
    answer: quiz.answer ?? (quiz.type === "TRUE_FALSE" ? false : 0),
    options: quiz.options,
    items: quizItemsForForm(quiz).map((item) => ({
      imageUrl: item.imageUrl,
      text: item.text,
    })),
    images: quiz.images,
    isPublished: quiz.isPublished ?? false,
    episode: quiz.episode,
    chapter: quiz.chapter,
    createdAt: "createdAt" in quiz ? quiz.createdAt : "",
    updatedAt: "updatedAt" in quiz ? quiz.updatedAt : "",
  };
}

function cacheQuizDetail(quiz: Quiz): Quiz {
  const editable = toEditableQuiz(quiz);
  quizDetailCache.set(quiz.id, editable);
  return editable;
}

function bumpEpisodeQuizCount(episodeId: string, delta: number) {
  for (const [chapterId, episodes] of episodesByChapterCache.entries()) {
    const index = episodes.findIndex((episode) => episode.id === episodeId);
    if (index < 0) continue;
    const next = [...episodes];
    next[index] = {
      ...next[index],
      quizQuestionCount: Math.max(
        0,
        (next[index].quizQuestionCount ?? 0) + delta
      ),
    };
    episodesByChapterCache.set(chapterId, next);
    return next[index];
  }
  return null;
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

export function useQuizzes(
  initialChapterId = "",
  initialEpisodeId = ""
) {
  const [chapters, setChapters] = useState<Chapter[]>(() => chaptersCache ?? []);
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([]);
  const [formEpisodes, setFormEpisodes] = useState<EpisodeListItem[]>([]);
  const [items, setItems] = useState<QuizListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [episodeId, setEpisodeId] = useState(initialEpisodeId);
  const [typeFilter, setTypeFilter] = useState<QuizType | "">("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [formEpisodesLoading, setFormEpisodesLoading] = useState(false);

  const editor = useEditorState<Quiz>();
  const mutation = useMutationState();
  const chaptersRef = useRef<Chapter[]>(chaptersCache ?? []);

  const isPaginated = !chapterId && !episodeId;
  const searchTerm = debouncedSearch.trim();
  const hasActiveFilters = Boolean(
    chapterId || episodeId || typeFilter || searchTerm
  );
  const filtersRef = useRef({
    chapterId: "",
    episodeId: "",
    typeFilter: "" as QuizType | "",
    searchTerm: "",
  });

  const ensureChapters = useCallback(async (): Promise<Chapter[]> => {
    if (chaptersCache && chaptersCache.length > 0) {
      chaptersRef.current = chaptersCache;
      setChapters(chaptersCache);
      return chaptersCache;
    }

    try {
      const chapterList = await fetchChaptersOnce(() =>
        chapterService.getAllAdmin()
      );
      chaptersCache = chapterList;
      chaptersRef.current = chapterList;
      setChapters(chapterList);
      return chapterList;
    } catch {
      chaptersCache = [];
      chaptersRef.current = [];
      setChapters([]);
      return [];
    }
  }, []);

  const loadEpisodesForChapter = useCallback(
    async (
      selectedChapterId: string,
      target: "filter" | "form"
    ): Promise<EpisodeListItem[]> => {
      if (!selectedChapterId) {
        if (target === "filter") setEpisodes([]);
        else setFormEpisodes([]);
        return [];
      }

      const setLoadingState =
        target === "filter" ? setEpisodesLoading : setFormEpisodesLoading;
      const setList = target === "filter" ? setEpisodes : setFormEpisodes;

      const cached = episodesByChapterCache.get(selectedChapterId);
      if (cached) {
        setList(cached);
        return cached;
      }

      setLoadingState(true);
      try {
        const list = await fetchEpisodesOnce(
          () =>
            episodeService
              .adminByChapter({ chapterId: selectedChapterId })
              .then((result) => result.episodes),
          `bychapter:${selectedChapterId}`
        );
        episodesByChapterCache.set(selectedChapterId, list);
        setList(list);
        return list;
      } catch {
        setList([]);
        return [];
      } finally {
        setLoadingState(false);
      }
    },
    []
  );

  useEffect(() => {
    setChapterId(initialChapterId);
    setEpisodeId(initialEpisodeId);
  }, [initialChapterId, initialEpisodeId]);

  useEffect(() => {
    let cancelled = false;

    const filtersChanged =
      filtersRef.current.chapterId !== chapterId ||
      filtersRef.current.episodeId !== episodeId ||
      filtersRef.current.typeFilter !== typeFilter ||
      filtersRef.current.searchTerm !== searchTerm;

    if (filtersChanged) {
      filtersRef.current = {
        chapterId,
        episodeId,
        typeFilter,
        searchTerm,
      };
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const pageToLoad = filtersChanged ? 1 : page;
    const paginated = !chapterId && !episodeId;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        await ensureChapters();
        if (cancelled) return;

        const quizParams = {
          chapterId: chapterId || undefined,
          episodeId: episodeId || undefined,
          type: typeFilter || undefined,
          search: searchTerm || undefined,
          page: paginated ? pageToLoad : undefined,
          limit: paginated ? DEFAULT_LIMIT : undefined,
        };

        const quizKey = [
          "quizzes",
          chapterId,
          episodeId,
          typeFilter,
          searchTerm,
          paginated ? pageToLoad : "all",
        ].join(":");

        const [, result] = await Promise.all([
          chapterId
            ? loadEpisodesForChapter(chapterId, "filter")
            : Promise.resolve([] as EpisodeListItem[]).then((empty) => {
                setEpisodes(empty);
                return empty;
              }),
          fetchQuizzesOnce(() => quizService.list(quizParams), quizKey),
        ]);

        if (cancelled) return;

        setItems(result.data);
        setPagination(result.pagination ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Failed to load quizzes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    chapterId,
    episodeId,
    typeFilter,
    searchTerm,
    page,
    ensureChapters,
    loadEpisodesForChapter,
  ]);

  const setChapterFilter = useCallback((id: string) => {
    setChapterId(id);
    setEpisodeId("");
  }, []);

  const loadFormEpisodes = useCallback(
    async (selectedChapterId: string) => {
      return loadEpisodesForChapter(selectedChapterId, "form");
    },
    [loadEpisodesForChapter]
  );

  const startEdit = async (id: string) => {
    mutation.clearError();
    const row = items.find((item) => item.id === id);

    try {
      // List summaries omit answer/options/items — need detail (cached after first open).
      let detail = quizDetailCache.get(id);
      if (!detail) {
        detail = cacheQuizDetail(
          await fetchQuizOnce(() => quizService.getById(id), id)
        );
      }

      const editChapterId = resolveQuizChapterId(detail);
      if (editChapterId) await loadFormEpisodes(editChapterId);
      editor.startEdit(detail);
    } catch {
      if (!row) {
        mutation.setError("Quiz question not found");
        return;
      }
      const editChapterId = resolveQuizChapterId(row);
      if (editChapterId) await loadFormEpisodes(editChapterId);
      editor.startEdit(toEditableQuiz(row));
    }
  };

  const startCreate = () => {
    setFormEpisodes([]);
    editor.startCreate();
  };

  const createQuiz = async (data: CreateQuizInput) => {
    await mutation.run(
      async () => {
        const created = cacheQuizDetail(await quizService.create(data));
        const listItem = toListItem(created);
        const updatedEpisode = bumpEpisodeQuizCount(data.episodeId, 1);
        if (updatedEpisode) {
          setFormEpisodes((prev) =>
            prev.map((episode) =>
              episode.id === data.episodeId ? updatedEpisode : episode
            )
          );
          setEpisodes((prev) =>
            prev.map((episode) =>
              episode.id === data.episodeId ? updatedEpisode : episode
            )
          );
        }

        if (
          matchesListFilters(
            listItem,
            chapterId,
            episodeId,
            typeFilter,
            searchTerm
          )
        ) {
          if (isPaginated) {
            if (page === 1) {
              setItems((prev) => [listItem, ...prev].slice(0, DEFAULT_LIMIT));
            }
            setPagination((prev) => bumpPagination(prev, 1));
          } else {
            setItems((prev) => [listItem, ...prev]);
          }
        } else if (isPaginated) {
          setPagination((prev) => bumpPagination(prev, 1));
        }

        editor.closeEditor();
      },
      "Failed to create quiz question",
      { rethrow: true }
    );
  };

  const updateQuiz = async (id: string, data: UpdateQuizInput) => {
    await mutation.run(
      async () => {
        const updated = cacheQuizDetail(await quizService.update(id, data));
        const listItem = toListItem(updated);
        const visible = matchesListFilters(
          listItem,
          chapterId,
          episodeId,
          typeFilter,
          searchTerm
        );

        setItems((prev) => {
          const exists = prev.some((item) => item.id === id);
          if (!visible) {
            return prev.filter((item) => item.id !== id);
          }
          if (!exists) {
            return isPaginated
              ? [listItem, ...prev].slice(0, DEFAULT_LIMIT)
              : [listItem, ...prev];
          }
          return prev.map((item) => (item.id === id ? listItem : item));
        });

        editor.closeEditor();
      },
      "Failed to update quiz question",
      { rethrow: true }
    );
  };

  const deleteQuiz = async (id: string) => {
    const removed = items.find((item) => item.id === id);
    await mutation.run(async () => {
      await quizService.remove(id);
      quizDetailCache.delete(id);
      editor.cancelDelete();
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (removed?.episodeId) {
        const updatedEpisode = bumpEpisodeQuizCount(removed.episodeId, -1);
        if (updatedEpisode) {
          setFormEpisodes((prev) =>
            prev.map((episode) =>
              episode.id === removed.episodeId ? updatedEpisode : episode
            )
          );
          setEpisodes((prev) =>
            prev.map((episode) =>
              episode.id === removed.episodeId ? updatedEpisode : episode
            )
          );
        }
      }
      if (isPaginated) {
        setPagination((prev) => bumpPagination(prev, -1));
      }
    }, "Failed to delete quiz question");
  };

  const totalCount = totalFromPagination(pagination, items.length);
  const pageRange = computePageRange(pagination, items.length, isPaginated);

  return {
    chapters,
    episodes,
    formEpisodes,
    formEpisodesLoading,
    episodesLoading,
    items,
    pagination,
    totalCount,
    pageRange,
    chapterId,
    setChapterId: setChapterFilter,
    episodeId,
    setEpisodeId,
    typeFilter,
    setTypeFilter,
    searchInput,
    setSearchInput,
    clearFilters: () => {
      setChapterId("");
      setEpisodeId("");
      setTypeFilter("");
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
    startCreate,
    startEdit,
    closeEditor: editor.closeEditor,
    loadFormEpisodes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    askDelete: editor.askDelete,
    cancelDelete: editor.cancelDelete,
  };
}
