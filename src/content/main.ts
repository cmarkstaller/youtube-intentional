import { showActiveIndicator } from './activeIndicator';
import { logFeedScan, logNavigation } from './debugLog';
import { watchFeed } from './youtube/feedScanner';
import { onNavigate } from './youtube/navigation';
import { getPageType, isFeedPage } from './youtube/pageType';

console.info('[YouTube Intentional] Content script loaded on', location.href);

showActiveIndicator();

let stopWatchingFeed: (() => void) | null = null;

onNavigate(() => {
  stopWatchingFeed?.();
  stopWatchingFeed = null;

  const pageType = getPageType(location);
  logNavigation(pageType);

  if (isFeedPage(pageType)) {
    stopWatchingFeed = watchFeed(pageType, logFeedScan);
  }
});
