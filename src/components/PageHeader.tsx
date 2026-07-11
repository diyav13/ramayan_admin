"use client";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionDisabled = false,
}: PageHeaderProps) {
  const showAction = Boolean(actionLabel && onAction);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
      </div>
      {showAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-base leading-none">+</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
