# Spec: Phase 1, frontend-only Splitwise-style app

Status: needs-triage

A frontend-only expense sharing app in React + TypeScript that reproduces Splitwise's core functionality and information architecture with a modern, clean, responsive UI. No backend, no API, no authentication. Vocabulary follows [`GLOSSARY.md`](../../GLOSSARY.md); money handling follows [ADR-0001](../../docs/adr/0001-integer-paise-and-derived-balances.md). Reference screenshots (for structure only, not visual style) are in [`reference/`](../../reference/).

## Guiding principles

1. **One point of view.** Everything is phrased from the Current User's perspective, using only **you owe** (orange), **you get back** (green/teal) and **not involved** (grey). Never "lent", "borrowed" or "X owes Y" in rows.
2. **Money is never silently lost.** Any action that would erase or strand a non-zero Debt is blocked, with an inline hint explaining why.
3. **Balances are derived.** Debts, Group Balances and Friend Balances are recomputed from records; never stored.
4. **Balances and primary actions first.** Summary cards at the top of pages; **Add an expense** and **Settle up** always visible in the page header.

## Out of scope (phase 1)

Non-group Expenses / person-to-person splits · simplify debts · multiple Payers · percentage, shares and adjustment splits · currencies other than INR · receipts · comments · "added by / updated by" · repeating expenses · activity feed · charts · printable summaries · search or filters on All expenses · undo · fake loading delays · login / sign-up · mobile-app patterns (bottom tabs, floating action button) · ads and Pro upsells.

## Data model

- **Current User**: fixed, named "Joseph" in the Seed Data; name editable in Settings.
- **Friend**: name (required), optional email and phone (display only). Avatar = coloured initials derived from the name.
- **Group**: name (required), Group Type (Trip / Home / Couple / Other, which sets the icon), ordered member list (Current User first, then in order added), Former Members.
- **Expense**: Group (fixed for life), Description (required), Amount, Payer (exactly one), Shares, Split Method, Category, date, notes (optional).
- **Settlement**: Group (fixed for life), from-person, to-person, Amount, date.
- **Money**: integer paise; displayed as `₹1,234.50`, always with 2 decimals.

## Rules

### Expenses
- Amount > ₹0.00.
- Payer must be Involved; the Payer may have no Share.
- A Share is always greater than ₹0.00; a ₹0.00 amount (from an Exact split, or an Equal split too small to give everyone a paisa) is no Share, and that person is Involved only if they're the Payer.
- At least one person **other than the Payer** must have a Share greater than ₹0.00. Hint: "Split with at least one other person."
- Exact split: Shares must sum to the Amount; show "₹X left to assign" live.
- Equal split: divide in paise; leftover paise go one each to the first sharers in Group member order.
- Date defaults to today; no future dates. Category defaults to "General", chosen by hand.
- Every field is editable except the Group. Delete is permanent, after a confirm dialog.
- Only current members can be Payer or have a Share.

### Settlements
- Between any two current members of the Group; any positive amount (partial or more than owed is allowed).
- Date defaults to today; no future dates. Editable and deletable, like Expenses. No payment method.

### Groups and members
- Create: name, Group Type, members (pick existing Friends or type a new name, which creates a Friend). After a successful create, navigate directly to the new Group's page.
- Remove member: only when they're Settled Up in the Group, meaning **every pairwise Debt involving them is ₹0.00** (a net Group Balance of ₹0.00 isn't enough). Hint names the open Debts: "Arjun still has open debts with Priya and you." They then become a Former Member.
- Expenses and Settlements involving a Former Member are **fully read-only and not deletable**. Hint: "Arjun is no longer in this group. Re-add him to edit this." Re-adding restores them as a normal member.
- No "leave group". Delete group: only when the Group is Settled Up, meaning **every pairwise Debt in it is ₹0.00** (all net Group Balances being ₹0.00 isn't enough, e.g. a circle A→B→C→A). Hint: "Settle all balances in Goa Trip before deleting it." Confirm dialog, then removes all its Expenses and Settlements. After a successful delete, navigate to the Dashboard.

### Friends
- Sharing a Group makes someone a Friend; Friends persist until removed.
- Add Friend directly (name + optional email or phone). Edit name, email and phone.
- Remove Friend: only when you share no Group with them (which implies Settled Up). When not allowed, the action stays visible but disabled, with a short explanation of why it's unavailable.

### Ordering
- Timelines are grouped by month, newest first, by the **date on the item**; same date: most recently added first.
- Sidebar Groups and Friends lists: alphabetical.

## Balance calculation

All amounts are integer paise; nothing below is stored. Everything is recomputed from Expenses (with their Shares) and Settlements ([ADR-0001](../../docs/adr/0001-integer-paise-and-derived-balances.md)).

1. **An Expense creates Debts.** For each person with a Share who isn't the Payer: that person owes the Payer exactly their Share. The Payer's own Share creates nothing. No Debt ever arises between two people with Shares.
2. **A Settlement from A to B of X**: A paid B back X. Within that pair in that Group, A's Debt to B falls by X; any excess becomes B owing A.
3. **Pairwise Debt.** For each unordered pair in a Group, all the amounts from 1 and 2 are offset into one number: "A owes B ₹N", or ₹0.00 (settled). Never rerouted through third parties, never combined across Groups.
4. **Group Balance** of a member = (paid as Payer − own Shares) + (Settlements paid − Settlements received), all within the Group. Positive = gets back, negative = owes. It equals the sum of that member's pairwise Debts in the Group (signed from their side).
5. **Friend Balance** = the sum, over every Group the Current User shares with the Friend (including Groups where either is a Former Member), of their pairwise Debt in that Group, signed from the Current User's side. The friend page breakdown lists the non-zero per-Group terms.
6. **Dashboard figures:** **you owe** = sum of |Friend Balance| over Friends with a negative Friend Balance; **you get back** = sum over Friends with a positive one; **total balance** = get back − owe. These are netted per Friend across Groups, so they can differ from summing the Group cards.
7. **Row effects:**
   - Group page or All expenses Expense row: (amount if the Current User is Payer, else 0) − (Current User's Share, else 0). Positive = "you get back", negative = "you owe", not Involved = "not involved".
   - Friend page Expense row: only the term from rule 1 between the Current User and that Friend.
   - Settlement rows show who paid whom and how much; they carry no effect label.
8. **Settled Up** means every relevant pairwise Debt is ₹0.00 (member in a Group: all their Debts there; a Group: all Debts in it; with a Friend: all your Debts with them across shared Groups). A net balance of ₹0.00 alone is not Settled Up.
9. **Net-zero Friend Balance with open Debts** (e.g. you get back ₹100 from Priya in Goa Trip and owe her ₹100 in Flat 4B): the Dashboard uses the net, so she appears in neither list; her friend page is **not** in the settled-up state and shows the per-Group breakdown; her sidebar entry shows ₹0.00.

## Layout and navigation

- Two columns: a **fixed left sidebar, flush to the window edge**, and a content area filling the rest. On narrow screens the sidebar collapses into a slide-out menu behind a menu button.
- Sidebar: Dashboard · All expenses · Groups (+ add) · Friends (+ add) · filter-by-name box · Settings at the bottom. Each entry shows a compact coloured balance, hidden when Settled Up.
- Routes (ID-based): `/` · `/expenses` · `/groups/:groupId` · `/friends/:friendId` · `/settings`. Unknown IDs show a friendly not-found page with a link to the Dashboard.

## Screens

### Dashboard
- Three figures: **you owe** · **you get back** · **total balance** (get back − owe).
- Two lists: friends you owe and friends who owe you (non-zero only). Each expands to its per-Group breakdown; each Friend entry navigates to that Friend's page.
- Below them: your Groups as cards, each with your Group Balance; each card navigates to that Group's page.
- Everything ₹0: an "all settled up" empty state with an Add expense button.

### All expenses
- Only Expenses and Settlements that involve the Current User, across all Groups, grouped by month. Each row has a small Group label. No search or filters.

### Group page
- Header: Group Type icon, name, member count, Add an expense, Settle up, settings (rename, type, members, delete).
- Balance summary card at the top: your Group Balance in large type, then the top few non-zero member balances, with "See all balances" opening the full list. Each member expands to their pairwise Debts.
- Timeline: full history always visible (never folded), grouped by month.
- Expense row: date · Category icon · Description · "X paid ₹…" · your net effect ("you get back ₹800.00" = paid minus own Share / "you owe ₹400.00" / "not involved").
- Settlement row: slim one-line style ("You paid Priya ₹650.00", "Priya paid Arjun ₹200.00").
- Rows expand in place to show Shares, Category, notes, and Edit / Delete (or the Former Member lock hint).

### Friend page
- Header: avatar, name, email or phone, Add an expense, Settle up.
- Balance card: Friend Balance with a breakdown of non-zero amounts per shared Group.
- Timeline: only Expenses where one of you is the Payer and the other has a Share, plus Settlements between you two. Each row shows **only the pairwise amount** in your vocabulary, so the rows add up to the balance card.
- When you're Settled Up with the Friend (no open Debt in any shared Group): an "all settled up ✓" state, with history behind **Show settled expenses**.
- No shared Groups: "No shared groups yet" plus a **Create group with Priya** button; Add an expense is unavailable. There is no way to add an Expense directly to a Friend: they first need a shared Group, either a new one or an existing Group they're added to.

### Add / edit expense (dialog)
- Context pre-fill: from a Group page, that Group with all current members ticked; from a Friend page, a picker of shared Groups only (most recently active one selected), with that Friend ticked; from the Dashboard or All expenses, choose a Group first.
- Order: Group → who's involved → Description + large Amount → Category / date / notes row → "Paid by [you] and split [equally]" (both tappable) → live Shares.
- Ticking someone makes them eligible; whether they end up Involved depends on the final Shares and the Payer. Equal split divides among the ticked people; unticking someone from the split removes their Share but keeps them as a possible Payer.
- Save is disabled until all the rules above pass. Edit reuses the same dialog, pre-filled; the Group picker is locked.

### Settle up (dialog)
- From a Group page: pre-fill your largest Debt in the Group (you owe first, then get back); empty if you're Settled Up. One-tap chips for each of your non-zero Debts; "Record another payment" lets you pick any two current members by hand.
- From a Friend page: a picker of shared Groups with each amount pre-filled; defaults to the largest you owe, then the largest you get back.

### Settings
- Current User's name · theme (System / Light / Dark) · **Reset to Seed Data** (confirm dialog).

## Feedback
- A short toast after every save, edit and delete ("Expense added to Goa Trip").
- Confirm dialogs for destructive actions; no undo. No artificial delays.

## Visual design
- Modern, clean, card-based, generous whitespace, clear hierarchy, no dense lists.
- Product name "Splitwise" as plain text with our own simple logo mark (no copied branding; rename before any public deployment).
- Teal primary, orange for owe, neutral greys; colour tokens defined from the start; light and dark themes.
- Accessibility: full keyboard access, visible focus, colour never the only signal, labelled form fields.

## Seed Data
- The **initial state only**: loaded on first open and on reset, then fully editable like any other data (add, edit and remove Friends; create and edit Groups; add, edit and delete Expenses; record Settlements), within the normal rules.
- Identical on every first open and every reset: fixed content and **fixed calendar dates** (realistic past dates, e.g. Apr–Sep 2026), never shifted relative to today.
- **10 Friends** with realistic Indian names (most with email, some with phone); 9 spread across the Groups with overlap (so some friend pages show several Groups) and **1 in no Group** (shows the "No shared groups yet" state).
- **3 Groups**:
  - **Goa Trip** (Trip, 5 people): partly settled; includes Expenses the Current User isn't involved in, a Former Member with locked Expenses, and Exact splits.
  - **Flat 4B** (Home, 3 people): monthly rent, electricity and groceries; includes an Expense whose Payer has no Share (e.g. the Current User pays a flatmate's internet bill).
  - **Office Lunch** (Other, 4 people): fully Settled Up.

## Persistence
- Zustand store of raw records, saved to browser storage. Stored data carries a version number (covering the seed and the record shape).
- If the saved data's version differs from the current version, the saved data is not loaded; the app starts from the current Seed Data instead.

## Technology
Vite · React · TypeScript · Tailwind CSS · shadcn/ui · React Router · Zustand · Vitest (all money, split, rounding, balance and block/lock rules) · Playwright (add expense, settle up, block/lock flows).
