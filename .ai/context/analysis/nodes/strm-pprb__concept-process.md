---
type: "concept-process"
node_id: "L0-strm-pprb"
source_channel: "rollout"
analysis_version: 8
title: "Probe (runs first, before any build task)"
aliases: ["L0-strm-pprb"]
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 2562
tags: ["v8", "storm-blade", "probe", "bds-checks-19136"]
level: 2
---
---
title: "Storm Blade probe on checks (19136): gates adr-sbdm and adr-sblt"
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbdm", "L0-adr-sblt", "L0-xcx26", "L0-xcx27", "L0-xasm30", "L0-strm-cxkb"]
---
# Probe (runs first, before any build task)

Run it on the **checks** BDS (19136), from a private BDS copy under `dist/`. Never use production (19132) and never import `bds-gametest.mjs`. Every result is recorded in the task's evidence and supersedes the ADR it gates if it fails.

| # | Question | Method | Pass → | Fail → |
|---|---|---|---|---|
| P1 | Inside the window, does `applyDamage(L+D, entityAttack, wielder)` take **D with armour applied to D**? | Armoured SimulatedPlayer (diamond set, ± Protection IV). Hit with a vanilla diamond sword, then in the same tick `applyDamage(L+6)`. Compare Δhealth to a control `applyDamage(6)` on a fresh, window-free twin. | adr-sbdm A | adr-sbdm C for the in-window case |
| P2 | The same for **mobs** (a zombie with armour via `/replaceitem`) | as P1 | A for both | per-target-type split, or C |
| P2b | Event order: `entityHitEntity` vs `entityHurt` in the same tick, and whether `entityHurt.damage` is pre- or post-armour | a logging subscriber | fixes `L0-strm-ppas` step 3 | — |
| P3 | Shield from behind | Sneaking SimulatedPlayer with a shield, facing away, `applyDamage(10, entityAttack)` | records the block (expected: full block, xcx27 (a)) | if the shield does *not* block, drop the deviation |
| P4 | Particle ids on 1.26.51 | `spawnParticle` with `minecraft:electric_spark_particle`, `minecraft:wind_explosion_emitter`, `minecraft:huge_explosion_lab_misc_emitter`, `minecraft:sonic_explosion` (candidates). A throw = absent. | id list frozen | fall back to existing ids |
| P5 | Thunder at the point | `dimension.playSound("ambient.weather.lightning.impact", p)`, check it is heard by a player 16 blocks away (iPad ear check) | adr-sblt A | `ambient.weather.thunder` |
| P6 | Diamond-sword melee parity | A vanilla `diamond_sword` vs a test item with `minecraft:damage` N against the same armoured sim; find the N whose Δhealth matches | `minecraft:damage` = N (expected 7) | — |
| P7 | Knockback of `applyDamage(entityAttack, damagingEntity)` | Δvelocity / Δposition of the target after the call | input to `L0-strm-cxkb` | — |

## Output
A short probe report under `docs/` that cites each verdict. `L0-adr-sbdm` and `L0-adr-sblt` move from proposed → accepted (or are superseded) on that evidence. `xcx26` does **not** close here: it closes on the build's negative-control GameTest.
