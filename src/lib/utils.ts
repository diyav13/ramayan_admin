// Small shared helpers used across the admin panel.

/** Generate a short prefixed id, e.g. generateId("u") -> "u_4821". */
export function generateId(prefix: string): string {
  return `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Today's date as YYYY-MM-DD (used for createdAt / updatedAt). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "1 user" / "3 users" — count with a correctly pluralized noun. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Typed readers for the native FormData used by the management forms.
export const readText = (form: FormData, key: string): string =>
  String(form.get(key) ?? "");

export const readNumber = (form: FormData, key: string): number =>
  Number(form.get(key)) || 0;

export const readCheckbox = (form: FormData, key: string): boolean =>
  form.get(key) === "on";
