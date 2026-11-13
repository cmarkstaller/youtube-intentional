import { SELECTORS } from './youtube/selectors';

const STYLE_ID = 'yti-watch-related-styles';

/**
 * Wide layouts only: center the main column at the same width YouTube uses
 * beside the sidebar, and drop the empty side column. Playlist and live chat
 * keep the normal two-column layout.
 */
const WATCH_CENTERED_WIDE = [
  'ytd-watch-flexy:not([theater])',
  ':not([fullscreen])',
  ':not([is-single-column])',
  ':not(:has(#playlist:not([hidden])))',
  ':not(:has(ytd-live-chat-frame:not([hidden])))',
].join('');

const STYLES = `
${SELECTORS.watchRelated} {
  display: none !important;
}

${WATCH_CENTERED_WIDE} #secondary {
  display: none !important;
}

${WATCH_CENTERED_WIDE} #columns {
  display: grid !important;
  grid-template-columns: 1fr minmax(0, calc(100% - var(--ytd-watch-flexy-sidebar-width) - 2 * var(--ytd-watch-flexy-horizontal-page-margin))) 1fr !important;
  width: 100% !important;
  max-width: none !important;
}

${WATCH_CENTERED_WIDE} #primary {
  grid-column: 2 !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: var(--ytd-watch-flexy-horizontal-page-margin) !important;
  margin-right: 0 !important;
}
`;

/**
 * Hides suggested videos on the watch page and centers the main column on
 * wide layouts when the side panel is unused. Injected once for the life of
 * the tab.
 */
export function hideWatchRelated(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
