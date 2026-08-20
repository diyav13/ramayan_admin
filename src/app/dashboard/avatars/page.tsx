"use client";

import { AvatarFiltersBar } from "@/components/avatars/AvatarFiltersBar";
import { AvatarForm } from "@/components/avatars/AvatarForm";
import { AvatarTable } from "@/components/avatars/AvatarTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useAvatars } from "@/hooks/useAvatars";
import { pluralize } from "@/lib/utils";
import type {
  Avatar,
  CreateAvatarInput,
  UpdateAvatarInput,
} from "@/types/avatar";

export default function AvatarsPage() {
  const {
    items,
    pagination,
    totalCount,
    pageRange,
    searchInput,
    setSearchInput,
    clearSearch,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    page,
    setPage,
    loading,
    saving,
    error,
    editingItem,
    isEditing,
    creating,
    confirmDeleteId,
    startCreate,
    startEdit,
    closeEditor,
    createAvatar,
    updateAvatar,
    deleteAvatar,
    askDelete,
    cancelDelete,
  } = useAvatars();

  const sorted = [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  async function handleSave(
    payload: CreateAvatarInput | UpdateAvatarInput,
    existing: Avatar | null
  ) {
    if (existing) {
      await updateAvatar(existing.id, payload as UpdateAvatarInput);
    } else {
      await createAvatar(payload as CreateAvatarInput);
    }
  }

  if (isEditing) {
    const avatar = editingItem;
    return (
      <EditView
        title={creating ? "Add Avatar" : avatar?.name ?? "Avatar"}
        subtitle={
          creating
            ? "Upload art for the mobile select-avatar screen"
            : "Update avatar image or visibility"
        }
        onBack={closeEditor}
      >
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <AvatarForm
          avatar={avatar}
          saving={saving}
          creating={creating}
          onSave={(payload) => handleSave(payload, avatar)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  const subtitle = loading
    ? "Loading avatars…"
    : `${pluralize(totalCount, "avatar")} total`;

  const paginationSummary = pageRange
    ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
    : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Avatar Management"
        subtitle={subtitle}
        actionLabel="Add Avatar"
        onAction={startCreate}
      />

      <AvatarFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ListState message="Loading avatars…" />
      ) : items.length === 0 ? (
        <ListState
          message="No avatars found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Upload your first avatar for users to select in the app."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <AvatarTable
            items={sorted}
            confirmDeleteId={confirmDeleteId}
            onEdit={startEdit}
            onAskDelete={askDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={(id) => {
              void deleteAvatar(id);
            }}
            embedded
          />

          {pagination && (
            <Pagination
              pagination={pagination}
              page={page}
              onPageChange={setPage}
              loading={loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
