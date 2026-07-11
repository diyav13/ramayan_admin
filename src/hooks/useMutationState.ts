"use client";

import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/api/errors";

/**
 * Wraps async mutations with shared saving/error handling.
 */
export function useMutationState() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(
      action: () => Promise<T>,
      fallbackMessage: string,
      options?: { rethrow?: boolean }
    ): Promise<T | undefined> => {
      setSaving(true);
      setError(null);

      try {
        return await action();
      } catch (err) {
        setError(getErrorMessage(err, fallbackMessage));
        if (options?.rethrow) throw err;
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { saving, error, setError, clearError, run };
}
