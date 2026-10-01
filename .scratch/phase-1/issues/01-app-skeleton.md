# 01: App skeleton

**What to build:** A running app with the agreed technology, theme and layout, and no domain features yet. Opening it shows the two-column layout: a fixed sidebar flush to the left window edge with the navigation entries, and a content area filling the rest of the width. Each route shows a placeholder page. On narrow screens the sidebar collapses into a slide-out menu behind a menu button. Light, dark and System themes work from colour tokens defined up front. Unit and end-to-end test runners are wired up so later tickets can add tests.

References: [spec](../spec.md) → Layout and navigation, Visual design, Technology.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Project uses Vite, React, TypeScript, Tailwind CSS, shadcn/ui and React Router (spec → Technology).
- [x] Colour tokens exist for teal primary, orange (owe), green/teal (get back), grey (not involved) and neutral greys, each defined for both light and dark themes.
- [x] Theme follows the system setting by default; light and dark can be forced (the Settings toggle itself arrives in 02).
- [x] Sidebar is fixed to the left window edge (no centred fixed-width page, no empty side margins) and lists Dashboard, All expenses, a Groups heading (+ add), a Friends heading (+ add), a filter-by-name box, and Settings at the bottom. Lists and the filter can be empty placeholders here.
- [x] The content area to the right of the sidebar fills the remaining width; only it changes between routes.
- [x] On narrow screens the sidebar is hidden behind a menu button and slides out; no bottom tabs and no floating action button.
- [x] Routes exist for `/`, `/expenses`, `/groups/:groupId`, `/friends/:friendId` and `/settings`, each rendering a placeholder; any other address shows a friendly not-found page with a link to the Dashboard.
- [x] Product name "Splitwise" appears as plain text beside our own simple logo mark (no copied Splitwise branding).
- [x] Sidebar, menu button and links are keyboard reachable with visible focus.
- [x] Vitest runs with one passing smoke test; Playwright runs with one passing smoke test that opens the app and navigates between two routes.
