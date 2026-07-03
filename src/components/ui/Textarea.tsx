import { TextareaHTMLAttributes } from "react";
import { Field, controlClass } from "./Field";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({
  label,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const textareaId = id ?? label.toLowerCase();

  return (
    <Field label={label} htmlFor={textareaId}>
      <textarea
        id={textareaId}
        rows={3}
        className={`${controlClass} resize-none px-4 py-3 ${className}`}
        {...props}
      />
    </Field>
  );
}
