---
name: make-pwa
description: "Convert the current Vite React application into a Progressive Web App with manifest, service worker, and installable configuration."
argument-hint: "What PWA behavior do you want? e.g. web install, offline caching, manifest only, or Electron-compatible web build"
---

## When to use
- When you want this Vite + React app to behave as an installable PWA in the browser.
- When you want offline-ready caching, an app manifest, and browser install support.
- When you need a clear, step-by-step conversion workflow for the current project.

## What this skill does
1. Review the current Vite app and identify the web build entry points.
2. Add or confirm a PWA plugin in `vite.config.ts`.
3. Create a `manifest.webmanifest` and update `index.html` with the required meta tags.
4. Register a service worker in `src/main.tsx` or equivalent entry file.
5. Configure caching, navigation fallback, and installability options.
6. Build and preview the app, then verify PWA behavior in browser devtools.

## Workflow
1. Confirm the app is a web-targeted Vite application, not only an Electron desktop package.
2. Install the PWA plugin dependency: `pnpm add -D vite-plugin-pwa`.
3. Create `manifest.webmanifest` with `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`, and icons.
4. Update `vite.config.ts` to use the PWA plugin with the manifest and service worker registration mode.
5. Add required meta tags to `index.html` for theme color and mobile display support.
6. Register the service worker in `src/main.tsx` and handle successful registration or errors.
7. Add icons to the public assets folder and ensure their paths match the manifest.
8. Run `pnpm build` and `pnpm preview`, then open the app in a modern browser.
9. Use browser devtools Application > Manifest and Service Worker panels to verify installation and offline support.

## Completion criteria
- `manifest.webmanifest` is served from the web build.
- A service worker is registered successfully.
- The app is eligible for installation and shows an install prompt in supported browsers.
- The app can reload while offline for cached assets/navigation.

## Notes
- Electron packaging may continue to use the same `dist` web build, but PWA behavior only applies in a browser environment.
- If the app is meant to work offline, include a shell route fallback and cache the main assets.

## Example prompts
- "Tambahkan dukungan PWA untuk aplikasi ini."
- "Buat manifest dan service worker untuk Vite React app."
- "Uji apakah aplikasi bisa diinstall sebagai PWA dan bekerja offline."
