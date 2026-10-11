---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 9
title: "Global Constraints (v9)"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 3295
tags: ["v9", "above-water-trident"]
level: 0
---
---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-trdt", "L0-adr-twlt", "L0-adr-twth", "L0-adr-twrp"]
see_also: ["constraints", "abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
supersedes: ["L0-constraint@v8"]
---
# Global Constraints (v9)

**Carried unchanged:** C-1 … C-29, C-31, C-32, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20⁗. All of them bind the trident. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. For the trident this covers the craft, the bucket return, and throw/return.
- C-16: the closest stable equivalent, with the limitation *reported*.
- C-22: filter out `undefined` players.
- C-26: the outcome is decided once, on the server.
- C-29: exact, non-stacking bonus damage. It applies to the +2 (`xasm34`).

**C-30 is amended (C-30′).** See the table.

| ID | Constraint | Source |
|---|---|---|
| C-30′ | *(amended)* **Spectacle never deals damage.** A weapon's lightning, wind or electric visual causes no damage, fire, knockback, mob conversion or block change. **The exception:** a spec that explicitly asks for a *real* lightning entity may get one, but only after the client answers (`xq10`). Even then the bolt deals no damage beyond the spec's stated bonus. | storm §02/§05; trident §02 (`xcx29`) |
| C-33 | *(new)* **One weapon, one place.** At any tick a legendary copy is in exactly one of these places: an inventory or container slot, a dropped item entity, **in custody** (a projectile, a return entity, or a pending delivery), or nowhere because its world flag is unset. A held copy and an in-flight copy never coexist, and a returned copy is inserted exactly once. | trident §02, §03 |
| C-34 | *(new)* **Ingredient returns are exact.** A craft that returns container items (empty buckets) returns exactly the count consumed. That holds with a full inventory, through shift-craft, and through a blocked-craft refund. The refund never yields both the filled and the empty bucket. | trident §01, §03 |
| C-35 | *(new)* **Movement abilities are free and safe.** The dash has no cooldown and no input other than the weapon's own Use. Each dash grants exactly one fall-damage cancel, on the next landing, and an unused grant expires (`xasm36`). | trident §02 |
| C-36 | *(new)* **Held-only buffs.** A buff tied to holding a weapon applies only to its holder, only while it is in the main or off hand, and is gone within 1 tick of switching away, dropping it, or throwing it. | trident §02 |
| C-37 | *(new)* **Built-in enchantments are excluded.** If a weapon builds an enchantment in, that enchantment can never stay on the item. Wherever data cannot block it (anvil, enchanting table, `/enchant`), the script removes it on the next inventory observation and reports this as a limitation. Other enchantments in the slot are kept. | trident §02 |
| C-20⁵ | *(extended)* Trident acceptance needs:<br>• a melee hit and a thrown hit against an armoured SimulatedPlayer, compared with a vanilla trident;<br>• a dash from a dry platform with no rain;<br>• a measured landing;<br>• a measured return speed from a block hit at ≥ 20 blocks;<br>• a re-throw attempted mid-return;<br>• a full-inventory craft. | trident §04 |
