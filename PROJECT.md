# YouTube Intentional — Project Specification

## Vision

Make YouTube a more intentional experience by replacing algorithm-driven infinite scrolling with controlled, finite browsing.

Preserve YouTube's familiar interface and existing functionality wherever possible.

## Core Requirements

### Home / Subscriptions

- Default Home experience shows videos from subscribed channels.
- Display 12 video cards initially.
- Provide a "Load 12 More" button.
- No automatic infinite scrolling.
- Preserve YouTube's native video cards and styling.

### Discover

- Separate destination for YouTube's normal recommendations.
- Display 12 video cards initially.
- Provide a "Load 12 More" button.
- No automatic infinite scrolling.
- Discover should be a deliberate choice rather than the default.

### Shorts

- Hide Shorts from Home, Subscriptions, and Discover.
- Allow Shorts in search results.

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
- **Permissions:** None requested yet. Content scripts declared in the manifest need none; `storage` will be added when settings are introduced.
- **Source layout:** Content-script code lives in `src/content/`. `src/content/youtube/` is the shared YouTube integration layer (selectors, page type, navigation, feed scanning). Page-specific features will go in their own modules and build on it. All YouTube DOM selectors live in `src/content/youtube/selectors.ts`.
- **Navigation detection:** Listen for YouTube's `yt-navigate-finish` DOM event on `document`, with `popstate` as a fallback, deduplicated by URL, plus one run at startup. Page type is derived from the URL path, not from the event's `detail` (internal to YouTube, and not reliably readable from a content script's isolated world).
- **Feed scanning:** On Home, Subscriptions, and search only, a `MutationObserver` watches the visible page container and re-scans (debounced 250 ms) as cards render and as infinite scroll adds more. It is disconnected on every navigation. No observer runs on other pages.

### YouTube DOM findings (verified November 2026)

- Pages live inside `ytd-page-manager`. Visited pages stay in the DOM with the `hidden` attribute, so selectors must target the visible container only.
- Home and Subscriptions: `ytd-browse[page-subtype="home"|"subscriptions"]`, with cards at `ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer`. Cards contain the newer `yt-lockup-view-model` (videos) or `ytm-shorts-lockup-view-model(-v2)` (Shorts).
- Search: `ytd-search`, with cards at `ytd-item-section-renderer > #contents > ytd-video-renderer | yt-lockup-view-model`.
- Shorts shelves: `grid-shelf-view-model` is a generic shelf and is a Shorts shelf only if it contains Shorts lockups. Older variants are `ytd-rich-shelf-renderer[is-shorts]` and `ytd-reel-shelf-renderer`. Shelf titles are localized and not used.
- Infinite scroll is driven by a trailing `ytd-continuation-item-renderer`.
- Some navigations (e.g. clicking the logo from a watch page) do a full page reload instead of an in-app navigation.
- Logged-out Home with no watch history shows an empty "Try searching to get started" state with no cards.

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
| 3 | Implement the 12-video limit and Load More. | Not started |
| 4 | Add Subscriptions and Discover navigation. | Not started |
| 5 | Apply Shorts rules and preserve native features. | Not started |
| 6 | Polish, test, and prepare for release. | Not started |

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

## Current Milestone

Milestone 3 — Implement the 12-video limit and Load More (not started).

Planned scope:

- On feed pages, show only the first 12 video cards and stop YouTube's automatic infinite scrolling.
- Add a "Load 12 More" button that reveals the next 12 cards, fetching more from YouTube when needed.
- Build on `scanFeed` (which already separates videos, Shorts, and ads) and on `ytd-continuation-item-renderer` (YouTube's infinite-scroll trigger).
- Out of scope: Subscriptions-as-Home and Discover navigation (Milestone 4), and hiding Shorts (Milestone 5).

Open questions to settle at the start of Milestone 3:

- Which pages get the limit now: Home and Subscriptions only, since search keeps normal infinite scrolling.
- How to stop infinite scroll without breaking lazy loading (see Known Challenges).

## Development Principle

Keep changes small, testable, and understandable. Do not implement future milestones prematurely.
