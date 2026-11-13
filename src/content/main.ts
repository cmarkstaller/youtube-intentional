import { createFeedLimiter, isLimitedPage, type FeedLimiter } from './feedLimiter';
import { interceptHomeLinks, redirectFreshDiscoverVisit } from './homeRedirect';
import { interceptShortsLinks, redirectShortsPage } from './shortsRedirect';
import { startSidebar } from './sidebar';
import { hideWatchRelated } from './watchRelated';
import { watchFeed } from './youtube/feedScanner';
import { onNavigate } from './youtube/navigation';
import { getPageType, isFeedPage } from './youtube/pageType';

if (!redirectShortsPage() && !redirectFreshDiscoverVisit()) start();

function start(): void {
  startSidebar();
  hideWatchRelated();
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

    const limiter = isLimitedPage(pageType)
      ? createFeedLimiter(pageType, isHistoryNavigation)
      : null;
    feedLimiter = limiter;

    if (isFeedPage(pageType)) {
      stopWatchingFeed = watchFeed(pageType, (scan) => {
        limiter?.update(scan);
      });
    }
  });
}
