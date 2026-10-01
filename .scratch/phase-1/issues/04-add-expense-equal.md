# 04: Add an expense from a Group (Equal split)

**What to build:** From a Group page, the Current User can add an Expense split equally. The dialog opens with that Group selected and all current members ticked, and walks through who's involved, Description and Amount, Category, date and notes, then "Paid by [you] and split [equally]" with live Shares. Saving updates balances everywhere and shows a toast.

References: [spec](../spec.md) → Screens → Add / edit expense, Rules → Expenses, Feedback, Balance calculation.

**Blocked by:** [03](./03-balance-engine-group-page.md)

**Status:** ready-for-agent

- [ ] "Add an expense" on the Group page opens the dialog with that Group selected and all current members ticked; Former Members aren't offered.
- [ ] Field order: Group → who's involved → Description + large Amount → Category / date / notes row → "Paid by [you] and split [equally]" → live Shares.
- [ ] Category defaults to "General" and is chosen by hand from a list with icons; date defaults to today and can't be in the future; notes are optional.
- [ ] Payer defaults to the Current User and can be changed to any ticked person; "split [equally]" is the only Split Method offered in this ticket.
- [ ] Equal split divides the Amount in paise among the ticked sharers; leftover paise go one each to the first sharers in Group member order; Shares always sum to the Amount (unit tested, including e.g. ₹100.00 ÷ 3).
- [ ] Unticking someone from the split removes their Share but keeps them available as Payer.
- [ ] Save is disabled until there's a Description, an Amount > ₹0.00, and at least one non-Payer with a Share > ₹0.00.
- [ ] Saving persists the Expense, updates the Group page balances and timeline immediately, and shows a toast such as "Expense added to Goa Trip".
- [ ] All fields are labelled and the dialog is fully keyboard operable.
- [ ] Playwright test: add an equal-split Expense in a Group and see the row and balance card update.
