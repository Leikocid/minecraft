---
title: Project Summary
type: analysis
generated_at: "2026-10-12T18:21:49.826Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 650
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

---
title: "Project Overview: «Andrew» Minecraft Bedrock add-on (v11: the Pearl Rod, after the deep-dive)"
aliases: ["L0", "Project Overview"]
is_a: ["system-overview"]
part_of: []
relates_to: ["L0-pear", "L0-uwbw", "L0-ench", "L0-lgnd", "L0-strc", "L0-orbc", "L0-adr-prbd", "L0-adr-prta", "L0-adr-prcn", "L0-pear-ad01", "L0-pear-cx01", "L0-pear-cx02", "L0-adr-ubfl", "L0-adr-enrl", "L0-xcx34", "L0-xcx32", "L0-xcx33", "L0-xq11", "L0-xq12", "L0-xasm41", "L0-xasm42", "L0-xasm43", "L0-xasm44", "L0-xasm45"]
requires: ["L0-lgnd", "L0-uwbw", "L0-ench", "L0-strc"]
see_also: ["underwaterbowfinalspecv3ruen-part-1", "underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5", "constraints"]
governs_files: ["src/pearlrod/", "src/legendary/craftgate.ts", "src/structures/spawn-search.ts", "src/structures/search-ring.ts", "src/structures/runtime.ts", "packs/behavior/recipes/", "packs/behavior/items/"]
supersedes: ["L0@v10"]
---
# Project Overview: «Andrew» Minecraft Bedrock add-on (v11)

**What it is.** A Minecraft **Bedrock** PvP add-on: one BP and one RP, namespace `andrew:`, shipped as `dist/andrew.mcaddon`.
- **Version:** **1.10.0** as built. Seven legendaries have shipped and been accepted (the trident's acceptance is `2f12a73`). v10 (the bow, the recipes and the enchanting probe) and v11 (the Pearl Rod) target **1.11.x**.
- **API:** stable Script API only (`@minecraft/server` 2.10.0 on BDS 1.26.51.1, C-2).
- **Where it runs:** played on an iPad. Verified on BDS in Docker: production 19132, QA 19134, checks 19136. Only the iPad proves what renders.

| Family | Members | State (2026-10-12) |
|---|---|---|
| Legendary weapons | `ws`, `sc`, `oc`, `dk`, `sk`, `sb`, `tr`, **Underwater Bow `ub` (`L0-uwbw`)** | Seven have shipped and been accepted. The bow is analysed (v10). |
| Vanilla recipes | Elytra and Totem have shipped. Mace and Firework Rocket ×3 (`L0-uwbw`) are analysed. | |
| Vanilla systems | Enchanting table: a rare pool and level rules (`L0-ench`) | Analysed. Feasibility comes first, gated on `xq11`. |
| **Utility items** | **Pearl Rod «Перовый сокровятель» (`L0-pear`)** | **Analysed in v11. It is the first non-legendary scripted item, and it is probe-gated (`L0-pear-ac07`).** |
| World structures | Windmill, Warden City, Bastion, Airship (`L0-strc`) | Shipped in 1.2.0. `xcx12` is owed. **v11 adds a ticking-area refactor (`L0-adr-prta`).** |
| World events | UFO Magnet (`ufoc`, `sauc`, `magn`) | Shipped. |

## What v11 changed
The client re-issued the v2 spec as the **"FINAL Specification v3"**:
- §1–§5 are identical to v2, so `uwbw` and `ench` stand as analysed at v10.
- §6–§8 add one item, the Pearl Rod, which this run analysed as `L0-pear`.

## The Pearl Rod, as the deep-dive shaped it
The Pearl Rod fishes like a vanilla rod. When its bobber lands in any vanilla pressure plate, the rod remembers the plate and its binder. The binder's next use teleports them there, once, and only after the destination has been checked.
- **Item (`L0-adr-prbd`, `L0-pear-pr01`).** A marked vanilla `minecraft:fishing_rod`.
  - The fixed 3×3 recipe (pearl over rod) yields `andrew:pearl_rod_token`.
  - A swap helper extracted from the craftgate replaces the token with the marked rod. There is no gate, no refund and no retention.
  - Durability is held at 0, and crafting is unlimited (`L0-pear-ru04`).
- **Binding (`L0-pear-pr02`, `L0-pear-ent1`).**
  - The hook is polled in the one shared interval.
  - When the hook is in a plate cell (`xasm41`), the rod stores `{dim, x, y, z, plate typeId, generation, owner id, owner life epoch}` and the hook is removed.
- **Validity (`L0-pear-ru01`, `L0-pear-ru03`, `L0-pear-ent2`).**
  - The binding is honoured only for its owner, and only at the epoch it recorded. A death bumps the epoch (C-45).
  - The plate must keep its typeId and its generation. Observed break, place, explode and piston paths bump the generation. Unobserved replacements remain `xcx34`.
- **Bound use (`L0-pear-pr03`, `L0-pear-ru02`).** Trigger, preload, re-validate, safe spot (P, then 8 neighbours), teleport with `dimension`, read back.
  - It clears on success or on a dead plate.
  - It keeps the binding and reports on a timeout, a full budget, a refused dimension, no safe spot, or a mismatched read-back (C-44).

## How the components meet (cross-component view)
```
lgnd ── craftgate: token-swap helper extracted (no gate) ──► pear token → marked vanilla rod
     ── defForToken / defForStack / isLegendaryStack: never match the token or the rod (invariant, unit test L0-pear-ac01)
     ── ORBITAL_CANNON recipe + refund take/return minecraft:fishing_rod ── a Pearl Rod is consumed as a plain rod (L0-xasm45)
strc ── NEW: one world-wide ticking-area allocator (L0-adr-prta)
          clients: spawn-search (andrew_find_), search-ring (andrew_ring_<d>), pear (1 reserved slot + borrow)
pear ── trigger: cancel OR remove-at-+0, fixed by the probe (L0-adr-prcn) ──► start(): preload ─ validate ─ safe spot ─ teleport ─ read back
     ── entityDie(player) ──► andrew:life_epoch++ ; one shared runInterval, no runJob
ench ── sees the Pearl Rod as minecraft:fishing_rod (nothing extra)
recipes ── C-40 collision test over every packs/behavior/recipes/* shape + vanilla rod recipes
```
The Pearl Rod is the only v11 component, but it reaches into three others:
- **`lgnd`:** a refactor of `craftgate.ts`, which must keep the `lgnd` scenarios green.
- **`strc`:** a refactor of the ticking-area code, which must keep the broad tier plus the `find`/`ring` scenarios green.
- **`orbc`:** an incidental recipe overlap, accepted as a limitation.

The board rejects cross-epic dependencies, so the `strc` allocator must land in the same epic as the Pearl Rod, before its preload.

## Invariants (plan) — checked at reduce
| Invariant | Verdict |
|---|---|
| The preload shares the `spawn-search` pool, and neither starves the other | **Met, with a wider scope.** One allocator covers every product area, with a reserved Pearl Rod slot (`L0-adr-prta`). The engine refuses adds rather than evicting areas. |
| A marked rod never satisfies `lgnd` lookups | **Met** by type: no legendary is a `minecraft:fishing_rod`. The plan's `defForItem` is not a function name observed in `registry.ts` at reduce. The ACs now name `defForToken`, `defForStack` and `isLegendaryStack`. |

## Decisions at L0 (v11)
- `L0-adr-prbd`: the Pearl Rod's design. §5 is amended by both decisions below.
- `L0-adr-prta`: the world-wide ticking-area allocator. Resolves `L0-pear-cx01`.
- `L0-adr-prcn`: the bound-use trigger is cancel or remove, chosen by the probe. Resolves `L0-pear-cx02`.
- Carried from v10: `L0-adr-ubfl`, `L0-adr-enrl`, `L0-adr-lgwd`.

## Open at L0
- **v11:**
  - `xcx34`: a same-type plate replaced through an unobserved path still teleports. This ships as a reported limitation.
  - `xq12`: "ender feather" vs the Ender Pearl, the display name, and cross-dimension acceptance.
  - The probe `L0-pear-ac07` gates four rules and the trigger branch.
- **Carried:** `xcx32` / `xq11`, `xcx33`, `xcx28` / `xq9`, `xcx29` / `xq10`, `xcx26`, `xq7`, `xcx3`, `xcx5`–`xcx8`, `xcx12`–`xcx14`, `lgnd-cx09` / `cx11` / `cx12`.


## Statistics

- **Total artifacts:** 404
- **concept-aggregate:** 21 (67 KB)
- **concept-atomic:** 140 (219 KB)
- **concept-special:** 23 (40 KB)
- **raw:** 46 (183 KB)
- **other:** 47 (328 KB)
- **decision:** 127 (85 KB)

### By level

- L0: 5 artifacts
- L1: 61 artifacts
- L2: 105 artifacts


_Analysis version: 11_
