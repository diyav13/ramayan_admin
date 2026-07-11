"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Field, controlClass } from "./Field";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  label: string;
  options: readonly MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
};

/**
 * Multi-select dropdown: closed trigger shows chips; open panel lists checkboxes.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyMessage = "No options available",
  searchPlaceholder = "Search…",
}: MultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(() => new Set(value), [value]);

  const selectedOptions = useMemo(
    () => options.filter((option) => selected.has(option.value)),
    [options, selected]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function toggle(optionValue: string) {
    if (selected.has(optionValue)) {
      onChange(value.filter((id) => id !== optionValue));
      return;
    }
    onChange([...value, optionValue]);
  }

  function remove(optionValue: string) {
    onChange(value.filter((id) => id !== optionValue));
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const summary =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;

  return (
    <Field label={label} htmlFor={listId}>
      <div ref={rootRef} className="relative">
        <button
          id={listId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={`${controlClass} flex min-h-14 items-center justify-between gap-2 px-4 text-left`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOptions.length === 0
                ? "text-[var(--text-muted)]"
                : "text-white"
            }`}
          >
            {summary}
          </span>
          <ChevronIcon open={open} />
        </button>

        {selectedOptions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-2 py-1 text-xs text-[var(--gold)]"
              >
                <span className="truncate">{option.label}</span>
                <button
                  type="button"
                  onClick={() => remove(option.value)}
                  aria-label={`Remove ${option.label}`}
                  className="shrink-0 rounded p-0.5 transition hover:bg-white/10 hover:text-white"
                >
                  <ClearIcon />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {open ? (
          <div
            role="listbox"
            aria-multiselectable
            aria-label={label}
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[var(--surface)] shadow-xl shadow-black/40"
          >
            <div className="border-b border-white/5 p-2">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded bg-[var(--surface-alt)] px-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]"
                autoFocus
              />
            </div>

            <div className="max-h-52 overflow-y-auto p-1">
              {options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
                  {emptyMessage}
                </p>
              ) : filteredOptions.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
                  No matches
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const checked = selected.has(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(option.value)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition ${
                        checked
                          ? "bg-[var(--gold)]/15 text-white"
                          : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-[var(--gold)] bg-[var(--gold)] text-black"
                            : "border-white/20"
                        }`}
                        aria-hidden
                      >
                        {checked ? <CheckIcon /> : null}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })
              )}
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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-[var(--text-muted)] transition ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
