import { Button } from "@/components/ui/Button";

// Submit + Cancel pair shared by every management form.
export function FormActions({
  submitLabel,
  onCancel,
}: {
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="submit" size="sm">
        {submitLabel}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
