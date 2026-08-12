# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Danh sách chờ" (Watch Later) is a Vietnamese-language watchlist app for tracking games, movies, apps, comics, anime, and people to check out later. It's intentionally dependency-free: vanilla JS on the frontend, Node's built-in `http`/`fs` modules on the backend, no build step, no framework, no npm packages beyond Node itself.

## Commands

- Run the app: `npm start` (or `node server.js`) — serves on `http://localhost:3001` (overridable via `PORT` env var)
- No build, lint, or test scripts exist in this project.
- The app **must** be accessed via the running server (not opened as a `file://` HTML file), since saving requires the `/api/items` HTTP endpoint.

## Architecture

Three static files plus a minimal API server — no bundler, no transpilation:

- `server.js` — Node `http` server. Serves static files from the project root and exposes `GET /api/items` (reads `data/watchlist.json`) and `POST /api/items` (overwrites `data/watchlist.json` with the full posted array). There is no partial-update endpoint: the client always sends the entire list on every change.
- `app.js` — all frontend logic, in one file, no modules/bundler. Holds all list state in a single in-memory `state.items` array that is the source of truth in the browser; every mutation (`addItem`, `removeItem`, tag change) re-sorts, re-renders, and calls `persistState()` to POST the whole array back to the server.
- `index.html` — structure only; a `<template>` (`#movie-row-template`) is cloned per row in `renderList()`.
- `style.css` — theming via CSS custom properties in `:root` (colors, etc.); dark theme only.
- `data/watchlist.json` — gitignored, auto-created on first run by `server.js`. This is the actual database; deleting it (or resetting to `[]`) clears the app.

### Data model

Each item is `{ title: string, tag: string }`. Valid tags are defined in **two places that must stay in sync**: `TAG_OPTIONS`/`TAG_ORDER` in `app.js` and the `<option>`/`.label-option` elements in `index.html` (bulk-import `<select>` and the label-picker `<dialog>`). Adding a new tag means updating both files plus a `tag--<name>` color rule in `style.css`.

### Key frontend flows (all in `app.js`)

- **Text normalization pipeline**: raw input → `stripUrls` (strips pasted URLs, extracting a usable title/ID via `extractUrlToken` for known hosts like `nhentai.net` and `vlogtruyen.net`) → `collapseSpaces` → `toTitleCase` (Vietnamese-locale-aware casing). Duplicate detection (`normalizeTitle`) is case- and accent-insensitive per `(title, tag)` pair.
- **Label dialog**: adding a single item or editing an existing item's tag both go through the same `<dialog id="label-dialog">`, driven by `pendingSingleTitle` (new item) or `pendingEditItem` (existing item being retagged) — only one of these is active at a time. Keyboard nav (arrows/WASD/Enter) is handled manually via `selectedLabelIndex`.
- **Sorting**: `sortItems()` runs after every mutation — alphabetical by title (`localeCompare` with `"vi"` locale), then by `TAG_ORDER` as a tiebreaker.
- **Persistence**: `persistState()` fires an unawaited `fetch` POST after every local mutation; failures are only logged to console, not surfaced to the user.

Since there's no framework, UI updates are manual DOM manipulation — when changing list rendering, update `renderList()` and the `#movie-row-template` markup together.
