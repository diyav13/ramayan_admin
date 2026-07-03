"use client";

import { useState } from "react";

type WithId = { id: string };

/**
 * Shared state machine for the management screens (users, chapters, episodes).
 *
 * Handles the list of items plus the three UI modes they all share:
 *  - creating a new item
 *  - editing an existing item
 *  - confirming a delete on a specific row
 *
 * Domain-specific concerns (id prefixes, timestamps, sorting) stay in the page.
 */
export function useCrud<T extends WithId>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editingItem = editingId
    ? items.find((item) => item.id === editingId) ?? null
    : null;
  const isEditing = creating || editingId !== null;

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
  };

  const startEdit = (id: string) => {
    setCreating(false);
    setEditingId(id);
  };

  const closeEditor = () => {
    setCreating(false);
    setEditingId(null);
  };

  const addItem = (item: T) => setItems((prev) => [item, ...prev]);

  const updateItem = (id: string, patch: Partial<T>) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  return {
    items,
    editingItem,
    isEditing,
    creating,
    confirmDeleteId,
    startCreate,
    startEdit,
    closeEditor,
    addItem,
    updateItem,
    removeItem,
    askDelete: (id: string) => setConfirmDeleteId(id),
    cancelDelete: () => setConfirmDeleteId(null),
  };
}
