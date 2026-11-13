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
      <label htmlFor={htmlFor} className="label-text">
        {label}
      </label>
      {description ? (
        <p className="text-xs leading-snug tracking-wide text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Shared base classes for text-like controls (inputs, selects, textareas). */
export const controlClass =
  "control-text w-full rounded bg-[var(--surface)] text-white placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--gold)]";
