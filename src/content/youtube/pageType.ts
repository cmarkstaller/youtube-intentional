export type PageType = 'home' | 'subscriptions' | 'search' | 'watch' | 'shorts' | 'other';

export type FeedPageType = Extract<PageType, 'home' | 'subscriptions' | 'search'>;

/** Classifies a youtube.com URL. Uses the URL only, never YouTube internals. */
export function getPageType(url: Pick<URL, 'pathname'>): PageType {
  const path = url.pathname;

  if (path === '/') return 'home';
  if (path === '/feed/subscriptions') return 'subscriptions';
  if (path === '/results') return 'search';
  if (path === '/watch') return 'watch';
  if (path.startsWith('/shorts/')) return 'shorts';
  return 'other';
}

export function isFeedPage(pageType: PageType): pageType is FeedPageType {
  return pageType === 'home' || pageType === 'subscriptions' || pageType === 'search';
}
