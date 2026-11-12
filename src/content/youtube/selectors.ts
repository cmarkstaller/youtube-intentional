/**
 * Every YouTube DOM selector the extension depends on lives here, so a
 * YouTube markup change only needs fixing in one place.
 *
 * YouTube keeps previously visited pages in the DOM with the `hidden`
 * attribute, so page containers must always exclude hidden ones.
 */
export const SELECTORS = {
  pageManager: 'ytd-page-manager',

  /** Present when YouTube's dark theme is active. */
  darkTheme: 'html[dark]',

  /** Visible page containers, one per page type we care about. */
  homePage: 'ytd-browse[page-subtype="home"]:not([hidden])',
  subscriptionsPage: 'ytd-browse[page-subtype="subscriptions"]:not([hidden])',
  searchPage: 'ytd-search:not([hidden])',

  /** The Home / Subscriptions video grid. */
  grid: 'ytd-rich-grid-renderer',

  /** The grid's item list: cards, shelves, ads, and the trailing continuation. */
  gridContents: 'ytd-rich-grid-renderer > #contents',

  /** Top-level cards in the Home / Subscriptions grid (not cards nested in shelves). */
  gridCard: 'ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer',

  /** Top-level cards in search results. */
  searchCard:
    'ytd-item-section-renderer > #contents > :is(ytd-video-renderer, yt-lockup-view-model)',

  /** Element YouTube uses to trigger loading the next batch (infinite scroll). */
  continuation: 'ytd-continuation-item-renderer',

  /** Markers inside a card that identify it as a Short. */
  shortsCardMarker:
    'ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, a[href^="/shorts/"]',

  /** Markers inside a card that identify it as an ad. */
  adCardMarker: 'ytd-ad-slot-renderer',

  /**
   * Shorts shelves. `grid-shelf-view-model` is a generic shelf, so it only
   * counts when it contains Shorts cards. The shelf title is localized and
   * is deliberately not used.
   */
  shortsShelf: [
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'grid-shelf-view-model:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2)',
  ].join(', '),
} as const;
