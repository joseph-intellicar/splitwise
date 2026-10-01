# Money is stored as integer paise, and balances are always derived

All amounts are stored as whole numbers of paise (₹12.50 is `1250`), never as floating-point rupees, so splitting and summing are exact and the leftover-paise rule (extra paise go to members in join order) is deterministic. No Debt, Group Balance or Friend Balance is ever stored: they are recomputed from the raw records (people, Groups, Expenses with their Shares, Settlements) whenever they're needed, so an edit, delete or reset can never leave a stale balance behind. Expenses store each person's final Share in paise rather than the inputs that produced it, which keeps old Expenses stable when Group membership changes and lets more Split Methods be added later without touching the balance rules.

## Considered Options

- **Floating-point rupees**: rejected; `0.1 + 0.2 !== 0.3` produces off-by-a-paisa balances that are hard to spot and harder to fix once persisted.
- **Stored running balances updated on each change**: rejected; every edit, delete and lock rule would need matching balance updates, and any bug would persist in browser storage. The dataset is small enough that recomputing is effectively free.
