# 13: Create a Group

**What to build:** The Current User can create a new Group from the sidebar's Groups "+ add", choosing its name, Group Type and members, including people who aren't Friends yet.

References: [spec](../spec.md) → Rules → Groups and members, Rules → Friends, Data model; [GLOSSARY.md](../../../GLOSSARY.md) → Group, Group Type, Friend.

**Blocked by:** [03](./03-balance-engine-group-page.md)

**Status:** ready-for-agent

- [ ] "+ add" next to Groups opens a create-group dialog.
- [ ] Name is required; Group Type is one of Trip / Home / Couple / Other and only sets the icon; no custom image.
- [ ] Members can be picked from existing Friends or added by typing a new name, which creates a new Friend (optional email or phone, display only).
- [ ] The Current User is always a member and is first in member order; others follow in the order added.
- [ ] After saving, the new Group appears in the sidebar (alphabetical) and the app navigates directly to its Group page (spec → Rules → Groups and members); a toast confirms.
