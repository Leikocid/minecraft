---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad06"
source_channel: "rollout"
analysis_version: 5
title: "AD-lgnd-06: Keep the shipped Web Sword module paths and command as thin shims"
aliases: ["L0-lgnd-ad06"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1526
tags: ["architecture-decision", "migration", "compatibility", "commands"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p006", "L0-lgnd-p007", "L0-lgnd-ac11", "L0-lgnd-r006"]
---
# AD-lgnd-06: Keep the shipped Web Sword module paths and command as thin shims

**Context.** 0.3.0 shipped `src/websword/{state,cooldown,craftgate,retention,commands}.ts`, the command `/andrew:websword <give|reset> [target]` (documented in README), and GameTests in `src/gametest/main.ts` that import these modules. The framework moves the logic to `src/legendary/`.

**Decision.** The shipped files stay and become re-exports bound to the Web Sword def: `isReady(player, abilityKey = "web_sword")`, `startCooldown`, `remainingTicks`, `DEFAULT_ABILITY_KEY`, `registerCraftGate` etc. keep their names and behaviour. `/andrew:websword` stays as an alias of `/andrew:legendary <give|reset> web_sword [target]`. `trap.ts` and `cube.ts` are unchanged apart from exporting the ability handler instead of subscribing to events.

**Rejected.**
- (a) Big-bang rename: move everything and update every import, test and the README. It makes `L0-lgnd-ac11` (tests pass without assertion edits) impossible to check, because the tests change with the code.
- (b) Leave the Web Sword outside the framework and build it only for the Scythe. Two copies of the anti-dup logic would drift (C-7), and hand priority across weapons would have no single owner.

**Consequence.** A little dead-weight re-export code. The shims can be removed in a later stage once the GameTests import `src/legendary/` directly.
