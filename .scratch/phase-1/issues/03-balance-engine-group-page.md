# 03: Balance engine and read-only Group page

**What to build:** Balances become real. All Debts, Group Balances, row effects and Settled Up states are computed from the Expense and Settlement records, never stored. Opening a Group shows its header, a balance summary card, and its full timeline grouped by month, with rows that expand in place. Nothing can be changed from this page yet.

References: [spec](../spec.md) → Balance calculation (rules 1–4, 7, 8), Ordering, Screens → Group page, Guiding principles; [ADR-0001](../../../docs/adr/0001-integer-paise-and-derived-balances.md); [GLOSSARY.md](../../../GLOSSARY.md).

**Blocked by:** [02](./02-seed-data-storage-settings.md)

**Status:** ready-for-agent

- [ ] Pairwise Debts follow rules 1–3: each non-Payer Share creates a Debt to the Payer only; a Settlement from A to B reduces A's Debt to B, with any excess reversing it; each pair in a Group is offset into one amount; nothing is rerouted or combined across Groups.
- [ ] Group Balance follows rule 4 and equals the signed sum of that member's pairwise Debts in the Group.
- [ ] Settled Up follows rule 8: a member or Group is Settled Up only when every relevant pairwise Debt is ₹0.00; a net ₹0.00 with open Debts is not Settled Up.
- [ ] Unit tests cover rules 1–4, 7 and 8, including over-payment reversal and a circular A→B→C→A case with all net balances at ₹0.00.
- [ ] Amounts display as `₹1,234.50`, always with 2 decimals.
- [ ] Group page header: Group Type icon, name, member count, and Add an expense, Settle up and settings controls (present but inactive until their tickets land).
- [ ] Balance summary card at the top: your Group Balance in large type, then the top few non-zero member balances, and "See all balances" opening the full list; each member expands to their pairwise Debts.
- [ ] Timeline shows the Group's full history (never folded), grouped by month, newest first by the date on the item; same date, most recently added first.
- [ ] Expense row: date, Category icon, Description, "X paid ₹…", and your effect (rule 7): "you get back ₹…" (green/teal), "you owe ₹…" (orange) or "not involved" (grey), always with words, never colour alone.
- [ ] Settlement row: slim one line showing who paid whom and the amount (e.g. "You paid Priya ₹650.00", "Priya paid Arjun ₹200.00"), with no effect label.
- [ ] Rows expand in place (keyboard operable) to show Shares, Category and notes.
- [ ] Unknown Group IDs show the not-found page.
