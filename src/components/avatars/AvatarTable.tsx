"use client";

import { DataTable } from "@/components/DataTable";
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

const columns = [
  { label: "Avatar" },
  { label: "Status" },
  { label: "Updated" },
  { label: "Actions", align: "right" as const },
];

const thumbClass =
  "size-10 shrink-0 rounded-full object-cover ring-1 ring-white/10";

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
    <DataTable columns={columns} minWidth={640} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className="px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarThumb name={item.name} imageUrl={item.imageUrl} />
              <p className="truncate font-medium text-white">{item.name}</p>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <StatusBadge active={item.isActive} />
          </td>
          <td className="px-4 py-3.5 text-[var(--text-muted)]">
            {formatDate(item.updatedAt)}
          </td>
          <td className="px-4 py-3.5">
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
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-bold text-[var(--gold)] ${thumbClass}`}
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
