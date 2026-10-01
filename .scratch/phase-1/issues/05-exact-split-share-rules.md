# 05: Exact split and Share edge cases

**What to build:** The add-expense dialog gains the Exact Split Method and enforces the remaining Share rules: ₹0.00 is never a Share, a Payer may have no Share, and at least one non-Payer must have a Share.

References: [spec](../spec.md) → Rules → Expenses, Screens → Add / edit expense; [GLOSSARY.md](../../../GLOSSARY.md) → Share, Involved.

**Blocked by:** [04](./04-add-expense-equal.md)

**Status:** ready-for-agent

- [x] "split [equally]" can be switched to Exact, turning each ticked person's Share into an editable amount.
- [x] A live "₹X left to assign" shows the difference between the Amount and the entered Shares; Save is disabled until it is ₹0.00.
- [x] A ₹0.00 amount (Exact, or an Equal split too small to give everyone a paisa) is not saved as a Share; that person is Involved only if they're the Payer.
- [x] The Payer may end up with no Share (e.g. you pay a flatmate's bill), and the row then shows "you get back" the full Amount when you are that Payer.
- [x] If no non-Payer has a Share > ₹0.00, Save is disabled with the hint "Split with at least one other person."
- [x] Unit tests cover Exact validation, ₹0 handling and the no-Share Payer case; balances follow rule 1.
