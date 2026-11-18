"use client";

import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

/** Returns a value after it stops changing for `delay` ms (lodash debounce). */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  const updateDebounced = useMemo(
    () =>
      debounce((next: T) => {
        setDebounced(next);
      }, delay),
    [delay]
  );

  useEffect(() => {
    return () => {
      updateDebounced.cancel();
    };
  }, [updateDebounced]);

  useEffect(() => {
    updateDebounced(value);
  }, [value, updateDebounced]);

  return debounced;
}
