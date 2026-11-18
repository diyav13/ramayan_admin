"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Field, controlClass } from "@/components/ui/Field";
import { stopNestedScroll } from "@/lib/utils";

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
  /**
   * `overlay` — floating menu (default).
   * `inline` — expands in the form flow (better inside scroll panels).
   */
  menuMode?: "overlay" | "inline";
  /** Show a search box when there are many options (default: auto for 8+). */
  searchable?: boolean;
  searchPlaceholder?: string;
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
  menuMode = "overlay",
  searchable,
  searchPlaceholder = "Search…",
}: DarkSelectFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const inline = menuMode === "inline";
  const showSearch = searchable ?? options.length >= 8;

  const selected = options.find((option) => option.value === currentValue);

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

  useEffect(() => {
    if (!open) return;
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (showSearch) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [open, showSearch]);

  function selectOption(optionValue: string) {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setOpen(false);
    setSearch("");
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
      <div ref={rootRef} className={inline ? "" : "relative"}>
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
          className={`${controlClass} relative flex h-12 w-full items-center justify-between gap-2 px-4 pr-9 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
            open ? "ring-1 ring-[var(--gold)]/50" : ""
          }`}
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
            className={
              inline
                ? "mt-2 overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-dark)]"
                : "absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-dark)] shadow-xl shadow-black/40"
            }
          >
            {showSearch ? (
              <div className="border-b border-white/5 p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded bg-[var(--surface-alt)] px-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]"
                />
              </div>
            ) : null}
            <div
              className={`${inline ? "max-h-56" : "max-h-52"} overflow-y-auto overscroll-contain p-1`}
              onWheel={stopNestedScroll}
            >
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
                  No matches
                </p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === currentValue;
                  return (
                    <button
                      key={option.value || "__empty__"}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(option.value)}
                      className={`flex w-full bg-[var(--surface-dark)] px-3 py-3 text-left text-sm text-white transition hover:bg-white/10 ${
                        isSelected ? "bg-white/10 font-medium" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1 break-words">
                        {option.label}
                      </span>
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
