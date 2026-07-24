"use client";

import { DataTable } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";

export type InfoListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  updatedAt: string;
};

type InfoEntityTableProps = {
  items: InfoListItem[];
  imageVariant?: "portrait" | "landscape";
  confirmDeleteId: string | null;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  /** When true, omit outer border so parent can wrap table + pagination. */
  embedded?: boolean;
};

const columns = [
  { label: "Name" },
  { label: "Description" },
  { label: "Actions", align: "right" as const },
];

export function InfoEntityTable({
  items,
  imageVariant = "portrait",
  confirmDeleteId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  embedded = false,
}: InfoEntityTableProps) {
  const thumbClass =
    imageVariant === "portrait"
      ? "size-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
      : "h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10";

  const table = (
    <DataTable columns={columns} minWidth={720} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className="px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <EntityThumb
                name={item.name}
                imageUrl={item.imageUrl}
                className={thumbClass}
              />
              <p className="truncate font-medium text-white">{item.name}</p>
            </div>
          </td>
          <td className="max-w-md px-4 py-3.5">
            <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
              {item.description ?? "—"}
            </p>
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

function EntityThumb({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl: string | null;
  className: string;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={className} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-bold text-[var(--gold)] ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
