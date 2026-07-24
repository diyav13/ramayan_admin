"use client";

import { Field } from "@/components/ui/Field";

type QuizMcqOptionsFieldProps = {
  options: string[];
  answer: string;
  onOptionsChange: (options: string[]) => void;
  onAnswerChange: (answer: string) => void;
};

export function QuizMcqOptionsField({
  options,
  answer,
  onOptionsChange,
  onAnswerChange,
}: QuizMcqOptionsFieldProps) {
  function updateOption(index: number, value: string) {
    const next = [...options];
    const previous = next[index];
    next[index] = value;
    onOptionsChange(next);
    if (answer === previous) {
      onAnswerChange(value);
    }
  }

  function addOption() {
    onOptionsChange([...options, ""]);
  }

  function removeOption(index: number) {
    const removed = options[index];
    const next = options.filter((_, i) => i !== index);
    onOptionsChange(next.length >= 2 ? next : [...next, ""]);
    if (answer === removed) {
      onAnswerChange("");
    }
  }

  return (
    <Field
      label="Options"
      htmlFor="mcq-option-0"
      description="Select the right answer"
    >
      <div className="space-y-2">
        {options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isCorrect = answer === option && option.trim().length > 0;

          return (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border border-white/5 bg-[var(--surface)] px-3 py-2"
            >
              <label
                className="flex shrink-0 cursor-pointer items-center gap-2"
                title="Mark as correct answer"
              >
                <input
                  type="radio"
                  name="mcq-correct"
                  checked={isCorrect}
                  disabled={!option.trim()}
                  onChange={() => onAnswerChange(option)}
                  className="size-4 accent-[var(--gold)]"
                />
                <span className="w-5 text-xs font-semibold text-[var(--text-muted)]">
                  {letter}
                </span>
              </label>

              <input
                id={index === 0 ? "mcq-option-0" : undefined}
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${letter}`}
                className="h-11 w-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0"
                required
              />

              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label={`Remove option ${letter}`}
                className="shrink-0 text-xs text-[var(--text-muted)] transition hover:text-red-300 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addOption}
          className="inline-flex h-10 items-center gap-1.5 rounded border border-dashed border-white/15 px-3 text-sm text-[var(--text-muted)] transition hover:border-white/25 hover:text-white"
        >
          <span className="text-base leading-none text-[var(--gold)]">+</span>
          Add option
        </button>
      </div>
    </Field>
  );
}
