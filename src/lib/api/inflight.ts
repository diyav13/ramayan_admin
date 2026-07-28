/**
 * Deduplicate concurrent identical requests (e.g. React Strict Mode
 * remounting effects before the first request settles).
 * Pass a `key` when the same helper is reused for different params.
 */
export function createInflightDedupe<T>() {
  const inflight = new Map<string, Promise<T>>();

  return function dedupe(
    factory: () => Promise<T>,
    key = "_"
  ): Promise<T> {
    const existing = inflight.get(key);
    if (existing) return existing;

    const promise = factory().finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  };
}
