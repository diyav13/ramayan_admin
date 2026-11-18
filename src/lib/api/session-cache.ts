/**
 * In-memory session cache that survives client-side navigations / remounts
 * within the same page load. A full browser refresh clears memory, so list
 * hooks fetch fresh data again — as intended.
 *
 * Entries are keyed on globalThis so Fast Refresh does not wipe them mid-edit,
 * but a hard reload always starts empty.
 */

export type SessionCacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

export type SessionCache<T> = {
  get: (key?: string) => SessionCacheEntry<T> | undefined;
  set: (data: T, key?: string) => void;
  clear: () => void;
};

export type ListCachePayload<T> = {
  items: T[];
  pagination: import("@/types/api").PaginationMeta | null;
};

const GLOBAL_KEY = "__ramayan_admin_session_caches__";

type StoreMap = Map<string, Map<string, SessionCacheEntry<unknown>>>;

function getRegistry(): StoreMap {
  const globalRef = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: StoreMap;
  };
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = new Map();
  }
  return globalRef[GLOBAL_KEY];
}

function getOrCreateStore(
  namespace: string
): Map<string, SessionCacheEntry<unknown>> {
  const registry = getRegistry();
  let store = registry.get(namespace);
  if (!store) {
    store = new Map();
    registry.set(namespace, store);
  }
  return store;
}

export function createSessionCache<T>(namespace: string): SessionCache<T> {
  const store = getOrCreateStore(namespace);

  return {
    get(key = "_") {
      return store.get(key) as SessionCacheEntry<T> | undefined;
    },
    set(data, key = "_") {
      store.set(key, { data, fetchedAt: Date.now() });
    },
    clear() {
      store.clear();
    },
  };
}

/** Drop every admin list cache (call on logout). */
export function clearAllSessionCaches(): void {
  const registry = getRegistry();
  for (const store of registry.values()) {
    store.clear();
  }
  registry.clear();

  // Remove any leftover keys from an earlier sessionStorage-backed version.
  if (typeof window !== "undefined") {
    try {
      const prefix = "ramayan.admin.cache.";
      const toRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(prefix)) toRemove.push(key);
      }
      for (const key of toRemove) window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
