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
  { label: "Instruction" },
  { label: "Actions", align: "right" as const },
];

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
    <DataTable columns={columns} minWidth={720} embedded>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.03]"
        >
          <td className="px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-3">
              <InstructionThumb
                instruction={item.instruction}
                imageUrl={item.imageUrl}
              />
              <p className="line-clamp-3 text-sm text-white">
                {item.instruction}
              </p>
            </div>
          </td>
          <td className="px-4 py-3.5 align-top">
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
  const thumbClass =
    "h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10";

  if (imageUrl) {
    return (
      <img src={imageUrl} alt="" className={thumbClass} />
    );
  }

  const initial = instruction.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] text-sm font-bold text-[var(--gold)] ${thumbClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
