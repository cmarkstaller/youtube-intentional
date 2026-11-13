import type { FeedPageType } from './pageType';
import { SELECTORS } from './selectors';

export interface FeedScan {
  pageType: FeedPageType;
  container: HTMLElement;
  videoCards: HTMLElement[];
  shortsCards: HTMLElement[];
  /** Cards that are neither videos nor Shorts, e.g. ads. */
  otherCards: HTMLElement[];
  shortsShelves: HTMLElement[];
  hasContinuation: boolean;
}

const CONTAINER_SELECTOR: Record<FeedPageType, string> = {
  discover: SELECTORS.discoverPage,
  subscriptions: SELECTORS.subscriptionsPage,
  search: SELECTORS.searchPage,
};

const CARD_SELECTOR: Record<FeedPageType, string> = {
  discover: SELECTORS.gridCard,
  subscriptions: SELECTORS.gridCard,
  search: SELECTORS.searchCard,
};

export function findFeedContainer(pageType: FeedPageType): HTMLElement | null {
  return document.querySelector<HTMLElement>(CONTAINER_SELECTOR[pageType]);
}

/** Classifies the cards and Shorts shelves currently rendered in `container`. */
export function scanFeed(pageType: FeedPageType, container: HTMLElement): FeedScan {
  const scan: FeedScan = {
    pageType,
    container,
    videoCards: [],
    shortsCards: [],
    otherCards: [],
    shortsShelves: [...container.querySelectorAll<HTMLElement>(SELECTORS.shortsShelf)],
    hasContinuation: container.querySelector(SELECTORS.continuation) !== null,
  };

  for (const card of container.querySelectorAll<HTMLElement>(CARD_SELECTOR[pageType])) {
    if (card.querySelector(SELECTORS.adCardMarker)) {
      scan.otherCards.push(card);
    } else if (card.querySelector(SELECTORS.shortsCardMarker)) {
      scan.shortsCards.push(card);
    } else {
      scan.videoCards.push(card);
    }
  }

  return scan;
}

/**
 * Scans the feed whenever its content changes, until the returned stop
 * function is called.
 *
 * Feed content renders after navigation finishes and keeps growing as the
 * user scrolls, so a MutationObserver re-scans. Scans run at most once per
 * animation frame, before the browser paints, so callers can hide new cards
 * before they are ever shown. Until the page container exists, the observer
 * watches YouTube's page manager instead.
 */
export function watchFeed(pageType: FeedPageType, onScan: (scan: FeedScan) => void): () => void {
  let container: HTMLElement | null = null;
  let frame: number | undefined;

  const scheduleScan = (): void => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (container?.isConnected) onScan(scanFeed(pageType, container));
    });
  };

  const observer = new MutationObserver(() => {
    if (container) {
      scheduleScan();
    } else {
      attachToContainer();
    }
  });

  const attachToContainer = (): boolean => {
    const found = findFeedContainer(pageType);
    if (!found) return false;

    container = found;
    observer.disconnect();
    observer.observe(container, { childList: true, subtree: true });
    scheduleScan();
    return true;
  };

  if (!attachToContainer()) {
    const root = document.querySelector(SELECTORS.pageManager) ?? document.body;
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'page-subtype'],
    });
  }

  return () => {
    observer.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
