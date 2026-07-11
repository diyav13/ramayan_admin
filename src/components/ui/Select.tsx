import { SelectHTMLAttributes } from "react";
import { Field, controlClass } from "./Field";

type Option = string | { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly Option[];
};

export function Select({
  label,
  id,
  options,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? label.toLowerCase();

  return (
    <Field label={label} htmlFor={selectId}>
      <select
        id={selectId}
        className={`${controlClass} h-14 px-4 ${className}`}
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
    </Field>
  );
}
