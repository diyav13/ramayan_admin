"use client";

import { DataTable } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";
import type { QuizInstruction } from "@/types/quiz-instruction";

type QuizInstructionTableProps = {
  items: QuizInstruction[];
  confirmDeleteId: string | null;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  /** When true, omit outer border so parent can wrap table + pagination. */
  embedded?: boolean;
};

const columns = [
  { label: "Instruction" }, // fluid text column
  { label: "Actions", align: "right" as const, width: "6.5rem" }, // 2 icon buttons
];

const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";
const actionsPad = "px-1.5 py-2.5 sm:px-2 sm:py-3.5 md:px-3";

const instructionThumbClass =
  "h-8 w-11 shrink-0 rounded-md object-cover ring-1 ring-white/10 sm:h-10 sm:w-14 sm:rounded-lg";

export function QuizInstructionTable({
  items,
  confirmDeleteId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  embedded = false,
}: QuizInstructionTableProps) {
  const table = (
    <DataTable columns={columns} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className={`${cellPad} overflow-hidden align-top`}>
            <div className="flex min-w-0 items-start gap-2 sm:gap-3">
              <InstructionThumb
                instruction={item.instruction}
                imageUrl={item.imageUrl}
              />
              <p
                className="line-clamp-3 min-w-0 break-words text-xs leading-snug text-white sm:text-sm"
                title={item.instruction}
              >
                {item.instruction}
              </p>
            </div>
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

function InstructionThumb({
  instruction,
  imageUrl,
}: {
  instruction: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={instructionThumbClass} />;
  }

  const initial = instruction.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-semibold text-[var(--gold)] sm:text-base ${instructionThumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
