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
- **Source layout:** Content-script code lives in `src/content/`. Shared logic will go in a separate module, and YouTube DOM selectors will be centralized in one file.

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
| 2 | Detect YouTube pages and relevant elements. | Not started |
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

## Current Milestone

Milestone 2 — Detect YouTube pages and relevant elements (not started).

Planned scope:

- Detect YouTube's client-side (SPA) navigation.
- Identify the current page type (Home, Subscriptions, search, watch, etc.).
- Centralize YouTube DOM selectors in one module.

## Development Principle

Keep changes small, testable, and understandable. Do not implement future milestones prematurely.
