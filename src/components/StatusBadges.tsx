// Shared status indicators used in the chapters and episodes tables.

export function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded bg-[var(--progress)]/20 px-2 py-0.5 text-xs font-medium text-[var(--progress)]">
      Published
    </span>
  ) : (
    <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium">
      Draft
    </span>
  );
}

export function PremiumLabel({ premium }: { premium: boolean }) {
  return premium ? (
    <span className="text-[var(--gold)]">Premium</span>
  ) : (
    <span className="text-[var(--text-muted)]">Free</span>
  );
}

export function UserPlanBadge({ premium }: { premium: boolean }) {
  if (premium) {
    return (
      <span className="inline-flex rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--gold)]">
        Premium
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      User
    </span>
  );
}
