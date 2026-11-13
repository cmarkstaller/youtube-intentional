# YouTube Intentional

A Chrome extension (Manifest V3) that makes YouTube a more intentional experience by replacing algorithm-driven infinite scrolling with finite, deliberate browsing, while preserving YouTube's native interface.

See [PROJECT.md](PROJECT.md) for the product vision, requirements, and roadmap.

## Features

- **Home** is your Subscriptions feed; **Discover** is YouTube's recommendations. Both show 12 videos at a time with a "Load 12 More" button (no infinite scroll).
- Sidebar shows Home, Discover, You; Shorts is removed. The logo and youtube.com open Home.
- Home and Discover hide shelves and Shorts cards. Shorts links open in the normal `/watch` player.
- Watch pages hide the suggested-videos column; playlists and live chat stay.
- Search, History, Watch Later, playlists, notifications, channel pages, and playback stay native.

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

1. Open <https://www.youtube.com/> — you should land on Home (`/feed/subscriptions`).
2. Sidebar shows Home, Discover, You (no Shorts). Discover opens `/`; the logo returns to Home.
3. Home and Discover show 12 videos, then "Load 12 More"; scrolling does not fetch more. Shelves and Shorts cards are hidden.
4. Search still scrolls infinitely. Shorts in search open as `/watch?v=<id>`.
5. On a watch page, the side suggested-videos list is gone. Open a playlist video or a live stream and confirm the playlist panel / chat still appear.
6. History, Watch Later, channel pages, notifications, and playback behave normally.

## Project structure

```
public/
  manifest.json            Extension manifest, copied to dist/ as-is
src/
  content/
    main.ts                Content script entry point
    feedLimiter.ts         12-video limit and "Load 12 More" on Home and Discover
    sidebar.ts             Sidebar: Home, Discover, You; hides Shorts
    homeRedirect.ts        Sends the logo and fresh visits to youtube.com to Home
    shortsRedirect.ts      Opens Shorts in the normal watch player
    watchRelated.ts        Hides suggested videos on watch pages
    youtube/
      selectors.ts         All YouTube DOM selectors
      pageType.ts          URL -> page type (discover, subscriptions, search, ...)
      navigation.ts        Detects YouTube's in-app navigation
      feedScanner.ts       Finds and classifies cards and Shorts shelves
vite.config.ts             Builds src/content/main.ts into dist/content.js (IIFE)
tsconfig.json              Strict TypeScript settings
```
