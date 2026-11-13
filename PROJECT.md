# YouTube Intentional — Project Specification

## Vision

Make YouTube a more intentional experience by replacing algorithm-driven infinite scrolling with controlled, finite browsing.

Preserve YouTube's familiar interface and existing functionality wherever possible.

## Core Requirements

### Home / Subscriptions

- Default Home experience shows videos from subscribed channels.
- Display 9 video cards at a time by default.
- The count is its own setting: 3 to 30, in steps of 3.
- Provide a "Load N More" button, where N is that setting.
- No automatic infinite scrolling.
- Preserve YouTube's native video cards and styling.

### Discover

- Separate destination for YouTube's normal recommendations.
- Display 9 video cards at a time by default.
- The count is its own setting: 3 to 30, in steps of 3, separate from Home.
- Provide a "Load N More" button, where N is that setting.
- No automatic infinite scrolling.
- Discover should be a deliberate choice rather than the default.

### Batch size

- Home and Discover each remember how many videos to show before "Load More".
- Default 9. Minimum 3, maximum 30, steps of 3.
- Saved with `chrome.storage.local` and shared across tabs.
- Moving the slider updates the open page immediately: it shows that many videos, and the next "Load More" adds that many.
- Back/Forward still restores the count that was showing. Any other navigation resets the page to its batch size.
- The sliders sit at the top of the account menu (the avatar menu). Signed out, that same menu opens from the settings gear.
- Sliders use neutral grays so they match the account menu. Each shows min and max (3 and 30) in muted text under the track, plus tick marks at every step of 3 (no number on each tick).

### Navigation

- Use YouTube's native left sidebar (full and collapsed); no new buttons elsewhere.
- Sidebar order: Home, Discover, You. Home is the Subscriptions feed; there is no separate Subscriptions entry.
- The YouTube logo and fresh visits to youtube.com open Home.
- Remove the Shorts entry from the sidebar.

### Shorts

- Hide Shorts from Home, Subscriptions, and Discover.
- Allow Shorts in search results.
- Shorts open in YouTube's normal video player (`/watch?v=<id>`), never the Shorts player, which swipes into an endless feed. This applies to every Shorts link and URL (search, channel pages, shared links). `/shorts/` without an ID goes to Home.
- Shorts elsewhere (e.g. watch page recommendations, a channel's Shorts tab) are not hidden.

### Shelves

- Home and Discover show only video cards (and ads where YouTube places them). Every shelf is hidden, not just Shorts shelves (e.g. Breaking News, Playables).

### Watch page

- Hide suggested / related videos beside the player (and below it on narrow layouts).
- On wide layouts, keep the player column the same size and center it when the side column would otherwise be empty.
- Preserve the playlist panel and live chat when present (two-column layout stays in those cases).

### Preserve Native YouTube

- Search results retain normal infinite scrolling.
- Preserve History, Watch Later, playlists, notifications, channel pages, account controls, and video playback.
- Maintain a native YouTube appearance.

## Technical Approach

- Chrome Manifest V3
- TypeScript and Vite
- Content scripts modifying existing YouTube pages
- Minimal dependencies
- No backend or OAuth for MVP
- No undocumented YouTube API usage

### Technical Decisions

- **Build:** Plain Vite in library mode, no Chrome extension plugin. The content script is bundled into a single IIFE (`dist/content.js`) because manifest-declared content scripts are classic scripts and cannot use ES module `import`.
- **Manifest:** `public/manifest.json` is copied to `dist/` unchanged. `dist/` is the folder loaded as the unpacked extension.
- **Tooling:** Vite 6 (Vite 7 requires Node 20.19+; the dev machine runs Node 20.11). Dev dependencies are only `typescript`, `vite`, and `@types/chrome`.
- **Permissions:** `storage`, for the Home and Discover batch-size settings. Content scripts declared in the manifest need no host permission.
- **Source layout:** Content-script code lives in `src/content/`. `src/content/youtube/` is the shared YouTube integration layer (selectors, page type, navigation, feed scanning). Page-specific features will go in their own modules and build on it. All YouTube DOM selectors live in `src/content/youtube/selectors.ts`.
- **Navigation detection:** Listen for YouTube's `yt-navigate-finish` DOM event on `document`, with `popstate` as a fallback, deduplicated by URL, plus one run at startup. Page type is derived from the URL path, not from the event's `detail` (internal to YouTube, and not reliably readable from a content script's isolated world). Back/Forward is detected with the standard Navigation API (`navigation`'s `navigate` event, `navigationType === 'traverse'`), because YouTube fires `yt-navigate-finish` before `popstate` on Back.
- **Feed scanning:** On Home, Subscriptions, and search only, a `MutationObserver` watches the visible page container and re-scans as cards render and as infinite scroll adds more. Scans run at most once per animation frame (before paint), so new cards can be hidden before they are shown. The observer is disconnected on every navigation. No observer runs on other pages.
- **Feed limit (Home and Subscriptions):** Only real video cards count toward the limit; ads, shelves, and Shorts after the last shown video are hidden too. The grid's `#contents` gets a class, and CSS hides every item not marked revealed, so cards YouTube appends stay hidden until the next scan. Infinite scroll is stopped by hiding the continuation with `display: none`: a hidden element never intersects the viewport, so YouTube never fetches. The continuation is shown only while fewer videos are loaded than the current limit, so YouTube fetches just enough. Styles are injected from TypeScript so they can use `SELECTORS`.
- **Shelves and Shorts on Home and Discover:** The feed limiter never marks shelf rows (`ytd-rich-section-renderer`) or Shorts cards as revealed, so the existing CSS keeps them hidden; they never count toward the limit.
- **Shorts to watch player:** Clicks on `a[href^="/shorts/"]` are intercepted in the capture phase on `window` and load `/watch?v=<id>` with `location.assign` (a full page load: there is no documented way to start an in-app navigation without a link on screen). Any page that is still a `/shorts/` URL, at startup or after an in-app navigation, is redirected with `location.replace`, so the Shorts URL stays out of history. Modified clicks are not intercepted; the new tab redirects on load.
- **Load More state:** The number of videos shown is kept per page in memory. Back/Forward restores it; any other navigation to the page resets it to that page's batch size (default 9). The button label is "Load N More". The button is removed when all loaded videos are shown and YouTube has no continuation. Moving that page's slider sets the shown count to the new size immediately.
- **Batch size setting:** `src/content/accountMenu.ts` prepends a panel with two range inputs (Home, Discover) to the account menu's `#sections`. The menu is `ytd-multi-page-menu-renderer[menu-style="multi-page-menu-style-type-system"]` — the avatar menu when signed in, and the menu the settings gear opens when signed out. Submenus are a nested renderer without that `menu-style`, and YouTube sets `hidden` on the root `#container` while one is open, so the sliders stay on the root page. YouTube builds the menu lazily and can rebuild it, so a MutationObserver on `ytd-popup-container` re-inserts the panel. Values live in `chrome.storage.local` (`batchSizeSubscriptions`, `batchSizeDiscover`). This tab updates itself in `setBatchSize`; `storage.onChanged` applies writes from other tabs and ignores the echo of our own write. Slider chrome is grayscale (track and thumb follow `html[dark]`); ticks are one mark per step from 3–30 with only the endpoints labeled.
- **Home and Discover URLs:** Home is `/feed/subscriptions`; Discover is YouTube's Home page at `/`. YouTube strips query parameters from `/`, so Discover cannot have its own URL. Internally the page types are `subscriptions` and `discover`.
- **Sidebar:** YouTube's own entries are reused rather than adding new ones: the Subscriptions entry is relabeled Home, the Home entry is relabeled Discover. This keeps YouTube's navigation and current-page highlight. Hiding Shorts, putting Home above Discover (CSS `order`), and the icons (CSS masks, filled on the current page) are injected CSS. Labels, tooltips, and `aria-label`s are rewritten in TypeScript, re-applied by a MutationObserver on `ytd-app` because YouTube renders the sidebar lazily and can re-render it. That observer runs for the life of the tab.
- **Redirect to Home:** Clicks on links to `/` other than the sidebar's Discover entry (e.g. the logo) are intercepted in the capture phase on `window` and turned into a click on YouTube's own Subscriptions sidebar link (an in-app navigation); if the sidebar is not rendered yet, the page is loaded normally. A full page load of `/` redirects with `location.replace` unless the Navigation Timing API reports a reload or Back/Forward, so reloading Discover keeps it and there are no redirect loops. Modified clicks (Ctrl/Shift/middle) are not intercepted; a new tab opened on `/` redirects to Home.
- **Watch related videos:** Injected CSS hides `ytd-watch-flexy #related` for the life of the tab. That node holds the suggested list (and its loading skeleton) in both the side column and the below-player layout. Playlist (`ytd-playlist-panel-renderer`) and live chat are siblings under `#secondary-inner`, so they stay visible. On wide layouts without a playlist or live chat, `#columns` becomes a three-track grid so `#primary` stays the same width it had beside the sidebar (via YouTube's `--ytd-watch-flexy-sidebar-width` and horizontal margin variables) but sits centered; theater, fullscreen, and single-column layouts are unchanged.

### YouTube DOM findings (verified November 2026)

- Pages live inside `ytd-page-manager`. Visited pages stay in the DOM with the `hidden` attribute, so selectors must target the visible container only.
- Home and Subscriptions: `ytd-browse[page-subtype="home"|"subscriptions"]`, with cards at `ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer`. Cards contain the newer `yt-lockup-view-model` (videos) or `ytm-shorts-lockup-view-model(-v2)` (Shorts).
- Search: `ytd-search`, with cards at `ytd-item-section-renderer > #contents > ytd-video-renderer | yt-lockup-view-model`.
- Shorts shelves: `grid-shelf-view-model` is a generic shelf and is a Shorts shelf only if it contains Shorts lockups. Older variants are `ytd-rich-shelf-renderer[is-shorts]` and `ytd-reel-shelf-renderer`. Shelf titles are localized and not used.
- Infinite scroll is driven by a trailing `ytd-continuation-item-renderer` (the last child of the grid's `#contents`). It fetches only when the element scrolls into view; with `display: none` it never fetches, and un-hiding it while in view fetches the next batch (~30 cards on a channel grid).
- Grid cards lazy-load thumbnails when scrolled into view, including cards that were `display: none` and later revealed.
- YouTube's theme CSS variables now have obfuscated names (e.g. `--t7f4f2c6d54836ce0`), so `--yt-spec-*` variables cannot be relied on. Dark theme is indicated by the `dark` attribute on `<html>`.
- On Back, YouTube fires `yt-navigate-finish` before `popstate`.
- Some navigations (e.g. clicking the logo from a watch page) do a full page reload instead of an in-app navigation.
- Logged-out Home with no watch history has shown an empty "Try searching to get started" state with no cards; as of Milestone 5 it shows recommendations, including Shorts shelves.
- Shelves in the Home / Subscriptions grid are full-width `ytd-rich-section-renderer` rows that are direct children of the grid's `#contents`, alongside the `ytd-rich-item-renderer` cards. Shorts shelves there are `ytd-rich-shelf-renderer[is-shorts]`.
- Shorts in search results (and in Shorts shelves) are plain links with `href="/shorts/<id>"`. `/watch?v=<id>` plays a Short in the normal player, and YouTube does not redirect it back to `/shorts/`.
- Sidebar: the full sidebar is `ytd-guide-section-renderer > #items > ytd-guide-entry-renderer` (the current page's entry has the `active` attribute); the collapsed sidebar is `ytd-mini-guide-entry-renderer` in a flex column (the current page's link has `aria-current="true"`). Each entry's direct child is `a#endpoint` with `href` and `title`; the label is `.title`, the icon `yt-icon.guide-icon`; mini entries also have an `aria-label` and a tooltip (`#tooltip`). The full sidebar's Shorts link has no `href` (only `title="Shorts"`); the mini one has `href="/shorts/"`. The mini sidebar renders only at medium widths, and on watch pages the sidebar may not be rendered until opened.
- Clicking a sidebar link programmatically (`.click()`), even a hidden one, performs YouTube's normal in-app navigation.
- Watch page: `#secondary-inner` holds playlist, chat, and `#related` as siblings. `#related` contains `ytd-watch-next-secondary-results-renderer` (suggested videos). On narrow layouts `#secondary` is `display: none` and `#related` appears below the player inside `ytd-watch-flexy`. The playlist panel is `#playlist` (`ytd-playlist-panel-renderer`); when the watch URL has no list, YouTube sets the `hidden` attribute on `#playlist`, which is reliable for CSS `:has()` guards. Live chat uses `ytd-live-chat-frame` with the same `hidden` pattern. `ytd-watch-flexy` exposes `--ytd-watch-flexy-sidebar-width` and `--ytd-watch-flexy-horizontal-page-margin` for layout math on wide screens.

## Known Challenges

- YouTube is a single-page application.
- Video feeds are dynamically loaded.
- Hidden content may interfere with lazy loading.
- Avoid navigation loops between Home and Discover.
- YouTube DOM selectors may change.

## Development Milestones

| # | Milestone | Status |
|---|---|---|
| 1 | Create and load the extension. | Complete |
| 2 | Detect YouTube pages and relevant elements. | Complete |
| 3 | Implement the 12-video limit and Load More. | Complete |
| 4 | Add Subscriptions and Discover navigation. | Complete |
| 5 | Apply Shorts rules and preserve native features. | Complete |
| 6 | Polish, test, and prepare for release. | Complete |

## Progress

### Milestone 1 — Complete

Initialized the project and verified content-script injection.

- TypeScript (strict) + Vite project with `build`, `typecheck`, and `watch` scripts.
- Manifest V3 extension with one content script matching `https://www.youtube.com/*`.
- A temporary "YouTube Intentional active" badge (bottom-left, fades out after ~4 seconds) plus a console log confirm the script runs. The badge is a development aid and will be removed later.
- README with install, build, and testing instructions; `.gitignore`; Git repository initialized.
- Verified: type check and build pass; in Chrome 157 the extension loaded, the badge appeared on youtube.com and removed itself, and the console log appeared.
- Manually verified by the user via `chrome://extensions` > Load unpacked in their own Chrome profile.
- Known limitation (expected, addressed in Milestone 2): the script runs only on full page loads, so YouTube's in-app navigation does not re-trigger it.

### Milestone 2 — Complete

Detection only; YouTube's page is not modified.

- Detects in-app navigation, Back/Forward, and full page loads, and logs the page type (`home`, `subscriptions`, `search`, `watch`, `shorts`, `other`).
- On Home, Subscriptions, and search, logs counts of video cards, Shorts cards, other cards (ads), Shorts shelves, and whether the infinite-scroll continuation is present. Logs again whenever the counts change.
- Verified by injecting the built script into a logged-out YouTube tab: search results (20 videos and 2 Shorts shelves, growing to 40 and 4 after scrolling), search to watch to Back, and in-app navigation to Home (empty feed, 0 cards). Grid card and Shorts card selectors checked on a channel's Videos tab (30 videos, 0 Shorts) and Shorts tab (48 of 48 Shorts).
- Manually verified by the user as an installed extension in their logged-in Chrome profile: Home, Subscriptions, search, scrolling, watch-page navigation, and Back all logged correctly, and YouTube behaved normally.
- No automated unit tests yet; verification is type check, build, and manual testing.

### Milestone 3 — Complete

- Home and Subscriptions show the first 12 videos, then a "Load 12 More" button styled like YouTube's buttons in light and dark theme. Scrolling no longer loads more. Search results are unchanged.
- Decisions made at the start of the milestone: limit Home and Subscriptions only; count only real videos and hide everything after the 12th; keep the loaded count on Back; remove the button at the end of the feed.
- New module `src/content/feedLimiter.ts`. `watchFeed` now scans once per animation frame instead of a 250 ms debounce. `onNavigate` now reports whether a navigation was Back/Forward.
- Verified by injecting the built script into a logged-out channel Videos tab made to look like Home (`page-subtype="home"`, path `/`): 12 of 30 cards shown; scrolling loaded nothing; clicks showed 24, then 36 (fetching 30 more when the spinner scrolled into view), then 48 and 60; all revealed thumbnails loaded on scroll; going to a watch page removed every extension element and class; Back restored 36 videos; with the continuation removed, the button disappeared once all 60 were shown; in-app search still scrolled infinitely (18 to 40 results) with no extension elements.
- Manually verified by the user as an installed extension in their logged-in Chrome profile: the limit and Load More on Home and Subscriptions, Back restoring the count, reset on other navigation, dark theme, and search and other pages unaffected. Shorts shelves among the first 12 videos still appear, as expected until Milestone 5.

### Milestone 4 — Complete

- Sidebar (full and collapsed) shows Home, Discover, You; Shorts is hidden. Home is the Subscriptions feed with a house icon; Discover is YouTube's recommendations with a compass icon. The current page's entry is highlighted by YouTube and gets a filled icon.
- The logo and links to `/` go to Home; a fresh visit to youtube.com redirects to Home; reload and Back/Forward stay on Discover.
- Discover keeps the 12-video limit and Load More (it is the same page Milestone 3 limited as Home).
- Decisions made at the start of the milestone: Home replaces the separate Subscriptions entry; Discover sits below Home.
- New modules `src/content/sidebar.ts` and `src/content/homeRedirect.ts`; page type `home` renamed to `discover`.
- Verified by injecting the built script into a logged-out Chrome tab: fresh load of `/` redirected to `/feed/subscriptions`; full sidebar showed Home (active), Discover, You, History with Shorts hidden; clicking Discover navigated in-app to `/` with Discover highlighted and Load More present; clicking the logo navigated in-app to `/feed/subscriptions` with Home highlighted; Back returned to Discover; reload of `/` stayed on Discover; the mini sidebar at 1100 px showed Home, Discover, You with matching tooltips and `aria-label`s and a filled icon on the current page; icons followed dark theme; the logo on a watch page navigated in-app to Home, and on a freshly loaded watch page (sidebar not rendered) loaded Home normally.
- Manually verified by the user as an installed extension in their logged-in Chrome profile: landing on Home from youtube.com, the full and collapsed sidebars (Home, Discover, You, no Shorts), Discover with the 12-video limit, the logo returning to Home, Back and reload staying on Discover, and search and other native pages unaffected.
- Known limitations: on a fresh visit to youtube.com, Discover may be visible briefly before the redirect. Keyboard focus order in the sidebar is Discover then Home (CSS `order` changes only the visual order). Labels are English.

### Milestone 5 — Complete

- Home and Discover hide every shelf and every Shorts card; the 12-video limit counts only real videos. Shorts links and `/shorts/` URLs open in the normal video player.
- Decisions made at the start of the milestone: Shorts open in the watch player everywhere; Shorts are not hidden outside Home, Subscriptions, and Discover; all shelves are hidden on Home and Discover; the development badge and debug logs are removed in Milestone 6.
- New module `src/content/shortsRedirect.ts`; new selectors `gridSection` and `shortsLink`.
- Verified by injecting the built script (minus the unchanged sidebar module) into a logged-out Chrome tab: reloaded Discover showed 12 videos and 2 ads with both Shorts shelves hidden; Load More showed 24, 36, then 48 videos with no shelves or Shorts visible; clicking a Short in in-app search results loaded `/watch?v=<id>` in the normal player; a direct load of `/shorts/<id>` was replaced with `/watch?v=<id>` without adding a history entry.
- Manually verified by the user as an installed extension in their logged-in Chrome profile: Home (Subscriptions) and Discover with no shelves or Shorts and the 12-video limit and Load More intact; Shorts still shown in search and opening in the normal player, with Back returning to the results; Ctrl/middle-click on a Short ending on `/watch?v=<id>`; a pasted `/shorts/<id>` URL redirecting to the watch page; a channel's Shorts tab still visible with its Shorts opening in the normal player; and History, Watch Later, playlists, notifications, channel pages, the account menu, and playback unaffected.
- Not explicitly tested: an in-app navigation to `/shorts/` that does not come from a link click (covered by the redirect after each navigation).
- Known limitation: a direct visit or non-link navigation to `/shorts/<id>` may show the Shorts player briefly before the redirect.

### Milestone 6 — Complete

- Removed the temporary "YouTube Intentional active" badge and all navigation / feed debug console logging.
- Watch pages hide suggested / related videos beside (or below) the player; playlists and live chat are unchanged.
- README and manifest updated for the MVP release (`1.0.0`).
- Decisions made at the start of the milestone: hide only `#related` (not the whole secondary column) so playlist and chat stay; no new permissions or packaging pipeline beyond the existing `dist/` Load unpacked flow.
- New module `src/content/watchRelated.ts`; removed `activeIndicator.ts` and `debugLog.ts`; new selector `watchRelated`.
- Verified: type check and build pass.
- Manual verification for the user: reload the unpacked `dist/` extension, then confirm Home / Discover / sidebar / Shorts behavior still match Milestone 5, that watch pages show no related list while a playlist or chat still appears when applicable, and that DevTools shows no `[YouTube Intentional]` logs or active badge.
- Post-MVP polish: on wide watch layouts, after hiding `#related`, the player column is centered at the same width it had in the two-column layout (`#secondary` is hidden only when `#playlist` and live chat are absent). Theater mode, fullscreen, single-column breakpoints, playlists, and live chat are unchanged. Manually verified by the user on a normal watch page.

## Current Milestone

Post-MVP — Batch size (in progress). See Progress below.

### Post-MVP — Batch size

- Home and Discover each show **9 videos by default** (was 12). Per-page batch size is **3–30, step 3**, persisted in `chrome.storage.local`. **Load N More** and the visible count use that page's setting; moving a slider applies immediately on the open feed.
- **`src/content/batchSize.ts`** — read/write/normalize sizes, load at startup, sync across tabs via `storage.onChanged`.
- **`src/content/accountMenu.ts`** — Home and Discover sliders at the top of the account menu; grayscale styling, endpoint labels, step ticks.
- **`feedLimiter.ts`**, **`main.ts`**, **`selectors.ts`**, **`manifest.json`** (`storage`), **README** updated accordingly.
- Manually verified: logged-in avatar menu, 9-video default, immediate apply when changing Home (e.g. 24 then back to 9), grayscale slider UI approved by user.
- Still worth spot-checking: signed-out settings gear, values after browser restart, Discover slider on the Discover grid.

## Development Principle

Keep changes small, testable, and understandable. Do not implement future milestones prematurely.
