"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Field, controlClass } from "@/components/ui/Field";

type HtmlEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeightClass?: string;
};

function normalizeHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<div><br></div>") {
    return "";
  }
  return trimmed;
}

/** Drop forced text colors so the editor stays white on the dark surface. */
function stripForcedTextColors(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[style], font[color]").forEach((node) => {
    if (node instanceof HTMLFontElement) {
      node.removeAttribute("color");
    }
    if (node.style.color) {
      node.style.removeProperty("color");
    }
  });
}

function ToolbarButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-white/8 hover:text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Lightweight HTML editor for admin forms (contenteditable + execCommand).
 * Used for Explore event body content (summary, section headings, lists).
 */
export function HtmlEditor({
  label,
  value,
  onChange,
  description,
  placeholder = "Write the event story…",
  disabled = false,
  minHeightClass = "min-h-[16rem]",
}: HtmlEditorProps) {
  const editorId = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (normalizeHtml(el.innerHTML) === normalizeHtml(value)) return;
    el.innerHTML = value || "";
    stripForcedTextColors(el);
    lastEmitted.current = normalizeHtml(el.innerHTML);
  }, [value]);

  function emitChange() {
    const el = editorRef.current;
    if (!el) return;
    stripForcedTextColors(el);
    const next = normalizeHtml(el.innerHTML);
    lastEmitted.current = next;
    onChange(next);
  }

  function run(command: string, commandValue?: string) {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function handleInput(_event: FormEvent<HTMLDivElement>) {
    emitChange();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      run("bold");
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      run("italic");
    }
  }

  const empty = !normalizeHtml(value);

  return (
    <Field label={label} htmlFor={editorId} description={description}>
      <div
        className={`${controlClass} overflow-hidden p-0 focus-within:ring-1 focus-within:ring-[var(--gold)]`}
      >
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          className="flex flex-wrap items-center gap-0.5 border-b border-white/8 bg-black/20 px-1.5 py-1.5"
        >
          <ToolbarButton
            label="Bold"
            disabled={disabled}
            onClick={() => run("bold")}
          >
            B
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            disabled={disabled}
            onClick={() => run("italic")}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
          <ToolbarButton
            label="Heading"
            disabled={disabled}
            onClick={() => run("formatBlock", "h2")}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            label="Paragraph"
            disabled={disabled}
            onClick={() => run("formatBlock", "p")}
          >
            ¶
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
          <ToolbarButton
            label="Bulleted list"
            disabled={disabled}
            onClick={() => run("insertUnorderedList")}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            disabled={disabled}
            onClick={() => run("insertOrderedList")}
          >
            1. List
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />
          <ToolbarButton
            label="Clear formatting"
            disabled={disabled}
            onClick={() => run("removeFormat")}
          >
            Clear
          </ToolbarButton>
        </div>

        <div className="relative">
          {empty ? (
            <p
              className="pointer-events-none absolute left-4 top-3 z-10 text-sm text-[var(--text-muted)]"
              aria-hidden
            >
              {placeholder}
            </p>
          ) : null}
          <div
            ref={editorRef}
            id={editorId}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={emitChange}
            onKeyDown={handleKeyDown}
            className={`${minHeightClass} max-h-[28rem] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-white caret-white outline-none [&_*]:text-white [&_div]:text-white [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_li]:my-1 [&_li]:text-white [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p]:text-white [&_span]:text-white [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${
              disabled ? "cursor-not-allowed opacity-60" : ""
            }`}
            style={{ color: "#ffffff" }}
          />
        </div>
      </div>
    </Field>
  );
}
