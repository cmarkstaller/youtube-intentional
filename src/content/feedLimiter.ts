import { scanFeed, type FeedScan } from './youtube/feedScanner';
import type { PageType } from './youtube/pageType';
import { SELECTORS } from './youtube/selectors';

export type LimitedPageType = Extract<PageType, 'discover' | 'subscriptions'>;

const BATCH_SIZE = 12;

const CLASS = {
  limited: 'yti-limited',
  revealed: 'yti-revealed',
  loading: 'yti-loading',
  loadMore: 'yti-load-more',
} as const;

const STYLE_ID = 'yti-feed-limiter-styles';

/**
 * Grid items are hidden unless marked revealed, so cards YouTube appends are
 * hidden before the next scan runs. The continuation (YouTube's infinite
 * scroll trigger) is hidden unless loading: a `display: none` element never
 * intersects the viewport, so YouTube does not fetch more.
 *
 * YouTube's theme CSS variables have obfuscated names, so the button uses
 * YouTube's light and dark theme colors directly.
 */
const STYLES = `
.${CLASS.limited} > :not(.${CLASS.revealed}, ${SELECTORS.continuation}) {
  display: none !important;
}
.${CLASS.limited}:not(.${CLASS.loading}) > ${SELECTORS.continuation} {
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
 * Limits the Discover / Subscriptions grid to the first `BATCH_SIZE` videos and
 * adds a "Load 12 More" button. Shelves (Shorts, news, etc.) and Shorts cards
 * are always hidden; ads after the last shown video are hidden too.
 * `keepRevealed` restores the previous count for this
 * page (Back/Forward); otherwise it resets to `BATCH_SIZE`.
 */
export function createFeedLimiter(pageType: LimitedPageType, keepRevealed: boolean): FeedLimiter {
  injectStyles();
  if (!keepRevealed || !revealLimits.has(pageType)) revealLimits.set(pageType, BATCH_SIZE);

  let contents: HTMLElement | null = null;
  let container: HTMLElement | null = null;

  const getLimit = (): number => revealLimits.get(pageType) ?? BATCH_SIZE;

  const loadMore = createLoadMore(() => {
    revealLimits.set(pageType, getLimit() + BATCH_SIZE);
    if (container?.isConnected) update(scanFeed(pageType, container));
  });

  const clearContents = (): void => {
    if (!contents) return;
    contents.classList.remove(CLASS.limited, CLASS.loading);
    for (const item of contents.children) item.classList.remove(CLASS.revealed);
    contents = null;
  };

  function update(scan: FeedScan): void {
    container = scan.container;
    const found = container.querySelector<HTMLElement>(SELECTORS.gridContents);
    const grid = found?.closest<HTMLElement>(SELECTORS.grid);
    if (found !== contents) clearContents();
    if (!found || !grid) {
      loadMore.remove();
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
    contents.classList.add(CLASS.limited);
    contents.classList.toggle(CLASS.loading, loading);

    const showButton = !loading && (scan.videoCards.length > limit || scan.hasContinuation);
    if (!showButton) {
      loadMore.remove();
    } else if (grid.nextElementSibling !== loadMore) {
      grid.after(loadMore);
    }
  }

  return {
    update,
    stop() {
      loadMore.remove();
      clearContents();
    },
  };
}

function createLoadMore(onClick: () => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = CLASS.loadMore;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = `Load ${BATCH_SIZE} More`;
  button.addEventListener('click', onClick);

  wrapper.append(button);
  return wrapper;
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
