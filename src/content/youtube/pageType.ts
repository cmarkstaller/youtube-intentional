/**
 * `discover` is YouTube's Home page (`/`), shown to the user as Discover. The
 * default feed is the `subscriptions` page, shown as Subscriptions.
 */
export type PageType = 'discover' | 'subscriptions' | 'search' | 'watch' | 'shorts' | 'other';

/** Classifies a youtube.com URL. Uses the URL only, never YouTube internals. */
export function getPageType(url: Pick<URL, 'pathname'>): PageType {
  const path = url.pathname;

  if (path === '/') return 'discover';
  if (path === '/feed/subscriptions') return 'subscriptions';
  if (path === '/results') return 'search';
  if (path === '/watch') return 'watch';
  if (path.startsWith('/shorts/')) return 'shorts';
  return 'other';
}
