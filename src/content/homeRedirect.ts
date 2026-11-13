import { SELECTORS } from './youtube/selectors';

export const SUBSCRIPTIONS_PATH = '/feed/subscriptions';

/**
 * The user's Home is Subscriptions. YouTube's Home page (`/`) is Discover,
 * reached deliberately from the sidebar.
 *
 * A fresh visit to `/` (typed URL, bookmark, link from another site) is sent
 * to Subscriptions. A reload or Back/Forward stays on Discover, which also
 * rules out redirect loops. The Navigation Timing API reports how this
 * document was loaded; it describes the full page load only, not YouTube's
 * in-app navigations.
 *
 * Returns true if the page is being redirected.
 */
export function redirectFreshDiscoverVisit(): boolean {
  if (location.pathname !== '/') return false;

  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (entry?.type === 'reload' || entry?.type === 'back_forward') return false;

  location.replace(SUBSCRIPTIONS_PATH);
  return true;
}

/**
 * Sends clicks on links to `/` (e.g. the YouTube logo) to Subscriptions,
 * except the sidebar's Discover entry. Listens on `window` in the capture
 * phase so it runs before YouTube's own click handling.
 */
export function interceptHomeLinks(): void {
  window.addEventListener('click', onClick, true);
}

function onClick(event: MouseEvent): void {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest(SELECTORS.homeLink);
  if (!link || link.closest(SELECTORS.guideEntry)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  goToSubscriptions();
}

/**
 * Clicks YouTube's own Subscriptions sidebar link, so YouTube performs a
 * normal in-app navigation. The sidebar may not be rendered yet (e.g. on a
 * watch page), in which case the page is loaded normally.
 */
function goToSubscriptions(): void {
  const link = document.querySelector<HTMLElement>(
    `${SELECTORS.guideSubscriptionsEntry} > ${SELECTORS.guideEntryLink}`,
  );
  if (link) {
    link.click();
  } else {
    location.assign(SUBSCRIPTIONS_PATH);
  }
}
