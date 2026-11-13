"use client";

import { AvatarFiltersBar } from "@/components/avatars/AvatarFiltersBar";
import { AvatarForm } from "@/components/avatars/AvatarForm";
import {
  AvatarTable,
  avatarActionsPad,
  avatarCellPad,
  avatarColumns,
  avatarHideMd,
} from "@/components/avatars/AvatarTable";
import { DataTable } from "@/components/DataTable";
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

const SKELETON_ROWS = 6;

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function AvatarsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={avatarColumns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={avatarCellPad}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <SkeletonBar className="size-8 shrink-0 rounded-full sm:size-10" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <div className="mt-1 flex flex-wrap gap-1.5 md:hidden">
                    <SkeletonBar className="h-5 w-14 rounded-full" />
                    <SkeletonBar className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </td>
            <td className={`${avatarCellPad} ${avatarHideMd}`}>
              <SkeletonBar className="h-5 w-14 rounded-full" />
            </td>
            <td className={`${avatarCellPad} ${avatarHideMd}`}>
              <SkeletonBar className="h-3.5 w-16" />
            </td>
            <td className={avatarActionsPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading avatars…</span>
    </div>
  );
}

export default function AvatarsPage() {
  const {
    items,
    pagination,
    totalCount,
    pageRange,
    searchInput,
    setSearchInput,
    clearSearch,
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
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Avatar Management"
        subtitle={subtitle}
        actionLabel="Add Avatar"
        onAction={startCreate}
        actionDisabled={loading}
      />

      <AvatarFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        disabled={loading}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <AvatarsTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No avatars found"
          hint={
            hasActiveFilters
              ? "Try adjusting your search."
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
