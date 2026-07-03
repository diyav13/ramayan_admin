"use client";

// Per-row Edit / Delete actions with an inline delete confirmation
// (no modal). Reused across all management tables.

type RowActionsProps = {
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function RowActions({
  confirming,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: RowActionsProps) {
  if (confirming) {
    return (
      <div className="flex justify-end gap-2">
        <span className="self-center text-xs text-[var(--text-muted)]">
          Delete?
        </span>
        <button
          type="button"
          onClick={onConfirmDelete}
          className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          className="rounded border border-white/10 px-3 py-1 text-xs transition hover:bg-white/10"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded border border-white/10 px-3 py-1 text-xs transition hover:bg-white/10"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onAskDelete}
        className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
      >
        Delete
      </button>
    </div>
  );
}
