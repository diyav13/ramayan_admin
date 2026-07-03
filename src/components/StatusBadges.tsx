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
