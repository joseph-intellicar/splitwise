# 09: Add an expense and Settle up from a Friend page

**What to build:** The Friend page's two actions work, limited to Groups the Current User shares with that Friend.

References: [spec](../spec.md) → Screens → Add / edit expense, Screens → Settle up, Screens → Friend page.

**Blocked by:** [04](./04-add-expense-equal.md), [07](./07-settle-up-group.md), [08](./08-friend-page.md)

**Status:** ready-for-agent

- [ ] Add an expense opens the dialog with a Group picker listing only Groups shared with this Friend; the most recently active shared Group is selected, with that Friend ticked.
- [ ] Settle up opens the dialog with a picker of shared Groups, each showing its amount pre-filled; it defaults to the largest amount you owe, then the largest you get back.
- [ ] After saving, the Friend page balance card, breakdown and timeline update immediately.
- [ ] A Friend with no shared Group has no way to add an Expense.
