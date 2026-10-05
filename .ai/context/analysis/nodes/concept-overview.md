---
type: "concept-overview"
node_id: "L0"
source_channel: "rollout"
analysis_version: 7
level: 0
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v7, after reduce)"
aliases: ["L0"]
is_a: ["overview"]
priority: 610
size_chars: 6364
tags: ["v7", "sculk-crossbow", "supersedes:L0@v6", "reduce"]
relates_to: ["sculkcrossbowspecv1ruen-part-1","sculkcrossbowspecv1ruen-part-2","sculkcrossbowspecv1ruen-part-3","sculkcrossbowspecv1ruen-part-4","dragonkatanaspecv1ruen-part-1","dragonkatanaspecv1ruen-part-2","dragonkatanaspecv1ruen-part-3","ufomagnetspecv1ruen-part-1","ufomagnetspecv1ruen-part-2","ufomagnetspecv1ruen-part-3","ufomagnetspecv1ruen-part-4","orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2","orbitalcannonspecv1ruen-part-3","orbitalcannonspecv1ruen-part-4","fourstructuresspecruencopy-part-1","fourstructuresspecruencopy-part-10","fourstructuresspecruencopy-part-11","fourstructuresspecruencopy-part-2","fourstructuresspecruencopy-part-3","fourstructuresspecruencopy-part-4","fourstructuresspecruencopy-part-5","fourstructuresspecruencopy-part-6","fourstructuresspecruencopy-part-7","fourstructuresspecruencopy-part-8","fourstructuresspecruencopy-part-9","scytheofcalamityspecv1ruen-part-1","scytheofcalamityspecv1ruen-part-2","webswordspecv1ruen-part-1","webswordspecv1ruen-part-2","webswordspecv1ruen-part-3","constraints","minerspickaxetestspec","stage-0-infrastructure"]
---
---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v7: the Sculk Crossbow, after reduce)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-lgnd", "L0-sclk", "L0-orbc", "L0-pntr", "L0-magn", "L0-katn", "L0-scyt", "L0-webs", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-adr-sckp", "L0-adr-hldb", "L0-adr-scfc", "L0-adr-scpi", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm26", "L0-xasm28", "L0-xq7", "L0-lgnd-cx15", "L0-lgnd-cx16", "L0-sclk-cx01", "L0-sclk-cx02"]
requires: ["L0-lgnd"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-4", "constraints"]
governs_files: ["src/legendary/", "src/websword/", "src/scythe/", "src/orbital/", "src/ufo/", "src/structures/", "src/katana/", "src/sculk/", "src/terrain/"]
supersedes: ["L0@v6"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v7, after reduce)

**What it is.** A Minecraft **Bedrock** PvP add-on (one BP + one RP, namespace `andrew:`, `dist/andrew.mcaddon`), as built at **1.6.1** (`ed05050`). Stable Script API only: `@minecraft/server` 2.10.0 on BDS 1.26.51.1 (C-2). Played on an iPad; verified on BDS in Docker (production 19132, QA 19134, checks 19136). The iPad is the only proof of what renders.

| Family | Members | State (2026-10-05) |
|---|---|---|
| Legendary weapons | Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk`, **Sculk Crossbow `sk` (v7)** | First four shipped (Katana in 1.5.0). The crossbow is analysed, not built. |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped 1.2.0; scan-code reconcile still owed (`xcx12`). |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Shipped; 1.6.x tuning made legendary weapons magnetic. |

## What the v7 run settled
Two children ran: **`lgnd`** (the framework, re-read against 1.6.1) and **`sclk`** (the crossbow). They fit together with **exactly one framework change**, as the plan required:

- **`lgnd` gives:** the passive-def shape (`lgnd-ad15`: optional ability block, `hasAbility(def)`; no timer key, no `resolveActivation` claim, no HUD line; defs #1–#4 byte-identical), def #5 (`lgnd-ad16`), and the unchanged def-driven services — craft gate and token, mark, retention, recovery, Void, `protectLegendariesIn`, Creative/`/give` copies and the magnet. `lgnd` confirmed none of these needs per-weapon code (`lgnd-ac27`).
- **`sclk` gives:** item/token/recipe/lang/RP data, the shot→bolt swap (one `andrew:sculk_bolt` per projectile, in-memory resolve-once map, `sclk-ad03`), the trail, fixed 10-HP true damage, the sculk patch, and the crater through a budgeted FIFO on the shared interval (`sclk-ad04`). Before queuing any carve it calls `protectLegendariesIn`. It then writes through a deny list moved out of `penetrator-keep.ts` into `src/terrain/keep.ts` and shared with the Orbital carve (`xcx25`).
- `sclk` cites `lgnd` rather than restating it (p006, ac19, ac20), and `sclk-r009` forbids any further framework hook. **The plan's invariant holds.**

```
 lgnd (def-driven, + passive def)                    sclk (src/sculk/)
 recipe ─► token ─► craft gate (sk_crafted) ─► marked andrew:sculk_crossbow
 full-charge release ─► projectile spawn ─► owner holds def #5? ─► 1 × andrew:sculk_bolt (same velocity, owner)
                                                                    │ boom particles on the real path; 100-tick cap
                       projectileHitEntity ◄────────────────────────┤ 10 HP true damage + patch, no crater
                       projectileHitBlock  ◄────────────────────────┤ plan crater ─► protectLegendariesIn ─► FIFO ≤300/tick
 retention · recovery · Void (→ mark.owner) · magnet  — no crossbow code      src/terrain/keep.ts ◄── shared ──► orbc/pntr
```

## Cross-component decisions made at reduce
- **`L0-adr-sckp`:** def #5's key prefix is **`sk`**, not the plan's `sc`, which is the Scythe's and would merge two weapons' live world state. Closes `lgnd-cx15`; the `sclk` artifacts, `xasm26` and the plan row were corrected in place.
- **`L0-adr-hldb`:** the last-holder return (`adr-hold`) stands as **decided and unbuilt**. `LGND-HOLD` is its own task. Until it ships, every weapon's T20/Void tests go through a single `returnTarget(mark)` helper that returns `mark.owner`. Closes `lgnd-cx16`.
- **`L0-adr-scfc`:** under base option A, a **full charge is the fire-rate gate**. Probe Q5 joins the `adr-scbs` gate list; if neither a native nor a scripted gate holds, the fallback is option B. Closes `sclk-cx02`.
- **`L0-adr-scpi`:** T15 is read as "Piercing is stripped in the tick it enters the inventory and never has an effect" (C-16 deviation), unless probe Q2 shows the tables never offer it. Closes `sclk-cx01`.

## The one large contingency
If the probe fails Q1 or Q5, `adr-scbs` falls back to the **vanilla crossbow plus a mark** (option B). That is not a def. It rewrites legendary identity across `lgnd` and the magnet's `hasitem` tags, and moves T18 (durability) to `lgnd`. It needs its own L0 decision before any build task (`lgnd` component §Fallback, `adr-scbs`).

## Seams re-checked at reduce (observed while reading at version 7, 2026-10-05)
- **Magnet:** def-driven (`isLegendaryWeaponStack`), so it includes def #5; `lgnd-r016`/`ac21` add the crossbow instance to the magnet's legendary scenarios.
- **Katana ray vs sculk:** `src/katana/plan.ts:22` traces with `includePassableBlocks: false`. Sculk is a full solid block, so it stops the Katana like any wall.
- **Crater vs structure `protect` boxes:** a grep of `src/structures/` found no protect box, only enchantment names. `xasm25` (structures are unprotected) matches what was read; the build task re-checks this.
- **Orbital after the deny-list move:** this is a gate, not a finding. `sclk-ac22` runs the Orbital protection scenarios on the extraction commit.

## Stage-7 order
1. `sclk` probe on checks (Q1–Q10). 2. `LGND-PASSIVE` + def #5 (`sk`). 3. `sclk` item, token, recipe, RP. 4. Bolt pipeline and damage. 5. Crater and sculk with the deny-list extraction. `LGND-HOLD` runs independently. Reopen the crossbow `ipad` criteria (`sclk-ac23`–`ac27`) after each epic merge.

## Still open at L0
`xcx22`/`xcx23` (probe Q6/Q7), `xq7` (the operator defaults sheet, non-blocking). Carried from earlier runs: `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`, `lgnd-cx09`/`cx11`/`cx12`.
