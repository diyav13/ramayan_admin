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
    <div className="flex items-start justify-between gap-2.5 sm:gap-4">
      <div className="min-w-0">
        <h2 className="text-[1.375rem] font-semibold tracking-[-0.01em] sm:text-[1.625rem] md:text-[1.875rem]">
          {title}
        </h2>
        <p className="subtitle-text mt-1 text-xs sm:mt-1.5 sm:text-sm">
          {subtitle}
        </p>
      </div>
      {showAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-md bg-[var(--gold)] px-2.5 text-xs font-semibold tracking-wide text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:gap-1.5 sm:px-4 sm:text-sm"
        >
          <span className="text-sm leading-none sm:text-base" aria-hidden>
            +
          </span>
          <span className="max-w-[6.5rem] truncate sm:max-w-none">
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  );
}
