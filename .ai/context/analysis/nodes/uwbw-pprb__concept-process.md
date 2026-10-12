---
type: "concept-process"
node_id: "L0-uwbw-pprb"
source_channel: "rollout"
analysis_version: 10
title: "P-uwbw-prb · The probe that runs before any build"
aliases: ["L0-uwbw-pprb"]
is_a: ["process"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 2354
tags: ["v10", "underwater-bow", "probe", "bds", "checks-19136"]
level: 2
---
# P-uwbw-prb · The probe that runs before any build

**Links.** relates_to: L0-adr-ubfl, L0-uwbw-adfl, L0-uwbw-adex, L0-uwbw-as01, L0-uwbw-cx01, L0-xasm39.

**Where.** The checks BDS (19136), a private instance named after the full task id, with its own criterion set, in parallel with the `ench` probe. Every row records a number, and the verdict goes to `docs/` and the task.

| # | Question | Pass reading | If it fails |
|---|---|---|---|
| 1 | Does the `entitySpawn` swap (the `sclk` P1) work for a custom shooter **without** `charge_on_draw` (bow-like)? | The arrow is seen in the same tick, the shooter is resolvable, and the replacement keeps the velocity vector | Tag the vanilla arrow instead (`adfl` B) |
| 2 | `liquid_inertia` 0.99 on the replacement: over 16 blocks of water and of lava, against air | The path is within ± 10 % (C-42), and the arrow survives lava until it hits | Per-tick velocity restore on tagged arrows in liquid |
| 3 | Vanilla damage at full draw: plain, Power I–V, Punch, Flame, crit; Infinity pickup | The table is recorded for the vanilla bow vs the bow's arrow (swapped / tagged) | This picks `adfl` B if the swap loses engine damage (`as01`) |
| 4 | `setOnFire(2)` on a target in water vs a scripted `fireTick` 1 HP/s | Vanilla fire goes out in water; the scripted ticks land and stay marked | — |
| 5 | A projectile hurt before-event rewritten to 14: what reads after armour (none, iron, diamond + Prot IV) | Matches `afterArmour(14)` exactly | Lethal and totem handling via `applyDamage` follow-through |
| 6 | An arrow at a raised shield, front and back | Before-event damage 0 or none and no hurt after-event at the front = a **miss** | — |
| 7 | Token recipe ` R / BWB / S ` in a Crafter: buckets back | Exactly 2 empty buckets via `craftReturn` (`trdt-adrf`) | — |
| 8 | Plain `minecraft:firework_rocket` output: `Fireworks.Flight` and Elytra boost | Reads flight 1 and boosts | Reported limitation (C-16, `xasm39`) |
| 9 | Off hand: does a custom shooter with `allow_off_hand` draw from the off hand? | Recorded | Main hand only, noted in lang/README |

**Rows 3 and 8 cannot be fully measured by a SimulatedPlayer** (draw feel, rocket boost in flight). Their numeric part is `bds`; the feel is `ipad`.

**Exit.** The verdict picks `adfl` A or B and confirms or revises `adex`. Only then does task 3+ start.
