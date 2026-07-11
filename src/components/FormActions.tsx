import { Button } from "@/components/ui/Button";

// Submit + Cancel pair shared by every management form.
export function FormActions({
  submitLabel,
  onCancel,
  submitDisabled,
}: {
  submitLabel: string;
  onCancel: () => void;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="submit" size="sm" disabled={submitDisabled}>
        {submitLabel}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
