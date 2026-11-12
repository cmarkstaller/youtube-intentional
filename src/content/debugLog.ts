import type { FeedScan } from './youtube/feedScanner';
import type { PageType } from './youtube/pageType';

const PREFIX = '[YouTube Intentional]';

let lastSummary = '';

export function logNavigation(pageType: PageType): void {
  lastSummary = '';
  console.info(`${PREFIX} Page: ${pageType} (${location.pathname}${location.search})`);
}

/**
 * Logs a feed scan when its counts change. Logged elements can be hovered in
 * DevTools to highlight them on the page.
 */
export function logFeedScan(scan: FeedScan): void {
  const summary =
    `${scan.pageType}: ${scan.videoCards.length} videos, ` +
    `${scan.shortsCards.length} Shorts cards, ` +
    `${scan.otherCards.length} other cards, ` +
    `${scan.shortsShelves.length} Shorts shelves, ` +
    `continuation ${scan.hasContinuation ? 'present' : 'absent'}`;

  if (summary === lastSummary) return;
  lastSummary = summary;

  console.groupCollapsed(`${PREFIX} ${summary}`);
  console.log('container', scan.container);
  console.log('videoCards', scan.videoCards);
  console.log('shortsCards', scan.shortsCards);
  console.log('otherCards', scan.otherCards);
  console.log('shortsShelves', scan.shortsShelves);
  console.groupEnd();
}
