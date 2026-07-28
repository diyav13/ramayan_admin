"use client";

import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
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
  { label: "User" },
  { label: "Plan" },
  { label: "Created" },
  { label: "Actions", align: "right" as const },
];

function displayName(user: User): string {
  return user.name?.trim() || user.email || user.phone || "Unnamed user";
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
    <div className="space-y-5">
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
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ListState message="Loading users…" />
      ) : items.length === 0 ? (
        <ListState
          message="No users found"
          hint={
            hasActiveFilters ? "Try adjusting your search." : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <DataTable columns={columns} minWidth={880} embedded>
            {items.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-start gap-3">
                    <Avatar user={user} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {displayName(user)}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {user.email ?? "—"}
                      </p>
                      <UserProgressDetails user={user} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <UserPlanBadge premium={user.isPremium} />
                </td>
                <td className="px-4 py-3.5 align-top text-[var(--text-muted)]">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3.5 align-top">
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

function Avatar({ user }: { user: User }) {
  const name = displayName(user);

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-bold text-[var(--gold)] ring-1 ring-white/10">
      {initials || "?"}
    </div>
  );
}
