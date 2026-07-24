"use client";

// Per-row action buttons with an inline delete confirmation (no modal).

type RowActionsProps = {
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onEpisodes?: () => void;
  onQuizzes?: () => void;
};

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded border transition";

export function RowActions({
  confirming,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
  onEpisodes,
  onQuizzes,
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
    <div className="flex justify-end gap-1.5">
      {onQuizzes ? (
        <button
          type="button"
          onClick={onQuizzes}
          aria-label="View quizzes"
          title="Quizzes"
          className={`${iconButtonClass} border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10`}
        >
          <QuizzesIcon />
        </button>
      ) : null}
      {onEpisodes ? (
        <button
          type="button"
          onClick={onEpisodes}
          aria-label="View episodes"
          title="Episodes"
          className={`${iconButtonClass} border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10`}
        >
          <EpisodesIcon />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        title="Edit"
        className={`${iconButtonClass} border-white/10 text-[var(--text-muted)] hover:bg-white/10 hover:text-white`}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        onClick={onAskDelete}
        aria-label="Delete"
        title="Delete"
        className={`${iconButtonClass} border-red-500/30 text-red-400 hover:bg-red-500/10`}
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function QuizzesIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function EpisodesIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}
