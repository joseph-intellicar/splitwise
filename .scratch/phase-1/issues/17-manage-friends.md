# 17: Managing Friends

**What to build:** The Current User can add a Friend directly, edit their details, and remove them when they share no Group. A Friend with no shared Group can be turned into a Group in one step.

References: [spec](../spec.md) → Rules → Friends, Screens → Friend page; [GLOSSARY.md](../../../GLOSSARY.md) → Friend.

**Blocked by:** [08](./08-friend-page.md), [13](./13-create-group.md)

**Status:** ready-for-agent

- [x] "+ add" next to Friends opens an add-friend dialog: name required, email and phone optional (display only).
- [x] Name, email and phone can be edited from the Friend page.
- [x] Remove Friend is available only when you share no Group with them, after a confirm dialog; otherwise the action stays visible but disabled, with a short explanation of why it's unavailable (spec → Rules → Friends).
- [x] "Create group with [name]" on a Friend with no shared Group opens the create-group dialog with that Friend pre-added.
- [x] Adds, edits and removals show a short toast and update the sidebar (alphabetical) immediately.
