// Shared helpers used across the admin panel.

/** "1 user" / "3 users" — count with a correctly pluralized noun. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Typed readers for native FormData used by management forms.
export const readText = (form: FormData, key: string): string =>
  String(form.get(key) ?? "");

export const readNumber = (form: FormData, key: string): number =>
  Number(form.get(key)) || 0;

export const readCheckbox = (form: FormData, key: string): boolean =>
  form.get(key) === "on";

/** Format ISO date string for table display. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

/** Omit empty strings from optional API fields. */
export function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Empty string → null so PATCH can clear nullable API fields. */
export function nullableField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

/** True when HTML is empty / editor placeholder-only. */
export function isBlankHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<div><br></div>") {
    return true;
  }
  const text = trimmed
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/** Keep nested dropdown scroll from bubbling to the page at edges. */
export function stopNestedScroll(event: {
  currentTarget: HTMLElement;
  deltaY: number;
  preventDefault: () => void;
  stopPropagation: () => void;
}): void {
  const el = event.currentTarget;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const delta = event.deltaY;
  const atTop = scrollTop <= 0 && delta < 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && delta > 0;
  if (atTop || atBottom) {
    event.preventDefault();
  }
  event.stopPropagation();
}
