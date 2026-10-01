# Splitwise-style Expense Sharing

A frontend-only expense sharing app where people record shared costs and see who owes whom, always from one person's point of view. All amounts are in Indian Rupees (INR), precise to the paisa; there is no other currency.

## Language

**Current User**:
The single, fixed person the whole app is viewed as; every balance and label ("you owe", "you paid") is phrased from their perspective. There is no login and no way to become anyone else.
_Avoid_: Me, logged-in user, account, self

**Group**:
A named set of people (always including the Current User) who share a running tab of Expenses, e.g. "Goa Trip" or "Flat 4B".
_Avoid_: Team, circle, pool

**Group Type**:
The kind of Group (Trip, Home, Couple or Other), which only decides the Group's icon.
_Avoid_: Group category, template

**Former Member**:
A person removed from a Group once they were Settled Up in it. They still appear on the Group's past Expenses and Settlements, which stay read-only while they're gone; re-adding them makes them a normal member again.
_Avoid_: Ex-member, removed user, inactive member

**Friend**:
Any person in the app other than the Current User. Sharing a Group with someone automatically makes them a Friend, and they stay a Friend until the Current User removes them.
_Avoid_: Contact, member, user, participant

**Expense**:
A single shared cost, identified by a Description (e.g. "Dinner at Toit"): who paid, how much, and how it is split among people. Every Expense belongs to exactly one Group and stays there for its whole life. It need not involve the Current User at all.
_Avoid_: Bill, transaction, charge, item

**Category**:
The kind of spending an Expense represents (e.g. Dining out, Taxi, Rent), shown as an icon. Chosen by hand when adding the Expense.
_Avoid_: Tag, type, label

**Payer**:
The one person who paid the full amount of an Expense. Every Expense has exactly one Payer.
_Avoid_: Paid by, spender, owner

**Share**:
The final rupee amount, greater than ₹0, one person owes toward an Expense. An Expense's Shares always add up to its total; the Payer may or may not have a Share. A ₹0 amount is not a Share.
_Avoid_: Portion, cut, part, owed amount

**Involved**:
A person is involved in an Expense if they are its Payer or have a Share in it. Everyone else in the Group is not involved.
_Avoid_: Participant, included, ticked, part of

**Split Method**:
How the Shares of an Expense are entered: **Equal** (the total divided evenly among the chosen people) or **Exact** (each person's Share typed in directly).
_Avoid_: Split type, split mode, division

**Settlement**:
A record that one person paid another back, reducing the Debt between them. Every Settlement belongs to exactly one Group; one Settlement never spans several.
_Avoid_: Payment, repayment, transfer, settle-up

**Debt**:
The amount one person owes another within a single Group, as it results from the actual Expenses and Settlements; debts are never rerouted or simplified.
_Avoid_: Owing, IOU, liability

**Group Balance**:
One member's single net amount within one Group: positive if the Group owes them overall, negative if they owe the Group. It is made up of that member's Debts in the Group.
_Avoid_: Group total, standing

**Friend Balance**:
The single net amount between the Current User and one Friend: the sum of their Debts across every Group they share.
_Avoid_: Total, net, debt

**Owe / Get Back**:
The only two directions for any amount relative to a person: they **owe** (they must pay money) or they **get back** (money is due to them). Anything that doesn't touch the Current User is **not involved**.
_Avoid_: Lent, borrowed, credit, debit, owed to you, receivable

**Settled Up**:
Having no open Debts: every Debt is exactly ₹0.00. A member is Settled Up in a Group when none of their Debts there is open; a Group is Settled Up when none of its Debts is; the Current User is Settled Up with a Friend when none of their Debts in any shared Group is. A net balance of ₹0 alone is not enough.
_Avoid_: Even, clear, square, paid off

**Seed Data**:
The fixed, realistic starting dataset the app opens with the first time and after a reset; it is always identical. It is only a starting point: once loaded, it is ordinary data the Current User can change, and changes are kept across reloads until they reset.
_Avoid_: Fixtures, dummy data, sample data, demo data
