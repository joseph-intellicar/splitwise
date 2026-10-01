# 07: Settle up from a Group

**What to build:** From a Group page, the Current User can record a Settlement between any two current members. The dialog pre-fills their largest open Debt in the Group and offers one-tap suggestions; Settlements can be edited and deleted from their rows.

References: [spec](../spec.md) → Screens → Settle up, Rules → Settlements, Balance calculation (rule 2), Feedback.

**Blocked by:** [03](./03-balance-engine-group-page.md)

**Status:** ready-for-agent

- [ ] "Settle up" on the Group page opens a dialog asking who paid → whom → how much, plus a date.
- [ ] Pre-fill: your largest Debt you owe in the Group ("You paid [them] ₹[amount]"); otherwise the largest someone owes you ("[They] paid you ₹[amount]"); both sides empty if you're Settled Up in the Group.
- [ ] One-tap suggestion chips list each of your non-zero Debts in the Group and fill both people and the amount.
- [ ] "Record another payment" lets the user pick any two current members; Former Members can't be chosen.
- [ ] Any positive amount is accepted, including partial and more than owed (which reverses the Debt); date defaults to today, no future dates; no payment method.
- [ ] Saved Settlements appear as slim rows and update balances immediately; expanding one shows who paid whom, amount, date, and Edit / Delete.
- [ ] Edit reuses the dialog pre-filled (Group locked); Delete asks for confirmation and is permanent.
- [ ] Saves, edits and deletes show a short toast.
- [ ] Playwright test: settle a Debt in a Group and see the balance card reach Settled Up.
