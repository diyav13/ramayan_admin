"use client";

import { DataTable, columnHideClass } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";
import type { Event } from "@/types/event";

export const eventColumns = [
  { label: "Event" },
  { label: "Location", hideBelow: "md" as const, width: "9rem" },
  { label: "People", hideBelow: "lg" as const, width: "14rem" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

export const eventHideMd = columnHideClass("md");
export const eventHideLg = columnHideClass("lg");
export const eventCellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
export const eventActionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";

const thumbClass =
  "size-10 shrink-0 rounded-full object-cover ring-1 ring-white/10 sm:size-12";

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EventThumb({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={thumbClass} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] ${thumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function peopleLabel(event: Event): string {
  if (!event.characters?.length) return "—";
  return event.characters.map((character) => character.name).join(", ");
}

function subtitle(event: Event): string {
  const place = event.location?.name?.trim() || "No location";
  const plain = stripHtml(event.description);
  if (!plain) return place;
  return `${place} · ${plain}`;
}

type EventTableProps = {
  items: Event[];
  confirmDeleteId: string | null;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  embedded?: boolean;
};

export function EventTable({
  items,
  confirmDeleteId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  embedded = false,
}: EventTableProps) {
  const table = (
    <DataTable columns={eventColumns} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className={`${eventCellPad} overflow-hidden align-top`}>
            <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
              <EventThumb name={item.name} imageUrl={item.imageUrl} />
              <div className="min-w-0 flex-1 pr-1">
                <p
                  className="truncate text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-base"
                  title={item.name}
                >
                  {item.name}
                </p>
                <p
                  className="mt-0.5 line-clamp-2 break-words text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs"
                  title={subtitle(item)}
                >
                  {subtitle(item)}
                </p>
                <p className="mt-1 truncate text-[11px] text-[var(--text-muted)] md:hidden">
                  {item.location?.name ?? "—"}
                </p>
              </div>
            </div>
          </td>
          <td className={`${eventCellPad} ${eventHideMd} overflow-hidden align-top`}>
            <p className="truncate text-xs text-[var(--text-muted)] sm:text-sm">
              {item.location?.name ?? "—"}
            </p>
          </td>
          <td className={`${eventCellPad} ${eventHideLg} overflow-hidden align-top`}>
            <p
              className="line-clamp-2 break-words text-xs text-[var(--text-muted)] sm:text-sm"
              title={peopleLabel(item)}
            >
              {peopleLabel(item)}
            </p>
          </td>
          <td className={`${eventActionsPad} align-top`}>
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

  if (embedded) return table;

  return (
    <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
      {table}
    </div>
  );
}
