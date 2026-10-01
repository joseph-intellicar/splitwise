# 12: Sidebar balance hints

**What to build:** Each Group and Friend in the sidebar shows a compact coloured balance, so the Current User rarely needs to open a page just to check.

References: [spec](../spec.md) → Layout and navigation, Balance calculation (rules 8, 9).

**Blocked by:** [03](./03-balance-engine-group-page.md)

**Status:** ready-for-agent

- [ ] Each Group entry shows your Group Balance; each Friend entry shows your Friend Balance, in owe / get back colours with the amount.
- [ ] The amount is hidden when Settled Up (rule 8).
- [ ] A Friend with a net-zero Friend Balance but open Debts shows ₹0.00 (rule 9).
- [ ] Hints update immediately after any change.
