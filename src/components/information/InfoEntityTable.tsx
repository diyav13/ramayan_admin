"use client";

import { DataTable, columnHideClass } from "@/components/DataTable";
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
  { label: "Name" }, // fluid identity; expands when Description is hidden on mobile
  { label: "Description", hideBelow: "md" as const, width: "42%" },
  { label: "Actions", align: "right" as const, width: "6.5rem" }, // 2 icon buttons
];

const hideMd = columnHideClass("md");
const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
const actionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";

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
      ? "size-8 shrink-0 rounded-md object-cover ring-1 ring-white/10 sm:size-10 sm:rounded-lg"
      : "h-8 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/10 sm:h-10 sm:w-14 sm:rounded-lg";

  const table = (
    <DataTable columns={columns} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className={`${cellPad} overflow-hidden align-top`}>
            <div className="flex min-w-0 items-start gap-2 sm:gap-3">
              <EntityThumb
                name={item.name}
                imageUrl={item.imageUrl}
                className={thumbClass}
              />
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className="truncate text-[0.9375rem] font-semibold capitalize leading-snug tracking-[-0.01em] text-white sm:text-base"
                  title={item.name}
                >
                  {item.name}
                </p>
                {/* Mobile-only: replaces Description column */}
                <p
                  className="mt-0.5 line-clamp-2 break-words text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs md:hidden"
                  title={item.description ?? undefined}
                >
                  {item.description ?? "—"}
                </p>
              </div>
            </div>
          </td>
          <td className={`${cellPad} ${hideMd} overflow-hidden align-top`}>
            <p
              className="line-clamp-2 break-words text-xs leading-snug text-[var(--text-muted)] sm:text-sm"
              title={item.description ?? undefined}
            >
              {item.description ?? "—"}
            </p>
          </td>
          <td className={`${actionsPad} align-top`}>
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
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
