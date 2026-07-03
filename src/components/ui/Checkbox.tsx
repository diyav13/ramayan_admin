import { InputHTMLAttributes } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <input
        type="checkbox"
        className={`size-4 accent-[var(--gold)] ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
