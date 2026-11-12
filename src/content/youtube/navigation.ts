/** The part of the Navigation API used here; TypeScript's DOM types lack it. */
interface NavigateEvent extends Event {
  navigationType: 'push' | 'replace' | 'reload' | 'traverse';
}

interface NavigationApi {
  addEventListener(type: 'navigate', listener: (event: NavigateEvent) => void): void;
  removeEventListener(type: 'navigate', listener: (event: NavigateEvent) => void): void;
}

const navigationApi = (window as Window & { navigation?: NavigationApi }).navigation;

export interface NavigationInfo {
  /** True for Back/Forward, false for link clicks and the initial page load. */
  isHistoryNavigation: boolean;
}

/**
 * Calls `listener` once now and again after every YouTube page navigation.
 *
 * YouTube is a single-page app: most navigation swaps page content without
 * reloading, so the content script only runs once per tab load.
 * `yt-navigate-finish` is dispatched on `document` after each in-app
 * navigation (including Back/Forward). `popstate` is a fallback for
 * Back/Forward. Repeat calls for the same URL are ignored.
 *
 * Back/Forward is detected with the Navigation API's `navigate` event, which
 * fires when a navigation starts. `popstate` cannot be used for this because
 * YouTube can finish a Back navigation before `popstate` fires.
 *
 * Returns a function that removes the listeners.
 */
export function onNavigate(listener: (info: NavigationInfo) => void): () => void {
  let lastUrl: string | null = null;
  let lastNavigationType: NavigateEvent['navigationType'] | null = null;

  const handle = (): void => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    listener({ isHistoryNavigation: lastNavigationType === 'traverse' });
  };

  const onNavigateStart = (event: NavigateEvent): void => {
    lastNavigationType = event.navigationType;
  };

  navigationApi?.addEventListener('navigate', onNavigateStart);
  document.addEventListener('yt-navigate-finish', handle);
  window.addEventListener('popstate', handle);
  handle();

  return () => {
    navigationApi?.removeEventListener('navigate', onNavigateStart);
    document.removeEventListener('yt-navigate-finish', handle);
    window.removeEventListener('popstate', handle);
  };
}
