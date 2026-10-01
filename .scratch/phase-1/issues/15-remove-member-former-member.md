# 15: Remove a member and Former Member lock

**What to build:** From group settings, a member can be removed only when they're Settled Up in the Group. Removed members become Former Members: they stay visible on past items, and everything involving them becomes read-only until they're re-added.

References: [spec](../spec.md) → Rules → Groups and members, Balance calculation (rule 8), Guiding principles (money is never silently lost); [GLOSSARY.md](../../../GLOSSARY.md) → Former Member, Settled Up.

**Blocked by:** [06](./06-edit-delete-expense.md), [07](./07-settle-up-group.md), [14](./14-group-settings.md)

**Status:** ready-for-agent

- [x] Remove is allowed only when every pairwise Debt involving that member in the Group is ₹0.00; a net ₹0.00 Group Balance with open Debts is not enough.
- [x] When blocked, a hint names the open Debts, e.g. "Arjun still has open debts with Priya and you."
- [x] A removed member becomes a Former Member: still shown on the Group's past Expenses and Settlements, and not offered as Payer, sharer or Settlement party.
- [x] Expenses and Settlements involving a Former Member are fully read-only and can't be deleted; their expanded rows show "Arjun is no longer in this group. Re-add him to edit this."
- [x] Re-adding the person (via group settings) makes them a normal member again and unlocks those items.
- [x] The seeded Goa Trip Former Member's Expenses show as locked.
- [x] Unit tests cover the remove rule, including the hidden-Debt case (owes one member, owed by another, net ₹0.00).
- [x] Playwright test: removal blocked with hint; after settling, removal succeeds and the lock hint appears on their Expenses.
