---
type: "concept-assumption"
node_id: "L0-xasm26"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-26 · Def #5 inherits the framework as built"
aliases: ["L0-xasm26"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1842
tags: ["v7", "sculk-crossbow", "CAN_ASSUME"]
---
---
title: "ASM-L0-26 · The crossbow joins the framework as def #5 and inherits the 1.6.x rules as built, including magnetism and the crafter-target Void return"
aliases: ["L0-xasm26", "Crossbow inherits the framework as built"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-magn", "L0-xcx11", "L0-xcx24", "L0-xcx21"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/legendary/registry.ts", "src/ufo/magnet-select.ts", "src/ufo/magnet-hold.ts", "src/legendary/recovery.ts"]
---
# ASM-L0-26 · Def #5 inherits the framework as built

**Assumption (CAN_ASSUME).** Crossbow §3 and §13 ("preserve all global legendary rules") are met by def #5 (`keyPrefix "sk"`, corrected at reduce from `sc`, which the Scythe holds: `L0-lgnd-cx15`, `L0-adr-sckp`; a craft token, a refund of echo shard ×2, deepslate ×2 and crossbow ×1) plus the no-ability change (`xcx24`), with these readings carried over from earlier weapons:

| Rule | As built at 1.6.1 |
|---|---|
| Hazards: fire and lava prevented; cactus and TNT get a return | the C-16 reading of `L0-xcx21`/`adr-ktgr`. T20 is proven as "exactly one exists, held or owed" |
| Orbital blast and rings | prevented by `protectLegendariesIn` |
| Void return to "the last owner" | **`mark.holder`, falling back to `mark.owner`**. `decision-resolve-l0-xcx11` chose the last holder, and it is built as of 2026-10-05 (`state.ts:47-52,69-72`, `recovery.ts:273`, LGND-HOLD-01-AA): a stack from before holders still returns to its `owner` |
| UFO Magnet | the crossbow **is pulled**: since 1.6.0 the selector takes any `isLegendaryWeaponStack` (`magnet-select.ts:8`). The spec does not list the magnet as a hazard, so this is not a breach |

**Impact if wrong.** The holder field is built, so the crossbow inherits it with no `lgnd` work of its own; T20/Void tests name the last holder, not the crafter. If the crossbow must be exempt from the magnet, a per-def `magnetic: false` is needed (touches `magn`).
