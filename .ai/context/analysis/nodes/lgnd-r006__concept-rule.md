---
type: "concept-rule"
node_id: "L0-lgnd-r006"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-r006"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 901
tags: ["rule", "migration", "compatibility", "C-10"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad01", "L0-lgnd-p006"]
---
**R-lgnd-006: Shipped Web Sword storage is frozen and read as-is.**

Source: ADR-021 (Web Sword storage keys are kept), C-10.

- The Web Sword prefix is `ws` forever. It derives exactly the 0.3.0 names: `andrew:ws_crafted`, `ws_crafted_by`, `ws_pending`, `ws_cooldown_until`, `ws_origin`, `ws_owner`, `ws_id`, `ws_owner_name`.
- 0.3.0 formats must parse:
  - `ws_pending` holding a single serialised mark → a one-element array;
  - a stack without `ws_gen` → gen 0;
  - a stack without `ws_holder` → holder = `ws_owner`;
  - a small tick-era `ws_cooldown_until` → expired.
- New fields are additive. The framework never deletes or renames a key the shipped version wrote.
- After the upgrade, a 0.3.0 world where the sword was crafted still refunds a new craft, and a sword cooling at shutdown is still cooling.
