// Full-page edit/create view: a heading that reflects the mode plus a card
// that wraps the form. Replaces the table while adding or editing an item.

export function EditView({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
      </div>
      <div className="rounded-lg border border-white/5 bg-[var(--surface-alt)] p-6">
        {children}
      </div>
    </div>
  );
}
