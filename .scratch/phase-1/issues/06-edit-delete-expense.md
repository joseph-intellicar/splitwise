# 06: Edit and delete Expenses

**What to build:** From an expanded Expense row, the Current User can edit any field except the Group, or delete it permanently after confirming.

References: [spec](../spec.md) → Rules → Expenses, Screens → Group page, Screens → Add / edit expense, Feedback.

**Blocked by:** [04](./04-add-expense-equal.md)

**Status:** ready-for-agent

- [x] An expanded Expense row offers Edit and Delete.
- [x] Edit opens the add-expense dialog pre-filled with the Expense; every field is editable except the Group, which is shown locked; the same Save rules apply.
- [x] Delete asks for confirmation, then permanently removes the Expense; there is no undo.
- [x] Balances, the timeline and its month grouping update immediately after edit or delete (e.g. changing the date moves the row to the right month).
- [x] Each edit and delete shows a short toast.
