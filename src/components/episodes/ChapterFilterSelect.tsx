"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { controlClass } from "@/components/ui/Field";

export type ChapterFilterOption = {
  value: string;
  label: string;
  accentColor?: string | null;
};

type ChapterFilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ChapterFilterOption[];
  className?: string;
};

/** Chapter filter with dark dropdown rows and a 2px accent stripe on the right. */
export function ChapterFilterSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}: ChapterFilterSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

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
    onChange(optionValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <label htmlFor={listId} className="sr-only">
        {label}
      </label>
      <button
        id={listId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`${controlClass} flex h-10 w-full items-center justify-between gap-2 py-2 pl-3 pr-9 text-left`}
        style={
          selected?.accentColor
            ? { borderRight: `2px solid ${selected.accentColor}` }
            : undefined
        }
      >
        <span className="min-w-0 flex-1 truncate text-white">
          {selected?.label ?? "All chapters"}
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-dark)] shadow-xl shadow-black/40"
        >
          <div className="max-h-52 overflow-y-auto p-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value || "__all__"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.value)}
                  className={`flex w-full truncate px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/10 ${
                    isSelected ? "bg-white/10 font-medium" : "bg-[var(--surface-dark)]"
                  }`}
                  style={
                    option.accentColor
                      ? { borderRight: `2px solid ${option.accentColor}` }
                      : undefined
                  }
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
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
