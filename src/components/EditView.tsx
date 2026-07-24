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
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-white"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        {badge}
      </div>
      <div className="rounded-lg border border-white/5 bg-[var(--surface-alt)] p-6">
        {children}
      </div>
    </div>
  );
}
