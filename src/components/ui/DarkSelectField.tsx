"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Field, controlClass } from "@/components/ui/Field";

export type DropdownOption = {
  value: string;
  label: string;
};

type DarkSelectFieldProps = {
  label: string;
  name?: string;
  options: readonly DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

/** Form select with a dark dropdown panel and white option text. */
export function DarkSelectField({
  label,
  name,
  options,
  value,
  defaultValue = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select…",
}: DarkSelectFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const selected = options.find((option) => option.value === currentValue);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function selectOption(optionValue: string) {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <Field label={label} htmlFor={listId}>
      <div ref={rootRef} className="relative">
        {name ? (
          <input
            type="hidden"
            name={name}
            value={currentValue}
            required={required}
          />
        ) : null}
        <button
          id={listId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={`${controlClass} flex h-14 w-full items-center justify-between gap-2 px-4 pr-9 text-left disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selected ? "text-white" : "text-[var(--text-muted)]"
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <ChevronIcon open={open} />
          </span>
        </button>

        {open && !disabled ? (
          <div
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-dark)] shadow-xl shadow-black/40"
          >
            <div className="max-h-52 overflow-y-auto p-1">
              {options.map((option) => {
                const isSelected = option.value === currentValue;
                return (
                  <button
                    key={option.value || "__empty__"}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option.value)}
                    className={`flex w-full truncate bg-[var(--surface-dark)] px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10 ${
                      isSelected ? "bg-white/10 font-medium" : ""
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
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
      className={`transition ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
