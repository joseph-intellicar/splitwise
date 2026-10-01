# 08: Friend page (read-only)

**What to build:** Opening a Friend shows the Current User's Friend Balance with them, broken down by shared Group, and a timeline containing only what's between the two of them, so the rows add up to the balance. A Friend who is Settled Up gets an "all settled up" state; a Friend with no shared Group gets a dedicated empty state.

References: [spec](../spec.md) → Screens → Friend page, Balance calculation (rules 5, 7, 8, 9).

**Blocked by:** [03](./03-balance-engine-group-page.md)

**Status:** ready-for-agent

- [x] Header: avatar (coloured initials), name, email or phone, and Add an expense and Settle up controls (inactive until ticket 09).
- [x] Balance card: Friend Balance per rule 5, with the non-zero per-Group amounts listed.
- [x] Timeline: only Expenses where one of you is the Payer and the other has a Share, plus Settlements between you two, grouped by month in the agreed order.
- [x] Each Expense row shows only the pairwise amount between you and this Friend (rule 7), in "you owe" / "you get back" wording; the rows sum to the Friend Balance (unit tested).
- [x] When Settled Up with the Friend (no open Debt in any shared Group): an "all settled up ✓" state, with the history behind "Show settled expenses".
- [x] Net-zero case (rule 9): offsetting open Debts in different Groups show the per-Group breakdown, not the settled-up state.
- [x] No shared Groups: "No shared groups yet" with a "Create group with [name]" button (wired in ticket 17); Add an expense is unavailable.
- [x] Unknown Friend IDs show the not-found page.
