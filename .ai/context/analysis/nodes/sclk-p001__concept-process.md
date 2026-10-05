---
type: "concept-process"
node_id: "L0-sclk-p001"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-001 · Probe (runs first; gates `L0-adr-scbs` and `L0-adr-scdm`)"
aliases: ["L0-sclk-p001"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 2778
tags: ["process", "probe", "gate", "bds-checks"]
level: 2
---
# P-sclk-001 · Probe (runs first; gates `L0-adr-scbs` and `L0-adr-scdm`)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-scbs", "L0-adr-scdm", "L0-xcx22", "L0-xcx23", "L0-xasm23", "L0-sclk-ac21", "L0-sclk-cx02"]`

It runs on the **checks** BDS (19136), in a private copy, with a throw-away probe pack. The witnesses are `[andrew] probe:` log lines. Each question records **yes/no plus a measured value**.

| # | Question | How | Gates |
|---|---|---|---|
| Q1 | Does a custom item with `minecraft:shooter` (ammunition `minecraft:arrow`) fire in Survival and consume an arrow? Does it get a stored "loaded" state, or does it draw/release like a bow? | A real player on the iPad, plus a SimulatedPlayer `useItem`/`stopUsingItem` | adr-scbs (1). A failure means option B |
| Q2 | Do the enchanting table and the anvil offer Quick Charge, Multishot and Piercing for `enchantable.slot = "crossbow"`? | Anvil with books; `/enchant` | ad01, T15 |
| Q3 | Do Multishot and Quick Charge change the custom shooter's behaviour natively (count of spawns, draw time)? | count spawned projectiles; ticks from use start to release | adr-scbs (3), as05 |
| Q4 | At `entitySpawn` of a shooter- or crossbow-fired arrow, can `projectile.owner` and the velocity (`getVelocity()`) be read **in the spawn tick, before any damage**? Does `projectileShoot`, if present in 2.10.0, fire? | Fire at a target 2 blocks away; log the spawn tick, the hurt tick and the owner | adr-scdm (1) |
| Q5 | What is the minimum release time? Is a 1-tick tap a valid shot? | release after 1, 5, 10, 20 and 25 ticks | `L0-sclk-cx02` |
| Q6 | Does a snowball-runtime `andrew:sculk_bolt` raise `projectileHitEntity` on a SimulatedPlayer holding a raised shield? | shield in the off hand + `useItem` | `xcx23`, as02 |
| Q7 | Do three bolts landing within 2 ticks on one armoured SimulatedPlayer each subtract 10 under the true-damage pattern? | Protection IV netherite | `xcx22`, T17 |
| Q8 | What does a real Warden's Sonic Boom deal at Normal to an unarmoured SimulatedPlayer? | a Warden, a target in range | `xasm23` |
| Q9 | Bolt gravity/drag: what trajectory gives an arrow at the same velocity (positions per tick)? | log both | as01 |
| Q10 | Is `minecraft:sonic_explosion` visible on the iPad when spawned by script, and at what count per tick does it stay readable? | operator eye check | ad02, ac23 |

**Outcome handling.**
- Results go to `L0-adr-scbs` / `L0-adr-scdm` as `status: accepted` or `superseded`, with the measured numbers.
- A Q1 failure re-opens `lgnd` (mark-aware identity) before any build task.
- A Q4 failure (no owner or velocity at spawn) means the bolt is spawned from `itemReleaseUse` with the owner's view vector × the measured speed, documented under C-16.
