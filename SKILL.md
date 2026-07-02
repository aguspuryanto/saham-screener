---
name: mobile-ux-redesign
description: "Redesign the current Vite React app for mobile-first UX and UI, optimizing layout, navigation, touch interactions, and responsive behavior."
argument-hint: "What mobile UX goal do you want? e.g. compact card layout, bottom nav, mobile sidebar, touchscreen polish"
---

## When to use
- When the app already has PWA support and you want it to look and feel great on phones.
- When the current layout is desktop-first and needs responsive mobile navigation and spacing.
- When you want a repeatable mobile UX redesign workflow for this project.

## What this skill does
1. Audit the current app structure and identify the main screens/components.
2. Define mobile breakpoints, touch-friendly spacing, and mobile navigation patterns.
3. Update layouts to use responsive CSS or Tailwind utility classes.
4. Replace desktop-only sidebars with mobile-friendly drawers, bottom bars, or stacked headers.
5. Improve tap targets, font sizes, button visibility, and card density for small screens.
6. Validate the PWA mobile experience with install, splash screen, and full-screen display.

## Workflow
1. Review the app's current content hierarchy and UI patterns in `src/presentation/features/screener`.
2. Choose mobile-friendly navigation: bottom navigation, drawer menu, or collapsible filter panel.
3. Add responsive breakpoints in `src/index.css` or component-level style logic.
4. Refactor major screens so cards, tables, and sidebars collapse cleanly on narrow widths.
5. Increase touch target sizes and spacing for buttons, toggles, and list items.
6. Add or update header metadata for mobile PWA theme color and display behavior.
7. Test the UI in a mobile browser viewport and iteratively refine spacing, typography, and input usability.

## Completion criteria
- The app layout adapts at narrow widths without horizontal scrolling.
- Primary actions are easy to reach and tap on a phone screen.
- Navigation and filters are accessible on mobile via drawer, bottom nav, or stacked controls.
- Text and controls remain legible and usable in small viewport sizes.
- The PWA mobile experience is stable and retains installability.

## Notes
- Keep PWA behavior intact while improving mobile presentation.
- Mobile UX improvements should focus on speed, accessibility, and touch comfort.
- If the app is used in Electron desktop mode, the same responsive styles should still work there.

## Example prompts
- "Rancang ulang UI agar mendukung tampilan mobile dengan navigasi bawah."
- "Buat tampilan PWA ini terasa nyaman di HP dan mudah disentuh."
- "Sesuaikan sidebar screener agar berubah menjadi drawer pada layar kecil."
