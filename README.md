# Little Learners

An offline-capable learning games app for kids, built with TypeScript and Vite. It installs as a PWA (Progressive Web App) on phones and tablets.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or newer (includes `npm`)
- macOS, only if you want to re-record the voice clips (`npm run audio` uses the built-in `say` and `afconvert` tools)

Check your versions:

```sh
node -v
npm -v
```

## Install

```sh
git clone <repo-url>
cd kids-app
npm install
```

`npm install` pulls in all dependencies (all dev dependencies):

- `vite` - dev server and bundler
- `typescript` - type checking
- `vite-plugin-pwa` - service worker and manifest for offline use

## Run

```sh
npm run dev
```

Opens the dev server (default http://localhost:5173). It is started with `--host`, so you can also open it from a phone or tablet on the same Wi-Fi using the "Network" URL it prints.

## Build and preview

```sh
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

Deploy the contents of `dist/` to any static host. Once loaded, the app works offline and can be added to the home screen.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run icons` | Regenerates `public/icon-192.png` and `public/icon-512.png` (no extra dependencies). |
| `npm run audio` | Records any missing voice clips from `src/phrases.ts` into `src/clips/` (macOS only). |
| `VOICE=Samantha RATE=165 FORCE=1 npm run audio` | Re-records every clip with the chosen voice and speech rate. |

## Project layout

- `src/` - app code (`main.ts`, `lessons.ts`, `content.ts`, ...)
- `src/clips/` - pre-recorded voice clips (`.m4a`)
- `public/` - static assets and PWA icons
- `scripts/` - icon and audio generators
