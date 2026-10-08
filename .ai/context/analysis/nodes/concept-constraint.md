---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 8
level: 0
title: "Global Constraints (v8)"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 2598
tags: ["v8", "storm-blade"]
---
---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-strm", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr"]
see_also: ["constraints", "stormbladeelytratotemspecruen-part-2"]
supersedes: ["L0-constraint@v7"]
---
# Global Constraints (v8)

**Carried unchanged:** C-1 … C-28, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20‴. All of them bind the Storm Blade. The ones it leans on most:
- C-2: stable 2.10.0, no Experiments.
- C-7: no duplication. The craft gate covers simultaneous crafts, the recipe book and shift-craft (storm §05).
- C-15: priority order.
- C-16: the closest stable equivalent, documented.
- C-22: filter out `undefined` players.
- C-26: the outcome is decided once, on the server. It applies to the trace: a trace resolves once, to one entity or to none.

**C-28 does not apply to the blade.** The blade's damage is *armour-respecting*, not fixed.

v8 adds:

| ID | Constraint | Source |
|---|---|---|
| C-29 | *(new)* **Armour-respecting bonus damage is exact and never stacks.** The active hit deals 10 HP and the passive bonus 6 HP, each *before* armour, Protection and Resistance, which then reduce it as for any `entityAttack`. Neither may be swallowed by the hurt-invulnerability window, nor counted twice. Active and passive are separate damage events. No other entity takes damage from either. Kill credit, the death message and totems work. | §02, §05, §06 |
| C-30 | *(new)* **Spectacle never deals damage.** Any lightning, wind or electric visual from a weapon causes no damage, fire, knockback, mob conversion (pig → piglin, villager → witch, creeper charge) or block change. If vanilla `lightning_bolt` cannot meet this on stable, it is not spawned (`L0-adr-sblt`). | §02, §05 |
| C-31 | *(new)* **Vanilla output stays vanilla.** A recipe that promises a vanilla item yields that exact `minecraft:` id, with no lore, dynamic property or mark. No script observes or alters it, and the legendary systems (magnet, protection, retention) treat it as an ordinary item. | §03, §04, §05 |
| C-32 | *(new)* **A chance is rolled per event, on the server.** The 30 % passive is an independent roll per landed hit, with no pity timer and no per-player streak state. The RNG is injectable so a GameTest can prove both branches deterministically and the rate statistically. | §02, §06 |
| C-20⁗ | *(extended)* Storm Blade acceptance uses ≥ 2 entities in a line for the "first target only" test, a wall test for "stopped by a solid block", and an armoured SimulatedPlayer for the pre-armour checks. | §06 |
