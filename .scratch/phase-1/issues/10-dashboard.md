# 10: Dashboard

**What to build:** The Dashboard summarises everything at a glance: what the Current User owes, gets back and their total balance, who they owe and who owes them (each expandable by Group), and their Groups as cards. When everything is settled, an empty state invites adding an Expense.

References: [spec](../spec.md) → Screens → Dashboard, Balance calculation (rules 6, 9).

**Blocked by:** [04](./04-add-expense-equal.md)

**Status:** ready-for-agent

- [x] Three figures per rule 6: you owe, you get back, total balance (get back − owe).
- [x] Two lists: Friends you owe and Friends who owe you, non-zero Friend Balances only; each expands to its per-Group breakdown; each Friend entry navigates to that Friend's page.
- [x] A Friend whose Friend Balance nets to ₹0.00 appears in neither list, even with open offsetting Debts (rule 9).
- [x] Below the lists: each Group as a card showing your Group Balance; each card navigates to that Group's page.
- [x] When every figure is ₹0.00: an "all settled up" empty state with an Add expense button.
- [x] Add an expense from the Dashboard opens the dialog with no Group selected; the user chooses a Group first.
- [x] Unit test: the figures are netted per Friend and can differ from summing the Group cards.
