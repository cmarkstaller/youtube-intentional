import { SUBSCRIPTIONS_PATH } from './homeRedirect';
import { getPageType } from './youtube/pageType';
import { SELECTORS } from './youtube/selectors';

/**
 * Shorts open in YouTube's normal video player (`/watch?v=<id>`) rather than
 * the Shorts player, which swipes into an endless feed. `/shorts/` without
 * an ID is that feed, so it goes to Home.
 *
 * Clicks on Shorts links are intercepted in the capture phase on `window`,
 * before YouTube's own click handling, and load the watch page. YouTube has
 * no documented way to start an in-app navigation to a page that has no link
 * on screen, so this is a full page load. Modified clicks (Ctrl/Shift/middle)
 * are not intercepted; the new tab is redirected when it loads.
 */
export function interceptShortsLinks(): void {
  window.addEventListener('click', onClick, true);
}

/**
 * Redirects the current page if it is a Shorts page, e.g. a shared link or an
 * in-app navigation that did not come from a link click. `location.replace`
 * keeps the Shorts URL out of history, so Back skips it.
 *
 * Returns true if the page is being redirected.
 */
export function redirectShortsPage(): boolean {
  if (getPageType(location) !== 'shorts') return false;
  location.replace(watchUrlFor(location));
  return true;
}

function onClick(event: MouseEvent): void {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest<HTMLAnchorElement>(SELECTORS.shortsLink);
  if (!link) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  location.assign(watchUrlFor(new URL(link.href)));
}

/** `/shorts/<id>` becomes `/watch?v=<id>`; `/shorts/` becomes Home. */
function watchUrlFor(url: Pick<URL, 'pathname'>): string {
  const id = url.pathname.split('/')[2];
  return id ? `/watch?v=${encodeURIComponent(id)}` : SUBSCRIPTIONS_PATH;
}
