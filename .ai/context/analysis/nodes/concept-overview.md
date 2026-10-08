---
type: "concept-overview"
node_id: "L0"
source_channel: "rollout"
analysis_version: 8
level: 0
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v8)"
aliases: ["L0"]
is_a: ["overview"]
priority: 620
size_chars: 6225
tags: ["v8", "storm-blade", "supersedes:L0@v7", "reduce"]
relates_to: ["stormbladeelytratotemspecruen-part-1","stormbladeelytratotemspecruen-part-2","sculkcrossbowspecv1ruen-part-1","sculkcrossbowspecv1ruen-part-2","sculkcrossbowspecv1ruen-part-3","sculkcrossbowspecv1ruen-part-4","dragonkatanaspecv1ruen-part-1","dragonkatanaspecv1ruen-part-2","dragonkatanaspecv1ruen-part-3","ufomagnetspecv1ruen-part-1","ufomagnetspecv1ruen-part-2","ufomagnetspecv1ruen-part-3","ufomagnetspecv1ruen-part-4","orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2","orbitalcannonspecv1ruen-part-3","orbitalcannonspecv1ruen-part-4","fourstructuresspecruencopy-part-1","fourstructuresspecruencopy-part-10","fourstructuresspecruencopy-part-11","fourstructuresspecruencopy-part-2","fourstructuresspecruencopy-part-3","fourstructuresspecruencopy-part-4","fourstructuresspecruencopy-part-5","fourstructuresspecruencopy-part-6","fourstructuresspecruencopy-part-7","fourstructuresspecruencopy-part-8","fourstructuresspecruencopy-part-9","scytheofcalamityspecv1ruen-part-1","scytheofcalamityspecv1ruen-part-2","webswordspecv1ruen-part-1","webswordspecv1ruen-part-2","webswordspecv1ruen-part-3","constraints","minerspickaxetestspec","stage-0-infrastructure"]
---
---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v8: the Storm Blade and two vanilla recipes)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0", "L0-strm", "L0-lgnd", "L0-katn", "L0-sclk", "L0-magn", "L0-scyt", "L0-orbc", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr", "L0-adr-sbkb", "L0-adr-sbgt", "L0-strm-adtr", "L0-strm-cxkb", "L0-xcx26", "L0-xcx27", "L0-xq8"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2", "constraints"]
governs_files: ["src/legendary/", "src/websword/", "src/scythe/", "src/orbital/", "src/ufo/", "src/structures/", "src/katana/", "src/sculk/", "src/storm/", "src/terrain/", "packs/behavior/recipes/"]
supersedes: ["L0@v7"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v8)

**What it is.** A Minecraft **Bedrock** PvP add-on: one BP and one RP, namespace `andrew:`, packaged as `dist/andrew.mcaddon`. As built it is **1.8.0** (`d2cc212`). Andrey accepted the Sculk Crossbow at that version on 2026-10-08 (`1280206`). It uses only the stable Script API (`@minecraft/server` 2.10.0 on BDS 1.26.51.1, C-2). The game is played on an iPad and verified on BDS in Docker (production 19132, QA 19134, checks 19136). Only the iPad proves what renders.

| Family | Members | State (2026-10-08) |
|---|---|---|
| Legendary weapons | Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk`, Sculk Crossbow `sk`, **Storm Blade `sb` (v8)** | The first five have shipped. The Storm Blade is analysed (`L0-strm`) but not built. |
| Vanilla recipes | **Elytra, Totem of Undying (v8)** | Analysed in `L0-strm` (`L0-adr-sbvr`): plain shaped JSON with no script. |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped in 1.2.0. The scan-code reconcile is still owed (`xcx12`). |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Shipped. The magnet is def-driven. |

## What v8 adds: one component, `strm`
The spec "Storm Blade + Elytra + Totem v1" (priority 620) is the only new raw. One child covers it, and it was analysed in full.

1. **The Storm Blade (`andrew:storm_blade`)** is legendary **def #6**: active, `cooldownTicks: 600`, token `storm_blade_crafted` (`L0-strm-edef`).
   - **Melee:** a diamond-sword-class melee (`minecraft:damage` = the P6 value, expected 7). No durability.
   - **Recipe:** ` L / WSW / L ` → token.
   - **Active (Use):** a ≤ 10-block trace. The first living entity, and only that one, takes 10 HP pre-armour. Three visual strikes show at the hit or stop point. Any valid release spends the cooldown; invalid attempts are free.
   - **Passive (melee):** an independent 30 % roll for +6 HP pre-armour plus one strike. It never touches the cooldown.
2. **Elytra** (6 feathers around a diamond chestplate) and **Totem** (8 gold around an emerald), as `elytra.json` and `totem_of_undying.json`. They are unlimited and unobserved by script (C-31, `L0-strm-ercp`).

## How the components meet
```
 lgnd (def-driven, unchanged)                       strm (src/storm/)
 recipe ─► token ─► craft gate (sb_crafted) ─► marked andrew:storm_blade
 Use ─► resolveActivation ─► trace ≤10 ──(katn: exported trace/hitPoint, range param; strm-adtr)
                                   └─► first living hit ─► stormDamage(10) ─► 3 strikes (particles+sound; adr-sblt)
                     cooldown 600 t on a valid release ◄┘
 entityHitEntity (main hand) ─► roll 30 % (injectable RNG) ─► stormDamage(6) in the hurt window (adr-sbdm, xcx26) ─► 1 strike
 stormDamage: native | window (L+D, or manual-armour fallback) | lethal — mirrors sclk/hit.ts, does not import it
 retention · recovery · Void → last holder · protection · magnet · HUD — lgnd/magn, no blade code
 packs/behavior/recipes/{elytra,totem_of_undying}.json ─► vanilla items
```

### Cross-component findings from the deep-dive
- **`katn` is in the blast radius.** As read during reduce at v8, `src/katana/plan.ts` exports constants, types, `standsSafely` and `planTeleport`. The block-walk (`trace`, `cast`, `cellsAlong`, `hitPoint`) is module-private, and `trace` is fixed at 20 blocks. `L0-strm-adtr` exports a range-parameterised `trace`. That is a Katana-file edit, not a framework edit, so `xasm32` holds. It does pull the Katana scenarios into the gate (`L0-adr-sbgt`).
- **`sclk` is a pattern, not a dependency.** The hurt-window modes (`native | window | lethal`) are mirrored in `src/storm/damage.ts`. The crossbow's true-damage write is never imported, because this weapon's damage respects armour (C-29, `L0-strm-rdmg`).
- **`lgnd` and `magn` need no code.** They gain def #6 in their scenarios only. The framework invariant stands: one `registry.ts` entry plus `main.ts` subscriptions.
- **The recipe book stays distinct.** The blade's outline ` L / WSW / L ` matches the **Web Sword's** (` W / WSW / W `, also with a diamond sword in the centre) more closely than the crossbow's (` E / DCD / E `). The keys differ (lightning rod and wind charge vs cobweb), so neither recipe shadows the other. Neither vanilla recipe overlaps a pack recipe.

## Decisions at L0 (v8)
- `L0-adr-sbdm`: passive: before-event raise by f(6); active in window: write hp − f(10) (P1 failed, diagnose-CNTR-X26).
- `L0-adr-sblt`: visuals from particles and sound; no `lightning_bolt`.
- `L0-adr-sbvr`: the vanilla recipes.
- **`L0-adr-sbkb` (reduce):** the beam hit's native knockback is allowed; the strikes add none. This resolves `L0-strm-cxkb`.
- **`L0-adr-sbgt` (reduce):** the per-step merge gate across `strm`/`katn`/`lgnd`/`magn`. `sclk` stays out.

## Build order (Stage 10)
1. The probe on checks (`L0-strm-pprb`, P1–P7).
2. Vanilla recipes.
3. Def #6, item, token, recipe, RP and lang.
4. `stormDamage` with the in-window negative control.
5. Active trace, visuals, cooldown and HUD.
6. Passive.

Reopen the iPad criteria after each epic merge.

## Still open at L0
- **v8:** `xcx26` (the passive is swallowed by the hurt window). P1/P2 decide the mode, and it closes only on the build's negative-control GameTest. `xcx27` resolved by measurement: the shield blocks the beam from the front only, as in vanilla; `xq8` default is option 2, with no deviation.
- **Carried:** `xcx22`/`xcx23` (settled, kept for the record), `xq7`, `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`, `lgnd-cx09`/`cx11`/`cx12`.
