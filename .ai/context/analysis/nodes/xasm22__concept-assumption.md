---
type: "concept-assumption"
node_id: "L0-xasm22"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "ASM-L0-22 · The framework as built satisfies the Katana's global rules"
aliases: ["L0-xasm22"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1765
tags: ["v6", "katana", "CAN_ASSUME", "alias:L0-xasm22", "is_a:assumption", "relates_to:L0-lgnd", "relates_to:L0-katn", "relates_to:L0-xcx21", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-3"]
---
---
title: "ASM-L0-22 · Katana §3/§13 rules and the recipe are met by registering with the framework as built"
aliases: ["L0-xasm22", "Katana uses the framework as built"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-xcx21", "L0-xcx11"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3"]
---
# ASM-L0-22 · The framework as built satisfies the Katana's global rules

**Assumption (CAN_ASSUME).** Katana §3 and §13 ("preserve all global legendary-item rules") are satisfied by adding a fourth `LegendaryDef` with its craft token, with **no new framework behaviour**.

| Spec | How it is met |
|---|---|
| One Survival craft, persistent; Creative and `/give` are free; announcement | craft gate + craft token + world flag, as for the other three |
| Infinite durability | no `minecraft:durability` component, as for the Web Sword |
| Transfer and containers | no binding, as for the others |
| Death retention, and a contained item untouched | `retention.ts`, cause-agnostic |
| Fire and lava | `fire_resistant` (prevented) |
| Cactus, TNT | **returned** to the owner (C-16): see `L0-xcx21` |
| Orbital Cannon (T17) | `protectLegendariesIn` on blast and ring volumes |
| Void, offline, then next join | recovery + owed list. The target is `mark.owner` until `xcx11` closes |

**The recipe ingredient.** A Diamond Sword in the centre is accepted whatever its damage or enchantments, as in vanilla shaped recipes. Its enchantments are **not** carried onto the Katana.

**Impact if wrong.**
- If enchantments must carry over, `katn` needs a craft-time hook. The craft token pipeline would have to read the consumed sword, which it cannot do today.
- If any rule needs per-weapon behaviour, it is an `lgnd` change.
