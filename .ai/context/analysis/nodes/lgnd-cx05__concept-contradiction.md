---
type: "concept-contradiction"
node_id: "L0-lgnd-cx05"
source_channel: "rollout"
analysis_version: 6
title: "CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented"
aliases: ["L0-lgnd-cx05"]
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 854
tags: ["contradiction", "target:L0-lgnd", "commands", "C-10", "resolved", "resolved_by:L0-adr-scope"]
level: 2
---
---
is_a: ["contradiction"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p007", "L0-lgnd-ad06"]
status: resolved
category: source-vs-decision
---
# CTR-lgnd-05: ADR-021 renames the operator command, but the shipped command is documented

- **ADR-021:** the framework owns the give/reset commands as `/andrew:legendary <id> …`.
- **Shipped:** `/andrew:websword <give|reset> [target]` in `src/websword/commands.ts`. It is documented in `README.md` lines 167–172, referenced by decisions Q-006, Q-008 and Q-014, and mentioned in `src/gametest/main.ts`.
- **C-10:** the delivered platform must not regress.

**Interim handling:** register both names. `/andrew:websword` becomes an alias bound to the Web Sword def (`L0-lgnd-ad06`).

**Needs:** confirmation that keeping two command names is acceptable, instead of updating the README and deprecating the old name.
