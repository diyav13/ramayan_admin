"use client";

import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable, columnHideClass } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListState } from "@/components/ListState";
import { Pagination } from "@/components/Pagination";
import { UserPlanBadge } from "@/components/StatusBadges";
import { UserFiltersBar } from "@/components/users/UserFiltersBar";
import { UserForm } from "@/components/users/UserForm";
import { UserProgressDetails } from "@/components/users/UserProgressDetails";
import { useUsers } from "@/hooks/useUsers";
import { formatDate, pluralize } from "@/lib/utils";
import type { User } from "@/types/user";

const columns = [
  { label: "User" }, // fluid identity column (avatar + name/email)
  { label: "Plan", hideBelow: "md" as const, width: "5.75rem" },
  { label: "Created", hideBelow: "md" as const, width: "7rem" },
  { label: "Actions", align: "right" as const, width: "6.5rem" }, // 2 icon buttons
];

const hideMd = columnHideClass("md");
const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
const actionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";
const SKELETON_ROWS = 6;

const thumbClass =
  "size-8 shrink-0 rounded-full object-cover ring-1 ring-white/10 sm:size-10";

function displayName(user: User): string {
  return user.name?.trim() || user.email || user.phone || "Unnamed user";
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function UsersTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={columns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={cellPad}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <SkeletonBar className="size-8 shrink-0 rounded-full sm:size-10" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[10rem]" />
                  <SkeletonBar className="h-3 w-[40%] max-w-[7rem]" />
                  <div className="mt-1 flex flex-wrap gap-1.5 md:hidden">
                    <SkeletonBar className="h-5 w-14 rounded-full" />
                    <SkeletonBar className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </td>
            <td className={`${cellPad} ${hideMd}`}>
              <SkeletonBar className="h-5 w-14 rounded-full" />
            </td>
            <td className={`${cellPad} ${hideMd}`}>
              <SkeletonBar className="h-3.5 w-16" />
            </td>
            <td className={actionsPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading users…</span>
    </div>
  );
}

export default function UsersPage() {
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
    confirmDeleteId,
    startEdit,
    closeEditor,
    updateUser,
    deleteUser,
    askDelete,
    cancelDelete,
  } = useUsers();

  const paginationSummary = pageRange
    ? `Showing ${pageRange.from}–${pageRange.to} of ${totalCount}`
    : undefined;

  if (isEditing && editingItem) {
    const user = editingItem;
    return (
      <EditView
        title="Edit User"
        subtitle={`Editing ${displayName(user)}`}
        badge={<UserPlanBadge premium={user.isPremium} />}
      >
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <UserForm
          user={user}
          saving={saving}
          onSave={(payload) => updateUser(user.id, payload)}
          onCancel={closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="User Management"
        subtitle={
          loading
            ? "Loading users…"
            : `${pluralize(totalCount, "user")} total`
        }
      />

      <UserFiltersBar
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchClear={clearSearch}
        disabled={loading}
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <UsersTableSkeleton />
      ) : items.length === 0 ? (
        <ListState
          message="No users found"
          hint={
            hasActiveFilters ? "Try adjusting your search." : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} embedded>
            {items.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
              >
                <td className={`${cellPad} overflow-hidden align-top`}>
                  <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1 pr-1">
                      <p
                        className="truncate text-[0.9375rem] font-semibold capitalize leading-snug tracking-[-0.01em] text-white sm:text-base"
                        title={displayName(user)}
                      >
                        {displayName(user)}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)] sm:text-xs">
                        {user.email ?? "—"}
                      </p>
                      {user.selectedAvatar ? (
                        <p className="truncate text-[11px] text-[var(--gold)] sm:text-xs">
                          Avatar: {user.selectedAvatar.name}
                          {!user.selectedAvatar.isActive ? " (inactive)" : ""}
                        </p>
                      ) : user.avatarUrl ? (
                        <p className="truncate text-[11px] text-[var(--text-muted)] sm:text-xs">
                          Custom avatar (not in catalog)
                        </p>
                      ) : null}
                      <div className="hidden sm:block">
                        <UserProgressDetails user={user} />
                      </div>
                      {/* Mobile-only meta: replaces Plan / Created cols */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                        <UserPlanBadge premium={user.isPremium} />
                        <span className="truncate text-[11px] text-[var(--text-muted)]">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`${cellPad} ${hideMd} align-top`}>
                  <UserPlanBadge premium={user.isPremium} />
                </td>
                <td
                  className={`${cellPad} ${hideMd} align-top text-[var(--text-muted)]`}
                >
                  {formatDate(user.createdAt)}
                </td>
                <td className={`${actionsPad} align-top`}>
                  <RowActions
                    confirming={confirmDeleteId === user.id}
                    onEdit={() => startEdit(user.id)}
                    onAskDelete={() => askDelete(user.id)}
                    onCancelDelete={cancelDelete}
                    onConfirmDelete={() => void deleteUser(user.id)}
                  />
                </td>
              </tr>
            ))}
          </DataTable>

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

function UserAvatar({ user }: { user: User }) {
  const name = displayName(user);

  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={name} className={thumbClass} />;
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${thumbClass}`}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}
