export function ListState({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-[var(--surface-alt)]/50 px-6 py-16 text-center">
      <p className="text-sm font-medium text-white">{message}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}
