---
type: "concept-overview"
node_id: "L0"
source_channel: "rollout"
analysis_version: 10
level: 0
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v10)"
aliases: ["L0"]
is_a: ["overview"]
priority: 640
size_chars: 6761
tags: ["v10", "underwater-bow", "enchanting", "recipes", "reduce", "supersedes:L0@v9"]
relates_to: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1","underwaterbowmacefireworksenchantingspecv2ruen-part-2","underwaterbowmacefireworksenchantingspecv2ruen-part-3","abovewatertridentspecv1ruen-part-1","abovewatertridentspecv1ruen-part-2","stormbladeelytratotemspecruen-part-1","stormbladeelytratotemspecruen-part-2","sculkcrossbowspecv1ruen-part-1","sculkcrossbowspecv1ruen-part-2","sculkcrossbowspecv1ruen-part-3","sculkcrossbowspecv1ruen-part-4","dragonkatanaspecv1ruen-part-1","dragonkatanaspecv1ruen-part-2","dragonkatanaspecv1ruen-part-3","ufomagnetspecv1ruen-part-1","ufomagnetspecv1ruen-part-2","ufomagnetspecv1ruen-part-3","ufomagnetspecv1ruen-part-4","orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-2","orbitalcannonspecv1ruen-part-3","orbitalcannonspecv1ruen-part-4","fourstructuresspecruencopy-part-1","fourstructuresspecruencopy-part-10","fourstructuresspecruencopy-part-11","fourstructuresspecruencopy-part-2","fourstructuresspecruencopy-part-3","fourstructuresspecruencopy-part-4","fourstructuresspecruencopy-part-5","fourstructuresspecruencopy-part-6","fourstructuresspecruencopy-part-7","fourstructuresspecruencopy-part-8","fourstructuresspecruencopy-part-9","scytheofcalamityspecv1ruen-part-1","scytheofcalamityspecv1ruen-part-2","webswordspecv1ruen-part-1","webswordspecv1ruen-part-2","webswordspecv1ruen-part-3","constraints","minerspickaxetestspec","stage-0-infrastructure"]
---
---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v10 reduce: Underwater Bow, Mace/Rocket recipes, enchanting table)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-uwbw", "L0-ench", "L0-lgnd", "L0-strm", "L0-sclk", "L0-trdt", "L0-magn", "L0-adr-ubfl", "L0-adr-enrl", "L0-adr-lgwd", "L0-uwbw-adfl", "L0-uwbw-adex", "L0-uwbw-adrc", "L0-ench-adr1", "L0-uwbw-cx01", "L0-ench-cx01", "L0-xcx32", "L0-xcx33", "L0-xq11", "L0-xasm38", "L0-xasm39", "L0-xasm40"]
requires: ["L0-lgnd", "L0-strm", "L0-sclk"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2", "underwaterbowmacefireworksenchantingspecv2ruen-part-3", "constraints"]
governs_files: ["src/legendary/", "src/storm/damage.ts", "src/sculk/enchant.ts", "src/underwater/", "src/enchanting/", "packs/behavior/recipes/", "packs/behavior/items/"]
supersedes: ["L0@v9"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v10)

**What it is.** A Minecraft **Bedrock** PvP add-on: one BP and one RP, namespace `andrew:`, shipped as `dist/andrew.mcaddon`.
- **Version:** **1.10.0** as built. Andrey accepted the Above-Water Trident (`2f12a73`). v10 targets **1.11.0**.
- **API:** the stable Script API only (`@minecraft/server` 2.10.0 on BDS 1.26.51.1, C-2).
- **Where it runs:** played on an iPad. Verified on BDS in Docker: production on 19132, QA on 19134, checks on 19136. Only the iPad proves what renders.

| Family | Members | State (2026-10-12) |
|---|---|---|
| Legendary weapons | Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk`, Sculk Crossbow `sk`, Storm Blade `sb`, Above-Water Trident `tr`, **Underwater Bow `ub` (v10, `L0-uwbw`)** | Seven have shipped and been accepted. The bow is analysed. |
| Vanilla recipes | Elytra, Totem of Undying, **Mace (Iron Block over Breeze Rod), Firework Rocket ×3 (Paper over String)** (v10, in `L0-uwbw`) | Two have shipped (v8). Two are analysed as plain data (`L0-uwbw-adrc`). |
| Vanilla systems | **Enchanting table: a rare pool and level rules** (v10, `L0-ench`) | Analysed. Feasibility comes first; the hook is gated on `xq11`. |
| World structures | Windmill, Warden City, Bastion, Airship | Shipped in 1.2.0. The `xcx12` reconcile is still owed. |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Shipped. Its legendary scenarios add def #8. |

## v10 in two components
The spec ("Underwater Bow / Mace / Fireworks / Enchanting v2") splits along one line: §1–§3 talk to **our framework**, and §4 talks to **the engine**.

1. **`L0-uwbw`: the bow and the two recipes.** It is def #8, the first legendary whose ability is **armed, not fired**: sneak + Use arms one charge (`xasm38`), only a hit that lands on a living entity spends it, and only that hit starts the 30 s cooldown. The deep-dive changed two things in the L0 design:
   - **Flight keeps the vanilla arrow** (`L0-uwbw-adfl`). The arrow is tagged in `entitySpawn` and its air path is restored while it is in a liquid. The `sclk`-style swap would lose vanilla bow damage and enchantments (snowball runtime has no impact damage), so it wins only if the probe shows exact parity.
   - **The exact 14 needs a replace-mode `setHit`** beside `raiseHit` (`L0-uwbw-adex`). `raiseHit` is additive and handles melee only. That would give vanilla + 14 (`L0-uwbw-cx01`, now resolved).

   The recipes are two `recipe_shaped` files with vanilla output, guarded by a shape-collision unit test (C-40). The rockets' flight is whatever the plain result carries; anything other than 1 is a reported limitation (`xasm39`).
2. **`L0-ench`: the enchanting table, feasibility first.** It has three tiers:
   - a probe with a written verdict (C-38);
   - a pure, statistically tested roller, `src/enchanting/roll.ts`, which is always built;
   - an engine adapter built only for the option Andrey picks in `xq11`.

   Eligibility is a static table checked against the engine by a `bds` parity scenario (`L0-ench-adr1`). Its deep-dive found that the post-hoc re-roll cannot tell a table from an anvil without a proven separator (`L0-ench-cx01`, now resolved by amending `adr-enrl` and `xq11`).

## How the components meet
```
lgnd ── def #8 (Active, prefix ub) ── craftgate + craftReturn 2 buckets (trdt-adrf) ── retention / Void / Creative unchanged
     ── widening (L0-adr-lgwd): hudKeys.armed? (optional) + the bow calls startCooldown on the HIT; Use is not claimed by resolveActivation
uwbw ── entitySpawn tag on the vanilla arrow (no projectileShoot in 2.10.0) ── one shared interval: liquid flight + Super Fire + HUD
strm ── NEW setHit(event, 14, {causes:[projectile]}) beside a frozen raiseHit ── playStrikes ×1 ──► armed hit
uwbw ── minecraft:enchantable slot "bow" ──► ench sees def #8 through the slot data, nothing extra
ench ── pure roller ── forbiddenFor(itemId) = FORBIDDEN_ENCHANTMENTS (trdt) ∪ Piercing (sclk), read, never copied
     ── adapter (a|b|c) per xq11 ── the C-37 scrubs still run after it
recipes ── packs/behavior/recipes/*, vanilla output, no script, shape-collision test across every recipe
```
**Seams checked at reduce:**
- the bow recipe ` R / BWB / S ` differs from the trident's ` G / BTB / G ` (`L0-uwbw-r004`);
- `raiseHit` does not move, and the Storm Blade scenarios gate the merge;
- the roller excludes the trident's Loyalty and Riptide and the crossbow's Piercing (`L0-ench-r003`);
- the magnet's legendary scenarios include def #8.

## Decisions at L0 (v10)
- `L0-adr-ubfl`: the bow design. It was amended at reduce: §2 now defaults to the tagged vanilla arrow, and §3 uses `setHit`.
- `L0-adr-enrl`: the pure roller plus a gated adapter. It was amended at reduce: (a) detects an *arrival* and needs a separator from anvil results.
- `L0-adr-lgwd`: the `lgnd` widening stays within def fields plus one HUD key, so `lgnd` is **not** re-run at v11.

## Stage-11 order and release
1. The `uwbw` and `ench` probes run in parallel on checks, as distinct criterion sets.
2. The recipes.
3. Def #8, item, token, bucket recipe, RP and lang.
4. Flight.
5. Normal fire.
6. The armed hit: `setHit`, strike, Super Fire, cooldown, HUD.
7. The roller.
8. The `ench` adapter, only after `xq11`.

1.11.0 does not wait for `xq11` (`L0-xasm40`). Merges are gated by blast radius plus the `lgnd`, `sclk`, `strm` and `magn` scenarios.

## Open at L0
- **v10:**
  - `xcx32` / `xq11`: blocks the `ench` adapter only. `xq11`'s option (a) anvil line is filled in from the probe's Q4.
  - `xcx33`: the arming gesture; ships with the `xasm38` default.
- **Resolved this run:** `L0-uwbw-cx01`, `L0-ench-cx01`.
- **Carried:** `xcx28` / `xq9`, `xcx29` / `xq10`, `xcx26`, `xq7`, `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`, `lgnd-cx09`/`cx11`/`cx12`.
