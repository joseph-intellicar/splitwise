# 02: Seed Data, storage and Settings

**What to build:** The app opens on real data instead of placeholders. On first open it loads the fixed Seed Data (10 Friends, 3 Groups with their Expenses and Settlements, fixed calendar dates). All records live in a store saved to browser storage with a version number, so changes survive reloads. The sidebar lists the Groups and Friends alphabetically and the filter box narrows them by name. Settings lets the Current User edit their name, choose a theme, and reset to the Seed Data.

References: [spec](../spec.md) → Data model, Seed Data, Persistence, Ordering, Screens → Settings, Layout and navigation; [ADR-0001](../../../docs/adr/0001-integer-paise-and-derived-balances.md).

**Blocked by:** [01](./01-app-skeleton.md)

**Status:** ready-for-agent

- [x] Records exist for the Current User, Friends, Groups (with ordered members and Former Members), Expenses (with Payer, Shares, Split Method, Category, date, notes) and Settlements, with every amount stored as integer paise and no balance stored anywhere.
- [x] Group member order is the Current User first, then members in the order added.
- [x] Seed Data matches spec → Seed Data: the Current User "Joseph"; 10 Friends with realistic Indian names (most with email, some with phone), 9 across the Groups with overlap and 1 in no Group; Goa Trip (Trip, 5 people), Flat 4B (Home, 3 people), Office Lunch (Other, 4 people).
- [x] Seed Data contains, as records: Goa Trip partly settled, with Expenses the Current User isn't Involved in, a Former Member who appears on past Expenses, and Exact splits; Flat 4B with rent, electricity and groceries and an Expense whose Payer has no Share; Office Lunch with every Debt at ₹0.00.
- [x] Every seeded date is a fixed, realistic past calendar date; nothing is shifted relative to today; the seed is identical on every first open and every reset.
- [x] Seed Data satisfies every Expense rule in the spec (Shares > ₹0.00 summing to the Amount, at least one non-Payer Share, no future dates); a unit test verifies this.
- [x] State is saved to browser storage and restored on reload; saved data carries a version number; if the saved version differs from the current version, the saved data is not loaded and the app starts from the current Seed Data instead (spec → Persistence).
- [x] Sidebar Groups and Friends lists are alphabetical and the filter box narrows both by name; entries link to their group and friend routes.
- [x] Settings page: edit the Current User's name (name only); theme choice System / Light / Dark, remembered across reloads; Reset to Seed Data behind a confirm dialog, which restores the exact seed.
- [x] Reset and name changes show a short toast.
