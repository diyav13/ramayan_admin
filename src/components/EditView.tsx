// Full-page edit/create view: a heading that reflects the mode plus a card
// that wraps the form. Replaces the table while adding or editing an item.

export function EditView({
  title,
  subtitle,
  badge,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-[var(--text-muted)] transition hover:text-white"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-[1.375rem] font-semibold tracking-[-0.01em] sm:text-[1.75rem]">
            {title}
          </h2>
          <p className="subtitle-text mt-1.5">{subtitle}</p>
        </div>
        {badge}
      </div>
      <div className="rounded-lg border border-white/5 bg-[var(--surface-alt)] p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
