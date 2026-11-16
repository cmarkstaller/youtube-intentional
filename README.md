# Unscroll for Youtube

Unscroll is a Chrome extension (Manifest V3) that replaces algorithm-driven infinite scrolling with finite, deliberate browsing on Youtube, while preserving Youtube's native interface.

See [PROJECT.md](PROJECT.md) for the product vision, requirements, and roadmap.

## Features

- **Subscriptions** is your subscriptions feed; **Discover** is YouTube's recommendations. Each shows 9 videos at a time by default, then a "Load N More" button (no infinite scroll). The account menu (avatar; the settings gear when signed out) has a slider for each page, from 3 to 30 in steps of 3. The choice is remembered.
- Sidebar shows Subscriptions, Discover, You; Shorts is removed. The logo and youtube.com open Subscriptions.
- Subscriptions and Discover hide shelves and Shorts cards. Shorts links open in the normal `/watch` player.
- Watch pages hide the suggested-videos column and center the player on wide layouts (same size); playlists and live chat stay.
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

1. Open <https://www.youtube.com/> — you should land on Subscriptions (`/feed/subscriptions`).
2. Sidebar shows Subscriptions, Discover, You (no Shorts). Discover opens `/`; the logo returns to Subscriptions.
3. Subscriptions and Discover show 9 videos, then "Load 9 More"; scrolling does not fetch more. Shelves and Shorts cards are hidden.
4. Open the account menu (avatar, or the settings gear if signed out). Two sliders, Subscriptions and Discover, sit at the top. Drag one: the open page shows that many videos immediately, and "Load More" uses the new number. Reload the tab and confirm the value stuck. Steps are 3, 6, 9, … 30.
5. Search still scrolls infinitely. Shorts in search open as `/watch?v=<id>`.
6. On a watch page, the side suggested-videos list is gone and the player is centered (not hugging the left margin). Open a playlist video or a live stream and confirm the playlist panel / chat still appear beside the player.
7. History, Watch Later, channel pages, notifications, and playback behave normally.

## Project structure

```
public/
  manifest.json            Extension manifest, copied to dist/ as-is
src/
  content/
    main.ts                Content script entry point
    feedLimiter.ts         Video limit and "Load N More" on Subscriptions and Discover
    batchSize.ts           Saved Subscriptions / Discover batch size (3–30, step 3)
    accountMenu.ts         Sliders at the top of the account menu
    sidebar.ts             Sidebar: Subscriptions, Discover, You; hides Shorts
    homeRedirect.ts        Sends the logo and fresh visits to youtube.com to Subscriptions
    shortsRedirect.ts      Opens Shorts in the normal watch player
    watchRelated.ts        Hides suggested videos; centers watch layout on wide screens
    youtube/
      selectors.ts         All YouTube DOM selectors
      pageType.ts          URL -> page type (discover, subscriptions, search, ...)
      navigation.ts        Detects YouTube's in-app navigation
      feedScanner.ts       Finds and classifies cards and Shorts shelves
vite.config.ts             Builds src/content/main.ts into dist/content.js (IIFE)
tsconfig.json              Strict TypeScript settings
```
