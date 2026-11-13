import { getBatchSize, onBatchSizeChange, type BatchPage } from './batchSize';
import { scanFeed, type FeedScan } from './youtube/feedScanner';
import type { PageType } from './youtube/pageType';
import { SELECTORS } from './youtube/selectors';

export type LimitedPageType = Extract<PageType, BatchPage>;

const CLASS = {
  revealed: 'yti-revealed',
  loading: 'yti-loading',
  loadMore: 'yti-load-more',
} as const;

const LIMITED_PAGES = `:is(${SELECTORS.discoverPage}, ${SELECTORS.subscriptionsPage})`;

const STYLE_ID = 'yti-feed-limiter-styles';

/**
 * Hiding is page-scoped so it applies as soon as YouTube paints the grid,
 * without waiting for JS to mark `#contents`. Items stay hidden unless
 * marked revealed. Shelves and Shorts are never shown on these pages.
 * The continuation is hidden unless loading: a `display: none` element
 * never intersects the viewport, so YouTube does not fetch more.
 *
 * YouTube's theme CSS variables have obfuscated names, so the button uses
 * YouTube's light and dark theme colors directly.
 */
const STYLES = `
${LIMITED_PAGES} ${SELECTORS.gridContents} > :not(.${CLASS.revealed}, ${SELECTORS.continuation}) {
  display: none !important;
}
${LIMITED_PAGES} ${SELECTORS.gridContents}:not(.${CLASS.loading}) > ${SELECTORS.continuation} {
  display: none !important;
}
${LIMITED_PAGES} ${SELECTORS.gridContents} > ${SELECTORS.gridSection} {
  display: none !important;
}
${LIMITED_PAGES} ${SELECTORS.gridCard}:has(${SELECTORS.shortsCardMarker}) {
  display: none !important;
}
.${CLASS.loadMore} {
  display: flex;
  justify-content: center;
  margin: 8px 0 32px;
}
.${CLASS.loadMore} > button {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 18px;
  font-family: "Roboto", "Arial", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #0f0f0f;
  background: rgba(0, 0, 0, 0.05);
}
.${CLASS.loadMore} > button:hover {
  background: rgba(0, 0, 0, 0.1);
}
${SELECTORS.darkTheme} .${CLASS.loadMore} > button {
  color: #f1f1f1;
  background: rgba(255, 255, 255, 0.1);
}
${SELECTORS.darkTheme} .${CLASS.loadMore} > button:hover {
  background: rgba(255, 255, 255, 0.2);
}
`;

/** Videos shown per page. Kept across navigations so Back restores it. */
const revealLimits = new Map<LimitedPageType, number>();

export interface FeedLimiter {
  update(scan: FeedScan): void;
  stop(): void;
}

export function isLimitedPage(pageType: PageType): pageType is LimitedPageType {
  return pageType === 'discover' || pageType === 'subscriptions';
}

/**
 * Limits the Discover / Subscriptions grid to the first batch of videos and
 * adds a "Load N More" button. N is that page's saved batch size. Shelves
 * (Shorts, news, etc.) and Shorts cards are always hidden; ads after the last
 * shown video are hidden too. `keepRevealed` restores the previous count for
 * this page (Back/Forward); otherwise it resets to the batch size.
 *
 * Moving the slider sets the shown count to the new size immediately.
 */
export function createFeedLimiter(pageType: LimitedPageType, keepRevealed: boolean): FeedLimiter {
  if (!keepRevealed || !revealLimits.has(pageType)) {
    revealLimits.set(pageType, getBatchSize(pageType));
  }

  let contents: HTMLElement | null = null;
  let container: HTMLElement | null = null;

  const getLimit = (): number => revealLimits.get(pageType) ?? getBatchSize(pageType);

  const loadMore = createLoadMore(() => {
    revealLimits.set(pageType, getLimit() + getBatchSize(pageType));
    if (container?.isConnected) update(scanFeed(pageType, container));
  });
  loadMore.setSize(getBatchSize(pageType));

  const stopListening = onBatchSizeChange((page, size) => {
    if (page !== pageType) return;
    revealLimits.set(pageType, size);
    loadMore.setSize(size);
    if (container?.isConnected) update(scanFeed(pageType, container));
  });

  const clearContents = (): void => {
    if (!contents) return;
    contents.classList.remove(CLASS.loading);
    for (const item of contents.children) item.classList.remove(CLASS.revealed);
    contents = null;
  };

  function update(scan: FeedScan): void {
    container = scan.container;
    const found = container.querySelector<HTMLElement>(SELECTORS.gridContents);
    const grid = found?.closest<HTMLElement>(SELECTORS.grid);
    if (found !== contents) clearContents();
    if (!found || !grid) {
      loadMore.element.remove();
      return;
    }
    contents = found;

    const limit = getLimit();
    const lastShownVideo = scan.videoCards[limit - 1];
    const shortsCards = new Set<Element>(scan.shortsCards);
    let revealing = true;
    for (const item of contents.children) {
      if (item.matches(SELECTORS.continuation)) continue;
      const alwaysHidden = shortsCards.has(item) || item.matches(SELECTORS.gridSection);
      item.classList.toggle(CLASS.revealed, revealing && !alwaysHidden);
      if (item === lastShownVideo) revealing = false;
    }

    const loading = scan.hasContinuation && scan.videoCards.length < limit;
    contents.classList.toggle(CLASS.loading, loading);

    const showButton = !loading && (scan.videoCards.length > limit || scan.hasContinuation);
    if (!showButton) {
      loadMore.element.remove();
    } else if (grid.nextElementSibling !== loadMore.element) {
      grid.after(loadMore.element);
    }
  }

  return {
    update,
    stop() {
      stopListening();
      loadMore.element.remove();
      clearContents();
    },
  };
}

interface LoadMore {
  element: HTMLElement;
  setSize(size: number): void;
}

function createLoadMore(onClick: () => void): LoadMore {
  const wrapper = document.createElement('div');
  wrapper.className = CLASS.loadMore;

  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', onClick);
  wrapper.append(button);

  return {
    element: wrapper,
    setSize(size: number) {
      const label = `Load ${size} More`;
      if (button.textContent !== label) button.textContent = label;
    },
  };
}

/** Injected at startup so Home / Discover hide extra cards before the first scan. */
export function injectFeedLimiterStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
