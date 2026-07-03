// Shared label + spacing wrapper for form controls (Input, Textarea, Select…).

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm text-[var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Shared base classes for text-like controls (inputs, selects, textareas). */
export const controlClass =
  "w-full rounded bg-[var(--surface)] text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--gold)]";
