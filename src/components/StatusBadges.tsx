// Shared status indicators used in the chapters and episodes tables.

export function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex max-w-full truncate rounded bg-[var(--progress)]/20 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--progress)] sm:px-2 sm:text-xs">
      Published
    </span>
  ) : (
    <span className="inline-flex max-w-full truncate rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide sm:px-2 sm:text-xs">
      Draft
    </span>
  );
}

export function PremiumLabel({ premium }: { premium: boolean }) {
  return premium ? (
    <span className="text-[11px] font-medium tracking-wide text-[var(--gold)] sm:text-sm">
      Premium
    </span>
  ) : (
    <span className="text-[11px] font-medium tracking-wide text-[var(--text-muted)] sm:text-sm">
      Free
    </span>
  );
}

export function UserPlanBadge({ premium }: { premium: boolean }) {
  if (premium) {
    return (
      <span className="inline-flex rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--gold)]">
        Premium
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
      User
    </span>
  );
}
