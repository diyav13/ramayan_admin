"use client";

import { DataTable, columnHideClass } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";
import type { Character } from "@/types/character";

export const characterColumns = [
  { label: "Character" },
  { label: "Places", hideBelow: "md" as const, width: "11rem" },
  { label: "Key event", hideBelow: "lg" as const, width: "12rem" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

export const characterHideMd = columnHideClass("md");
export const characterHideLg = columnHideClass("lg");
export const characterCellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
export const characterActionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";

const thumbClass =
  "size-10 shrink-0 rounded-full object-cover ring-1 ring-white/10 sm:size-12";

type CharacterTableProps = {
  items: Character[];
  confirmDeleteId: string | null;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  embedded?: boolean;
};

function CharacterThumb({
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

function placeSummary(character: Character): string {
  if (!character.locations?.length) return "—";
  const names = character.locations.map((l) => l.name);
  if (names.length <= 2) return names.join(" · ");
  return `${names.slice(0, 2).join(" · ")} +${names.length - 2}`;
}

export function CharacterTable({
  items,
  confirmDeleteId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  embedded = false,
}: CharacterTableProps) {
  const table = (
    <DataTable columns={characterColumns} embedded>
      {items.map((item) => {
        const subtitle =
          item.title?.trim() ||
          item.description?.replace(/<[^>]+>/g, "").trim() ||
          null;

        return (
          <tr
            key={item.id}
            className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
          >
            <td className={`${characterCellPad} overflow-hidden align-top`}>
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <CharacterThumb name={item.name} imageUrl={item.imageUrl} />
                <div className="min-w-0 flex-1 pr-1">
                  <p
                    className="truncate text-[0.9375rem] font-semibold capitalize leading-snug tracking-[-0.01em] text-white sm:text-base"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p
                    className="mt-0.5 line-clamp-2 break-words text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs"
                    title={subtitle ?? undefined}
                  >
                    {subtitle ?? "—"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-[var(--text-muted)] md:hidden">
                    {placeSummary(item)}
                  </p>
                </div>
              </div>
            </td>
            <td
              className={`${characterCellPad} ${characterHideMd} overflow-hidden align-top`}
            >
              <p
                className="line-clamp-2 break-words text-xs leading-snug text-[var(--text-muted)] sm:text-sm"
                title={placeSummary(item)}
              >
                {placeSummary(item)}
              </p>
            </td>
            <td
              className={`${characterCellPad} ${characterHideLg} overflow-hidden align-top`}
            >
              <p
                className="line-clamp-2 break-words text-xs leading-snug text-[var(--text-muted)] sm:text-sm"
                title={item.keyEvent?.name ?? undefined}
              >
                {item.keyEvent?.name ?? "—"}
              </p>
            </td>
            <td className={`${characterActionsPad} align-top`}>
              <RowActions
                confirming={confirmDeleteId === item.id}
                onEdit={() => onEdit(item.id)}
                onAskDelete={() => onAskDelete(item.id)}
                onCancelDelete={onCancelDelete}
                onConfirmDelete={() => onConfirmDelete(item.id)}
              />
            </td>
          </tr>
        );
      })}
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
