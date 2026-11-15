/**
 * Every YouTube DOM selector the extension depends on lives here, so a
 * YouTube markup change only needs fixing in one place.
 *
 * YouTube keeps previously visited pages in the DOM with the `hidden`
 * attribute, so page containers must always exclude hidden ones.
 */
export const SELECTORS = {
  /** YouTube's root element: masthead, sidebars, and pages. */
  app: 'ytd-app',

  pageManager: 'ytd-page-manager',

  /** Present when YouTube's dark theme is active. */
  darkTheme: 'html[dark]',

  /** Visible page containers. Discover is YouTube's Home page. Search is left native. */
  discoverPage: 'ytd-browse[page-subtype="home"]:not([hidden])',
  subscriptionsPage: 'ytd-browse[page-subtype="subscriptions"]:not([hidden])',

  /**
   * Related / suggested videos on a watch page. Lives in the side column on
   * wide layouts and below the player on narrow ones. Playlist and live chat
   * are siblings, not descendants.
   */
  watchRelated: 'ytd-watch-flexy #related',

  /** The Home / Subscriptions video grid. */
  grid: 'ytd-rich-grid-renderer',

  /** The grid's item list: cards, shelves, ads, and the trailing continuation. */
  gridContents: 'ytd-rich-grid-renderer > #contents',

  /** Top-level cards in the Home / Subscriptions grid (not cards nested in shelves). */
  gridCard: 'ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer',

  /** A full-width row in the Home / Subscriptions grid that holds a shelf (Shorts, news, etc.). */
  gridSection: 'ytd-rich-section-renderer',

  /** Element YouTube uses to trigger loading the next batch (infinite scroll). */
  continuation: 'ytd-continuation-item-renderer',

  /** Markers inside a card that identify it as a Short. */
  shortsCardMarker:
    'ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, a[href^="/shorts/"]',

  /** Markers inside a card that identify it as an ad. */
  adCardMarker: 'ytd-ad-slot-renderer',

  /** Any link that opens a Short in YouTube's Shorts player. */
  shortsLink: 'a[href^="/shorts/"]',

  /** Any link to YouTube's Home page, e.g. the logo. */
  homeLink: 'a[href="/"]',

  /** Full left sidebar (drawer). Mini sidebar is a separate custom element. */
  guideRenderer: 'ytd-guide-renderer',
  miniGuideRenderer: 'ytd-mini-guide-renderer',
  /** Drawer that holds the full sidebar; a sibling of the page, not the feed. */
  guideDrawer: 'ytd-app #guide',

  /** An entry in the full left sidebar or the collapsed "mini" sidebar. */
  guideEntry: 'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer',

  /** The entry list of a full sidebar section (the mini sidebar's list is already a flex column). */
  guideSectionItems: 'ytd-guide-section-renderer > #items',

  /** YouTube's Home sidebar entries, shown as Discover. */
  guideHomeEntry:
    ':is(ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer):has(> a#endpoint[href="/"])',

  /** YouTube's Subscriptions sidebar entries (native label and icon). */
  guideSubscriptionsEntry:
    ':is(ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer):has(> a#endpoint[href="/feed/subscriptions"])',

  /**
   * Shorts sidebar entries. The full sidebar's Shorts link has no `href`, so
   * it is matched by its `title`, which YouTube does not translate.
   */
  guideShortsEntry:
    ':is(ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer):has(> a#endpoint:is([href^="/shorts"], [title="Shorts"]))',

  /**
   * The current page's sidebar entry: the full sidebar marks the entry, the
   * mini sidebar marks the entry's link.
   */
  guideEntryActive: '[active]',
  guideEntryLinkActive: 'a#endpoint[aria-current="true"]',

  /** Inside a sidebar entry: the link, its icon, and its visible label and tooltip text. */
  guideEntryLink: 'a#endpoint',
  guideEntryIcon: 'yt-icon.guide-icon',
  guideEntryText: '.title, #tooltip',

  /**
   * Avatar (signed in) or settings gear (signed out) that opens the account menu.
   * `#avatar-btn` is the circle itself; it can sit in a different host on watch.
   */
  topbarMenuButton: 'ytd-topbar-menu-button-renderer, #avatar-btn',

  /** Dropdown host YouTube uses for popups; closed ones set `aria-hidden="true"`. */
  popupDropdown: 'tp-yt-iron-dropdown',

  /**
   * Item list of the root account menu (avatar when signed in, settings gear
   * when signed out). Submenus are a nested renderer without this
   * `menu-style`, and YouTube hides this menu's `#container` while one is open.
   */
  accountMenuRenderer:
    'ytd-multi-page-menu-renderer[menu-style="multi-page-menu-style-type-system"]',

  accountMenuSections:
    'ytd-multi-page-menu-renderer[menu-style="multi-page-menu-style-type-system"] > #container > #sections',

  /** Popup host the account menu is rendered into. Present for the life of the page. */
  popupContainer: 'ytd-popup-container',
} as const;
