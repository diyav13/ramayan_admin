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
