import { SelectHTMLAttributes } from "react";
import { controlClass } from "./Field";

type Option = string | { value: string; label: string };

type ToolbarSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly Option[];
};

/** Compact select for list toolbars and filter bars. */
export function ToolbarSelect({
  label,
  id,
  options,
  className = "",
  ...props
}: ToolbarSelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`relative shrink-0 ${className}`}>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        id={selectId}
        aria-label={label}
        className={`${controlClass} h-10 w-full appearance-none truncate bg-[var(--surface)] py-2 pl-3 pr-9 text-sm`}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const text = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value} className="bg-[var(--surface)]">
              {text}
            </option>
          );
        })}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
        <ChevronIcon />
      </span>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
