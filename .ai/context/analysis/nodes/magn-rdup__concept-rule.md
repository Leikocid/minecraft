---
type: "concept-rule"
node_id: "L0-magn-rdup"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rdup"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 931
tags: ["is_a:rule", "no-dup", "C-7", "C-15"]
level: 2
---
**Rule (C-7″, C-15 priority 1).** Every materialisation is **remove first, spawn second, roll back on failure**.

**Container slot.**
1. Re-read the stack.
2. Run `setItem(k, undefined)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setItem(k, stack)`.

**Block.**
1. Save the permutation and the item.
2. Run `setType(air)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setPermutation(saved)`.

**Never** spawn before the removal. A throw after the spawn would duplicate.

**Invariant, checked by GameTest.** For each source, the number of iron items in the world after the event equals the number before. Block sources follow this mapping:
- block → 1 item;
- door → 1 item;
- ore → 1 raw_iron.

Non-iron container contents are byte-identical before and after.

**Ownership.** The magnet never writes to a block or entity in an unloaded chunk (C-12′). It never touches inventories of players, minecarts or armour stands.
