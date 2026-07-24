// Shared label + spacing wrapper for form controls (Input, Textarea, Select…).

export function Field({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm text-[var(--text-muted)]">
        {label}
      </label>
      {description ? (
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Shared base classes for text-like controls (inputs, selects, textareas). */
export const controlClass =
  "w-full rounded bg-[var(--surface)] text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--gold)]";
