"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEditorState } from "@/hooks/useEditorState";
import { useMutationState } from "@/hooks/useMutationState";
import { getErrorMessage } from "@/lib/api/errors";
import {
  computePageRange,
  DEFAULT_LIMIT,
  totalFromPagination,
} from "@/lib/pagination";
import { locationService } from "@/services/locations";
import type { PaginationMeta } from "@/types/api";
import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "@/types/location";

export function useLocations() {
  const [items, setItems] = useState<Location[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditorState<Location>();
  const mutation = useMutationState();

  const hasActiveFilters = Boolean(debouncedSearch.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await locationService.list({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: DEFAULT_LIMIT,
      });
      setItems(result.data);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load locations"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const startEdit = async (id: string) => {
    mutation.clearError();

    try {
      const location = await locationService.getById(id);
      editor.startEdit(location);
    } catch {
      const row = items.find((item) => item.id === id);
      if (!row) {
        mutation.setError("Location not found");
        return;
      }
      editor.startEdit(row);
    }
  };

  const createLocation = async (data: CreateLocationInput) => {
    await mutation.run(
      async () => {
        await locationService.create(data);
        await load();
        editor.closeEditor();
      },
      "Failed to create location",
      { rethrow: true }
    );
  };

  const updateLocation = async (id: string, data: UpdateLocationInput) => {
    await mutation.run(
      async () => {
        await locationService.update(id, data);
        await load();
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
      await load();
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
