# YouTube Intentional

A Chrome extension (Manifest V3) that makes YouTube a more intentional experience by replacing algorithm-driven infinite scrolling with finite, deliberate browsing, while preserving YouTube's native interface.

See [PROJECT.md](PROJECT.md) for the product vision, requirements, and roadmap.

## Status

Milestone 2: the extension detects YouTube page navigation and logs the page type, plus the video cards, Shorts, and Shorts shelves on Home, Subscriptions, and search results, to the DevTools console. No YouTube behavior is changed yet.

## Requirements

- Node.js 20+ and npm
- Google Chrome

## Setup and build

```bash
npm install
npm run build      # type-check, then build into dist/
```

Other scripts:

| Script              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `npm run typecheck` | Run the TypeScript compiler without emitting    |
| `npm run watch`     | Rebuild `dist/` automatically on file changes   |

## Load the extension in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dist/` folder.

After rebuilding, click the reload icon on the extension's card in `chrome://extensions`, then refresh any open YouTube tabs. Content scripts are only injected on page load, so existing tabs keep running the old code until refreshed.

## Verify it works

1. Open <https://www.youtube.com/>.
2. A small dark badge reading "YouTube Intentional active" appears in the bottom-left corner and fades out after about 4 seconds.
3. Open DevTools (F12) > Console. You should see `[YouTube Intentional] Content script loaded on https://www.youtube.com/`.
4. As you move around YouTube, the console logs `[YouTube Intentional] Page: <type> (<path>)` after every navigation.
5. On Home, Subscriptions, and search, it also logs a collapsible line like `home: 24 videos, 0 Shorts cards, 1 other cards, 1 Shorts shelves, continuation present`. Expand it and hover over the logged elements to highlight them on the page.

## Project structure

```
public/
  manifest.json            Extension manifest, copied to dist/ as-is
src/
  content/
    main.ts                Content script entry point
    activeIndicator.ts     Temporary "extension active" badge
    debugLog.ts            Console logging for navigation and feed scans
    youtube/
      selectors.ts         All YouTube DOM selectors
      pageType.ts          URL -> page type (home, subscriptions, search, ...)
      navigation.ts        Detects YouTube's in-app navigation
      feedScanner.ts       Finds and classifies cards and Shorts shelves
vite.config.ts             Builds src/content/main.ts into dist/content.js (IIFE)
tsconfig.json              Strict TypeScript settings
```
