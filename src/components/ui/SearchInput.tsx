"use client";

import { InputHTMLAttributes } from "react";
import { controlClass } from "./Field";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
  /** Shows a spinner at the trailing end while a search request is in flight. */
  loading?: boolean;
};

export function SearchInput({
  className = "",
  value,
  onClear,
  loading = false,
  placeholder = "Search…",
  disabled,
  ...props
}: SearchInputProps) {
  const hasValue = String(value ?? "").length > 0;
  const showClear = hasValue && onClear && !disabled && !loading;

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={`${controlClass} h-10 w-full py-2 pl-10 pr-9 text-sm disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-search-cancel-button]:hidden`}
        {...props}
      />
      {loading ? (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-label="Searching"
          role="status"
        >
          <SpinnerIcon />
        </span>
      ) : null}
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] transition hover:bg-white/10 hover:text-white"
        >
          <ClearIcon />
        </button>
      ) : null}
    </div>
  );
}

function SearchIcon() {
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
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon() {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
