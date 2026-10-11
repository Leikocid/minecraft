---
title: Project Summary
type: analysis
generated_at: "2026-10-11T18:49:56.602Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 630
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v9: the Above-Water Trident)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-trdt", "L0-lgnd", "L0-strm", "L0-katn", "L0-sclk", "L0-magn", "L0-adr-twlt", "L0-adr-twth", "L0-adr-twrp", "L0-adr-trlg", "L0-trdt-adcl", "L0-trdt-addm", "L0-trdt-adrf", "L0-xcx28", "L0-xcx29", "L0-xcx30", "L0-xq9", "L0-xq10"]
requires: ["L0-lgnd", "L0-strm"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "L0-katn", "L0-trdt-cons", "constraints"]
governs_files: ["src/legendary/", "src/storm/", "src/katana/", "src/trident/", "packs/behavior/recipes/"]
supersedes: ["L0@v8"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v9)

**What it is.** A Minecraft **Bedrock** PvP add-on: one BP and one RP, namespace `andrew:`, shipped as `dist/andrew.mcaddon`.
- **Version:** **1.9.2** as built. Andrey accepted the Storm Blade at that version (`16b44f9`).
- **API:** the stable Script API only (`@minecraft/server` 2.10.0 on BDS 1.26.51.1, C-2).
- **Where it runs:** played on an iPad. Verified on BDS in Docker: production on 19132, QA on 19134, checks on 19136. Only the iPad proves what renders.

| Family | Members | State (2026-10-11) |
|---|---|---|
| Legendary weapons | Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk`, Sculk Crossbow `sk`, Storm Blade `sb`, **Above-Water Trident `tr` (v9)** | Six have shipped and been accepted. The trident has been deep-dived (`L0-trdt`) but not probed or built. |
| Vanilla recipes | Elytra, Totem of Undying | Shipped (v8). |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped in 1.2.0. The `xcx12` reconcile is still owed. |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Shipped. Def-driven. |

## What v9 adds: one component, `trdt`
The only new raw is the spec "Above Water Trident v1" (priority 630). It describes **legendary def #7**, `andrew:above_water_trident`: a `PassiveLegendaryDef` with prefix `tr`, token `andrew:above_water_trident_crafted` and command `andrew:trident` (`xasm33`). It works like a vanilla trident, plus:
- **+2 HP before armour and one lightning visual per landed hit**, melee or thrown;
- a **sneak-release dash** anywhere with no cooldown, then a one-shot fall cancel;
- a **swim boost** to land-sprint speed while it is held;
- a **scripted throw** with a visible 10 b/s return that can never duplicate or lose the copy;
- Loyalty and Riptide are scrubbed.

The recipe ` G / BTB / G ` gives a craft token and returns exactly 2 empty buckets.

`L0-trdt` produced 3 ADRs (`adcl` custody, `addm` damage sharing, `adrf` refund), the custody entity `ecus`, 3 processes (`pthr` throw/return, `pfbk` fallbacks, `pmov` movement), 3 rules, 6 acceptance criteria (5 `bds`, 1 `ipad`) and a 10-probe plan (`L0-trdt-cons`, P1–P10, on checks 19136). **The probes are the first build deliverable.** Three design branches wait on them:
- P1 picks the refund variant;
- P5 picks the fall-cancel path (before-event, or the katana teleport);
- P10 picks the thrown-damage path (raise in the before-event, or a scripted `entityAttack`).

## How the components meet
```
lgnd ── T1 registry def #7 ─────────────────────────────────────────────┐
     ── T2 export lost() as deliverToLastHolder ◄── trdt custody fallbacks (offline, dead, dimension, unloaded, cap, restart)
     ── craftgate.refundExchange (P1-gated) ◄── trdt recipe: 2 water buckets
     ── T3–T6 unchanged, GameTest-proven: departure watch, retention, watch(), magnet
trdt: itemReleaseUse ─┬─ sneaking ─► DASH applyKnockback ─► fall grant (before-event | katn teleport)
                      └─ plain ───► record → clear hand → spawn → launch (ledger first)
                                    hit/miss ─► steered return 0.5 b/tick ─► one sync block: insert + remove + delete record
beforeEvents.entityHurt ─► strm raiseHit(event, 2, {causes}) ─► strm playStrikes ×1 per hit key
```

### Cross-component findings
- **`lgnd` is widened deliberately, by two generic hooks** (`L0-adr-trlg`):
  1. the custody fallback reuses the private `lost()` as an exported `deliverToLastHolder`, which settles `xcx30` within its allowance;
  2. the craftgate gains an optional `refundExchange` def field, inert for defs 1–6 and needed only if P1 shows the engine returns buckets.

  Every other `lgnd` seam (departure watch, death retention, `watch()`, the magnet) needs no code, because a custody entity is not a `minecraft:item` and has no inventory. GameTests prove each seam. No `lgnd` re-run is needed.
- **`strm` becomes a library.** The trident imports `raiseHit`, `registerStormDamage`, `observeStorm` and `playStrikes`. `raiseHit` gains an opt-in `causes` argument, because it otherwise raises only `entityAttack` and would drop the thrown +2. The default is unchanged, so the Storm Blade's behaviour does not move, but the `strm` scenarios gate every trident merge.
- **`katn` is the fallback**, not the path. The fall grant uses the hurt before-event. `src/katana/fall.ts`'s teleport is used only if P5 fails, and then the katana fall scenarios join the gate.
- **`sclk` is the projectile precedent.** It supplies the snowball runtime, `entityLoad` persistence and the `remove_on_hit` grace (the thrown entity has no `remove_on_hit`).
- **`magn` must ignore custody entities.** It does so already by construction (it scans only items and `hasitem` holders). Its legendary scenarios include def #7 with a custody entity in the zone.

**Merge gate for any trident build:** the `trdt` scenarios, the `lgnd` scenarios with def #7, the magnet's legendary scenarios, the `strm` scenarios, and the katana fall scenarios if P5 forces the fallback.

## Decisions at L0 (v9)
- `L0-adr-twth` (amended at reduce): a scripted throw, a ledger-first custody record keyed by `throwId`, a steered return, and the enchantment scrub.
- `L0-adr-twlt` (amended at reduce): one `playStrikes` visual per hit, and the +2 through the shared `strm` helper with an opt-in cause list. There is no `lightning_bolt` by default (C-30′, `xq10`).
- `L0-adr-twrp`: a sneak-release dash as an impulse with no cooldown, a one-shot fall grant, and the swim impulse.
- `L0-adr-trlg` (new at reduce): accepts the two `lgnd` widenings and restates `xasm32`.

## Still open at L0
- **v9:**
  - `xcx28` / `xq9`: throw vs dash on one input. The default is sneak = dash.
  - `xcx29` / `xq10`: real lightning vs C-30′. The default is the visual only.

  Both ship as defaults with reported limitations unless Andrey answers.
- **Resolved at this reduce:** `xcx30`, `xcx31`, `L0-trdt-cx01` and `L0-trdt-cx02`.
- **Carried:** `xcx26` (settled at build), `xq7`, `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`, `lgnd-cx09`/`cx11`/`cx12`.


## Statistics

- **Total artifacts:** 658
- **concept-aggregate:** 46 (124 KB)
- **concept-atomic:** 369 (397 KB)
- **concept-special:** 39 (61 KB)
- **raw:** 38 (150 KB)
- **other:** 47 (534 KB)
- **decision:** 119 (81 KB)

### By level

- L0: 5 artifacts
- L1: 48 artifacts
- L2: 383 artifacts
- L3: 5 artifacts


_Analysis version: 9_
