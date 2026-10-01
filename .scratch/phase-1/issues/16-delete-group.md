# 16: Delete a Group

**What to build:** From group settings, a Group can be deleted only when it's Settled Up, so no money is ever silently lost.

References: [spec](../spec.md) → Rules → Groups and members, Balance calculation (rule 8), Guiding principles.

**Blocked by:** [14](./14-group-settings.md)

**Status:** ready-for-agent

- [ ] Delete is allowed only when every pairwise Debt in the Group is ₹0.00; all net Group Balances being ₹0.00 is not enough (e.g. a circle A→B→C→A).
- [ ] When blocked, the hint reads "Settle all balances in [Group name] before deleting it."
- [ ] There is no "leave group" option.
- [ ] When allowed: a confirm dialog, then the Group and all its Expenses and Settlements are removed; the app navigates to the Dashboard (spec → Rules → Groups and members) and a toast confirms.
- [ ] Unit test covers the circular case; Playwright test covers blocked and successful deletion (e.g. Office Lunch from the seed).
