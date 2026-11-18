import type { ReactNode } from "react";

type FormSectionProps = {
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
};

/** Visual grouping for long admin forms — no behavior change. */
export function FormSection({
  step,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border border-white/8 bg-black/15 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        {typeof step === "number" ? (
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs font-semibold text-[var(--gold)]"
            aria-hidden
          >
            {step}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-wide text-white">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)] sm:text-[13px]">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
