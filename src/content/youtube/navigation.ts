/**
 * Calls `listener` once now and again after every YouTube page navigation.
 *
 * YouTube is a single-page app: most navigation swaps page content without
 * reloading, so the content script only runs once per tab load.
 * `yt-navigate-finish` is dispatched on `document` after each in-app
 * navigation (including Back/Forward). `popstate` is a fallback for
 * Back/Forward. Repeat calls for the same URL are ignored.
 *
 * Returns a function that removes the listeners.
 */
export function onNavigate(listener: () => void): () => void {
  let lastUrl: string | null = null;

  const handle = (): void => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    listener();
  };

  document.addEventListener('yt-navigate-finish', handle);
  window.addEventListener('popstate', handle);
  handle();

  return () => {
    document.removeEventListener('yt-navigate-finish', handle);
    window.removeEventListener('popstate', handle);
  };
}
