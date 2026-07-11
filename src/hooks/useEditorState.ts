"use client";

import { useState } from "react";

/**
 * Shared create / edit / delete-confirm UI state for admin resource screens.
 */
export function useEditorState<T>() {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isEditing = creating || editingItem !== null;

  const startCreate = () => {
    setEditingItem(null);
    setCreating(true);
  };

  const startEdit = (item: T) => {
    setCreating(false);
    setEditingItem(item);
  };

  const closeEditor = () => {
    setCreating(false);
    setEditingItem(null);
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  return {
    editingItem,
    creating,
    confirmDeleteId,
    isEditing,
    startCreate,
    startEdit,
    closeEditor,
    askDelete: (id: string) => setConfirmDeleteId(id),
    cancelDelete,
  };
}
