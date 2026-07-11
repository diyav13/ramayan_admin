import { Field } from "./Field";

export function ColorField({
  label,
  name,
  defaultValue = "#e8a020",
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <input
        id={name}
        name={name}
        type="color"
        defaultValue={defaultValue}
        className="h-14 w-full cursor-pointer rounded bg-[var(--surface)] p-1"
      />
    </Field>
  );
}
