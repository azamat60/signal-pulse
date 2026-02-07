# Signal Pulse Dashboard

Signal Pulse Dashboard is a real-time trend tracking web app that aggregates topic signals from multiple public sources and shows the strongest current topics in one dashboard.

Data sources:
- Hacker News
- Reddit
- GitHub
- arXiv

## Features

- Live source polling (auto refresh every 90 seconds)
- Topic aggregation across multiple feeds
- Sort modes: `Popularity`, `Growth`, `Recency`
- Source filters (enable/disable HN, Reddit, GitHub, arXiv)
- Topic detail panel with:
  - source score breakdown
  - timeline of mentions
  - related items with links
- Source health indicators (OK/error per source)

## Tech Stack

- React
- TypeScript
- Vite
- CSS (custom, no UI framework)

## Project Structure

```text
src/
  components/
    TopicTable.tsx
    TopicDetailPanel.tsx
    SourceHealth.tsx
  data/
    sources.ts
  domain/
    aggregation.ts
    types.ts
  utils/
    text.ts
  App.tsx
  App.css
  index.css
```

## Requirements

- Node.js 18+ (recommended: latest LTS)
- npm

## Installation

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

After start, open the local URL shown by Vite (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Notes on External APIs

This project fetches data from public APIs directly in the browser.
Because of provider-side limits and policies, sometimes you may see temporary errors like:
- `HTTP 403` (GitHub API rate limit)
- `Failed to fetch` (network/CORS issues)

The dashboard is designed to keep working even when one source is temporarily unavailable.

## Author

Created by **Azamat Altymyshev**.
