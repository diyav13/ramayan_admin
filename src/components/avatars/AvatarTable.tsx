"use client";

import { DataTable, columnHideClass } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";
import { formatDate } from "@/lib/utils";
import type { Avatar } from "@/types/avatar";

type AvatarTableProps = {
  items: Avatar[];
  confirmDeleteId: string | null;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  embedded?: boolean;
};

export const avatarColumns = [
  { label: "Avatar" },
  { label: "Status", hideBelow: "md" as const, width: "5.75rem" },
  { label: "Updated", hideBelow: "md" as const, width: "6rem" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

export const avatarHideMd = columnHideClass("md");
export const avatarCellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
export const avatarActionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";

const thumbClass =
  "size-8 shrink-0 rounded-full object-cover ring-1 ring-white/10 sm:size-10";

export function AvatarTable({
  items,
  confirmDeleteId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  embedded = false,
}: AvatarTableProps) {
  const table = (
    <DataTable columns={avatarColumns} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className={`${avatarCellPad} overflow-hidden align-top`}>
            <div className="flex min-w-0 items-start gap-2 sm:gap-3">
              <AvatarThumb name={item.name} imageUrl={item.imageUrl} />
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className="truncate text-[0.9375rem] font-semibold capitalize leading-snug tracking-[-0.01em] text-white sm:text-base"
                  title={item.name}
                >
                  {item.name}
                </p>
                {/* Mobile-only meta: replaces Status / Updated cols */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                  <StatusBadge active={item.isActive} />
                  <span className="truncate text-[11px] text-[var(--text-muted)]">
                    {formatDate(item.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </td>
          <td className={`${avatarCellPad} ${avatarHideMd} align-top`}>
            <StatusBadge active={item.isActive} />
          </td>
          <td
            className={`${avatarCellPad} ${avatarHideMd} align-top text-[var(--text-muted)]`}
          >
            {formatDate(item.updatedAt)}
          </td>
          <td className={`${avatarActionsPad} align-top`}>
            <RowActions
              confirming={confirmDeleteId === item.id}
              onEdit={() => onEdit(item.id)}
              onAskDelete={() => onAskDelete(item.id)}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={() => onConfirmDelete(item.id)}
            />
          </td>
        </tr>
      ))}
    </DataTable>
  );

  if (embedded) {
    return table;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
      {table}
    </div>
  );
}

function AvatarThumb({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={thumbClass} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${thumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-white/5 text-[var(--text-muted)]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
