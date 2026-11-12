import { showActiveIndicator } from './activeIndicator';
import { logFeedScan, logNavigation } from './debugLog';
import { createFeedLimiter, isLimitedPage, type FeedLimiter } from './feedLimiter';
import { watchFeed } from './youtube/feedScanner';
import { onNavigate } from './youtube/navigation';
import { getPageType, isFeedPage } from './youtube/pageType';

console.info('[YouTube Intentional] Content script loaded on', location.href);

showActiveIndicator();

let stopWatchingFeed: (() => void) | null = null;
let feedLimiter: FeedLimiter | null = null;

onNavigate(({ isHistoryNavigation }) => {
  stopWatchingFeed?.();
  stopWatchingFeed = null;
  feedLimiter?.stop();
  feedLimiter = null;

  const pageType = getPageType(location);
  logNavigation(pageType);

  const limiter = isLimitedPage(pageType)
    ? createFeedLimiter(pageType, isHistoryNavigation)
    : null;
  feedLimiter = limiter;

  if (isFeedPage(pageType)) {
    stopWatchingFeed = watchFeed(pageType, (scan) => {
      logFeedScan(scan);
      limiter?.update(scan);
    });
  }
});
