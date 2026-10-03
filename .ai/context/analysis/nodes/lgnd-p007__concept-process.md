---
type: "concept-process"
node_id: "L0-lgnd-p007"
source_channel: "rollout"
analysis_version: 6
title: "P-lgnd-007: Operator commands"
aliases: ["L0-lgnd-p007"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1319
tags: ["process", "commands", "operator"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-cx05", "L0-lgnd-ad06", "L0-lgnd-r011", "L0-lgnd-r010"]
---
# P-lgnd-007: Operator commands

Generalised from `src/websword/commands.ts`. Permission level is `GameDirectors` (op on BDS).

- **New:** `/andrew:legendary <give|reset> <weapon> [target]`, where the weapon enum lists registered `abilityKey`s.
  - **give:** stamp `makeMark("admin", target)` with `gen = 0` on a new stack, then `addItem` (spawn at the feet if full). Send `admin_given` to the target and to the caller. Never touches the craft flag.
  - **reset:** clear `andrew:<p>_crafted` and `_crafted_by` for **that weapon only**. Broadcast `reset`, and write a server log line naming the caller. Generations, pending and owed are untouched.
- **New:** `/andrew:hide <seconds> [target]`, a test/operator seam (ASM-020). It sets `andrew:hidden_until` on the target to now + N s, so `L0-sqat` and iPad demos can exercise the Shadow Blade exclusion without Shadow Blade.
- **Kept:** `/andrew:websword <give|reset> [target]` as an alias bound to the Web Sword def (`L0-lgnd-ad06`, `L0-lgnd-cx05`).
- The callback is read-only (a custom-command restriction). Decide synchronously and mutate in `system.run`, as shipped.
- All commands register in the same `system.beforeEvents.startup` handler.
