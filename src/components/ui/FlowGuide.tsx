import type { ReactNode } from "react";

type FlowGuideProps = {
  title?: string;
  steps: readonly string[];
  footer?: ReactNode;
  /** Single-row layout for height-tight screens (e.g. Story Map). */
  compact?: boolean;
};

/** Compact “how this screen works” tip — presentation only. */
export function FlowGuide({
  title = "How this works",
  steps,
  footer,
  compact = false,
}: FlowGuideProps) {
  if (compact) {
    return (
      <div className="rounded-md border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--gold)]">{title}: </span>
          {steps.map((step, index) => (
            <span key={`${index}-${step}`}>
              {index > 0 ? (
                <span className="mx-1.5 text-white/25" aria-hidden>
                  →
                </span>
              ) : null}
              <span className="text-[var(--gold)]/90">{index + 1}.</span> {step}
            </span>
          ))}
        </p>
        {footer ? (
          <p className="mt-1 text-[11px] text-[var(--text-muted)]/80">{footer}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-3.5 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--gold)]">
        {title}
      </p>
      <ol className="mt-2 space-y-1.5">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step}`}
            className="flex gap-2.5 text-xs leading-relaxed text-[var(--text-muted)] sm:text-[13px]"
          >
            <span
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[10px] font-semibold text-[var(--gold)]"
              aria-hidden
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {footer ? (
        <div className="mt-2.5 text-xs text-[var(--text-muted)]">{footer}</div>
      ) : null}
    </div>
  );
}
