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

## Known Challenges

- YouTube is a single-page application.
- Video feeds are dynamically loaded.
- Hidden content may interfere with lazy loading.
- Avoid navigation loops between Home and Discover.
- YouTube DOM selectors may change.

## Development Milestones

1. Create and load the extension.
2. Detect YouTube pages and relevant elements.
3. Implement the 12-video limit and Load More.
4. Add Subscriptions and Discover navigation.
5. Apply Shorts rules and preserve native features.
6. Polish, test, and prepare for release.

## Current Milestone

Milestone 1 — Initialize project and verify content-script injection.

## Development Principle

Keep changes small, testable, and understandable. Do not implement future milestones prematurely.
