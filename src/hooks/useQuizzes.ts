"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
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
import type { PaginationMeta } from "@/types/api";
import type { Chapter } from "@/types/chapter";
import type { EpisodeListItem } from "@/types/episode";
import type {
  CreateQuizInput,
  Quiz,
  QuizListItem,
  QuizListParams,
  QuizType,
  UpdateQuizInput,
} from "@/types/quiz";

export function useQuizzes() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([]);
  const [formEpisodes, setFormEpisodes] = useState<EpisodeListItem[]>([]);
  const [items, setItems] = useState<QuizListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [chapterId, setChapterId] = useState("");
  const [episodeId, setEpisodeId] = useState("");
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
  const chaptersRef = useRef<Chapter[]>([]);

  const isPaginated = !chapterId && !episodeId;
  const hasActiveFilters = Boolean(
    chapterId || episodeId || typeFilter || debouncedSearch.trim()
  );

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

      setLoadingState(true);
      try {
        const result = await episodeService.list({
          chapterId: selectedChapterId,
          userRole: "admin",
        });
        setList(result.data);
        return result.data;
      } catch {
        setList([]);
        return [];
      } finally {
        setLoadingState(false);
      }
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: QuizListParams = {
      chapterId: chapterId || undefined,
      episodeId: episodeId || undefined,
      type: typeFilter || undefined,
      search: debouncedSearch.trim() || undefined,
      page: isPaginated ? page : undefined,
      limit: isPaginated ? DEFAULT_LIMIT : undefined,
    };

    try {
      await ensureChapters();
      const result = await quizService.list(params);
      setItems(result.data);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load quizzes"));
    } finally {
      setLoading(false);
    }
  }, [
    chapterId,
    episodeId,
    typeFilter,
    debouncedSearch,
    page,
    isPaginated,
    ensureChapters,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [chapterId, episodeId, typeFilter, debouncedSearch]);

  useEffect(() => {
    void loadEpisodesForChapter(chapterId, "filter");
    setEpisodeId("");
  }, [chapterId, loadEpisodesForChapter]);

  const loadFormEpisodes = useCallback(
    async (selectedChapterId: string) => {
      return loadEpisodesForChapter(selectedChapterId, "form");
    },
    [loadEpisodesForChapter]
  );

  const startEdit = async (id: string) => {
    mutation.clearError();

    try {
      const quiz = await quizService.getById(id);
      const chapterId =
        quiz.chapterId ??
        quiz.episode?.chapterId ??
        quiz.episode?.chapter?.id ??
        "";
      if (chapterId) await loadFormEpisodes(chapterId);
      editor.startEdit({
        ...quiz,
        chapterId: chapterId || quiz.chapterId,
        items: quizItemsForForm(quiz),
      });
    } catch {
      const row = items.find((item) => item.id === id);
      if (!row) {
        mutation.setError("Quiz question not found");
        return;
      }
      const chapterId =
        row.chapterId ??
        row.episode?.chapterId ??
        row.episode?.chapter?.id ??
        "";
      if (chapterId) await loadFormEpisodes(chapterId);
      editor.startEdit({
        ...row,
        chapterId: chapterId || row.chapterId,
        answer: row.answer,
        options: row.options,
        items: quizItemsForForm(row),
        isPublished: row.isPublished ?? false,
        createdAt: "",
        updatedAt: "",
      });
    }
  };

  const startCreate = () => {
    setFormEpisodes([]);
    editor.startCreate();
  };

  const createQuiz = async (data: CreateQuizInput) => {
    await mutation.run(
      async () => {
        await quizService.create(data);
        await load();
        editor.closeEditor();
      },
      "Failed to create quiz question",
      { rethrow: true }
    );
  };

  const updateQuiz = async (id: string, data: UpdateQuizInput) => {
    await mutation.run(
      async () => {
        await quizService.update(id, data);
        await load();
        editor.closeEditor();
      },
      "Failed to update quiz question",
      { rethrow: true }
    );
  };

  const deleteQuiz = async (id: string) => {
    await mutation.run(async () => {
      await quizService.remove(id);
      editor.cancelDelete();
      await load();
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
    setChapterId,
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
