/**
 * How many videos Subscriptions and Discover show before "Load More".
 *
 * Each page has its own value, saved in `chrome.storage.local` so it survives
 * reloads and is shared across tabs. Writes go through here; `onChanged`
 * picks up updates from other tabs without applying our own write twice.
 */

export type BatchPage = 'discover' | 'subscriptions';

export const BATCH_MIN = 3;
export const BATCH_MAX = 30;
export const BATCH_STEP = 3;
export const BATCH_DEFAULT = 9;

const PAGES: readonly BatchPage[] = ['subscriptions', 'discover'];

const STORAGE_KEY: Record<BatchPage, string> = {
  subscriptions: 'batchSizeSubscriptions',
  discover: 'batchSizeDiscover',
};

type BatchSizes = Record<BatchPage, number>;

let current: BatchSizes = {
  subscriptions: BATCH_DEFAULT,
  discover: BATCH_DEFAULT,
};

const listeners = new Set<(page: BatchPage, size: number) => void>();

/** Nearest step inside the allowed range. Anything unusable becomes the default. */
export function normalizeBatchSize(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return BATCH_DEFAULT;
  const stepped = Math.round(numeric / BATCH_STEP) * BATCH_STEP;
  return Math.min(BATCH_MAX, Math.max(BATCH_MIN, stepped));
}

export function getBatchSize(page: BatchPage): number {
  return current[page];
}

export function setBatchSize(page: BatchPage, size: number): void {
  const next = normalizeBatchSize(size);
  if (current[page] === next) return;
  current = { ...current, [page]: next };
  for (const listener of listeners) listener(page, next);
  void chrome.storage.local.set({ [STORAGE_KEY[page]]: next });
}

/** Fired after a change from this tab or another. */
export function onBatchSizeChange(listener: (page: BatchPage, size: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Reads saved sizes. Startup does not wait on this: CSS and intercepts run
 * with defaults, then listeners hear any stored values that differ.
 */
export async function loadBatchSizes(): Promise<void> {
  try {
    // A slider move during this await already wrote `current`. Applying the
    // stale read would put that page back to the value from before the move.
    const snapshot = { ...current };
    const stored = await chrome.storage.local.get(PAGES.map((page) => STORAGE_KEY[page]));
    const next = { ...current };
    const changed: Array<{ page: BatchPage; size: number }> = [];
    for (const page of PAGES) {
      if (current[page] !== snapshot[page]) continue;
      const size = normalizeBatchSize(stored[STORAGE_KEY[page]]);
      if (next[page] === size) continue;
      next[page] = size;
      changed.push({ page, size });
    }
    current = next;
    for (const { page, size } of changed) {
      for (const listener of listeners) listener(page, size);
    }
  } catch {
    // Keep the defaults if storage is unavailable.
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const page of PAGES) {
    const change = changes[STORAGE_KEY[page]];
    if (!change) continue;
    const size = normalizeBatchSize(change.newValue);
    if (current[page] === size) continue;
    current = { ...current, [page]: size };
    for (const listener of listeners) listener(page, size);
  }
});
