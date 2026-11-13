import { startAccountMenu } from './accountMenu';
import { loadBatchSizes } from './batchSize';
import { createFeedLimiter, injectFeedLimiterStyles, isLimitedPage, type FeedLimiter } from './feedLimiter';
import { interceptHomeLinks, redirectFreshDiscoverVisit } from './homeRedirect';
import { interceptShortsLinks, redirectShortsPage } from './shortsRedirect';
import { startSidebar } from './sidebar';
import { hideWatchRelated } from './watchRelated';
import { watchFeed } from './youtube/feedScanner';
import { onNavigate } from './youtube/navigation';
import { getPageType } from './youtube/pageType';

if (!redirectShortsPage() && !redirectFreshDiscoverVisit()) {
  start();
}

function start(): void {
  injectFeedLimiterStyles();
  hideWatchRelated();
  startSidebar();
  startAccountMenu();
  interceptHomeLinks();
  interceptShortsLinks();

  let stopWatchingFeed: (() => void) | null = null;
  let feedLimiter: FeedLimiter | null = null;

  onNavigate(({ isHistoryNavigation }) => {
    stopWatchingFeed?.();
    stopWatchingFeed = null;
    feedLimiter?.stop();
    feedLimiter = null;

    if (redirectShortsPage()) return;

    const pageType = getPageType(location);
    if (!isLimitedPage(pageType)) return;

    const limiter = createFeedLimiter(pageType, isHistoryNavigation);
    feedLimiter = limiter;
    stopWatchingFeed = watchFeed(pageType, (container) => {
      limiter.update(container);
    });
  });

  // After listeners are registered so a stored size that differs from the
  // default updates the open feed and the account-menu sliders.
  void loadBatchSizes();
}
