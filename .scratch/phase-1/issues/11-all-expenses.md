# 11: All expenses

**What to build:** A single list of every Expense and Settlement that involves the Current User, across all Groups.

References: [spec](../spec.md) → Screens → All expenses, Ordering, Balance calculation (rule 7).

**Blocked by:** [04](./04-add-expense-equal.md)

**Status:** ready-for-agent

- [x] Lists only Expenses and Settlements that involve the Current User; not-involved items are excluded.
- [x] Grouped by month in the agreed order; each row carries a small Group label.
- [x] Expense rows show the same effect wording as the Group page; Settlement rows show who paid whom and the amount.
- [x] Rows expand in place like on the Group page.
- [x] No search or filters.
- [x] Add an expense here opens the dialog with no Group selected; the user chooses a Group first.
