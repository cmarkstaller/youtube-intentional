import { SELECTORS } from './youtube/selectors';

const STYLE_ID = 'yti-watch-related-styles';

/**
 * Hides the watch-page related-videos column (and the below-player related
 * block on narrow layouts). Playlist and live chat sit outside `#related`,
 * so they stay available.
 */
const STYLES = `
${SELECTORS.watchRelated} {
  display: none !important;
}
`;

/** Injects the hide-related styles once for the life of the tab. */
export function hideWatchRelated(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
