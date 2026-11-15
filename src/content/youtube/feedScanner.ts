import type { PageType } from './pageType';
import { SELECTORS } from './selectors';
import { whenAvailable } from './whenAvailable';

/** Home and Discover grids that the limiter watches. */
export type LimitedFeedPageType = Extract<PageType, 'discover' | 'subscriptions'>;

const CONTAINER_SELECTOR: Record<LimitedFeedPageType, string> = {
  discover: SELECTORS.discoverPage,
  subscriptions: SELECTORS.subscriptionsPage,
};

function findFeedContainer(pageType: LimitedFeedPageType): HTMLElement | null {
  return document.querySelector<HTMLElement>(CONTAINER_SELECTOR[pageType]);
}

/**
 * Scans the grid whenever its `#contents` change, until the returned stop
 * function is called.
 *
 * The observer watches the grid item list, not the whole browse page, so
 * chips, headers, and other chrome do not retrigger scans. `subtree` is still
 * required: ads and Shorts markers appear inside cards after they mount.
 * Until that list exists, the observer watches the page container or page
 * manager. Scans run at most once per animation frame, before paint.
 */
export function watchFeed(
  pageType: LimitedFeedPageType,
  onScan: (container: HTMLElement) => void,
): () => void {
  let container: HTMLElement | null = null;
  let contents: HTMLElement | null = null;
  let frame: number | undefined;
  let stopWaiting: (() => void) | undefined;

  const scheduleScan = (): void => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (container?.isConnected) onScan(container);
    });
  };

  const observer = new MutationObserver(() => {
    if (container && !container.isConnected) {
      container = null;
      contents = null;
      if (!attachToGrid()) observePageManager();
      return;
    }
    if (contents && !contents.isConnected) {
      attachToGrid();
      return;
    }
    if (container && !contents) {
      attachToGrid();
      return;
    }
    if (container) scheduleScan();
    else attachToGrid();
  });

  const observeUntilGrid = (root: Element): void => {
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'page-subtype'],
    });
  };

  const attachToGrid = (): boolean => {
    const found = findFeedContainer(pageType);
    if (!found) return false;

    stopWaiting?.();
    stopWaiting = undefined;
    container = found;
    const gridContents = found.querySelector<HTMLElement>(SELECTORS.gridContents);
    observer.disconnect();
    if (gridContents) {
      contents = gridContents;
      observer.observe(gridContents, { childList: true, subtree: true });
    } else {
      contents = null;
      observeUntilGrid(found);
    }
    scheduleScan();
    return true;
  };

  const observePageManager = (): void => {
    const pageManager = document.querySelector(SELECTORS.pageManager);
    if (pageManager) {
      observeUntilGrid(pageManager);
      return;
    }
    stopWaiting = whenAvailable(SELECTORS.pageManager, (element) => {
      if (container) return;
      if (!attachToGrid()) observeUntilGrid(element);
    });
  };

  if (!attachToGrid()) observePageManager();

  return () => {
    stopWaiting?.();
    observer.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
