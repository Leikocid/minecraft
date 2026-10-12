---
type: "concept-component"
node_id: "L0-pear"
source_channel: "rollout"
analysis_version: 11
title: "Pearl Rod («Перовый сокровятель») — component"
aliases: ["L0-pear"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 3893
tags: ["v11", "pearl-rod", "teleport", "component"]
level: 1
---
# Pearl Rod («Перовый сокровятель») — component

**Is a:** component. **Part of:** L0. **Relates to:** L0-adr-prbd, L0-xasm41, L0-xasm42, L0-xasm43, L0-xasm44, L0-xcx34, L0-xq12, L0-lgnd (craftgate swap only), L0-strc (ticking areas), L0-uwbw (recipe collisions, fixed-cell patterns), L0-ench (fishing-rod eligibility).
**Sources:** spec v3 §6–§8 (`underwaterbowfinalspecv3ruen-part-3` … `part-5`); constraints C-16, C-40, C-44, C-45, C-46.

## Responsibility
A **non-legendary** utility item (C-46). It looks and fishes like a vanilla fishing rod. When its bobber lands in a pressure plate it is bound to that plate. The binder's next use teleports them to a safe spot at or beside the plate, once, and only after the destination has been checked (C-44).

## Shape (per `L0-adr-prbd`)
- **Item:** a marked vanilla `minecraft:fishing_rod` (entity `L0-pear-ent1`). It is crafted as `andrew:pearl_rod_token` and swapped after the craft (process `L0-pear-pr01`).
- **Binding:** item-borne dynamic properties (`L0-pear-ent1`), detected by polling the hook in the shared interval (process `L0-pear-pr02`, `xasm41`).
- **Validity:** owner id + owner life epoch (C-45) + plate typeId + plate generation (`L0-pear-ent2`, rule `L0-pear-ru03`).
- **Bound use:** cancel first, then preload, validate, find a safe spot, teleport and read back (process `L0-pear-pr03`, rules `L0-pear-ru01` and `L0-pear-ru02`).

## Inputs
- Player events: `itemUse` (before and after), `entitySpawn` of `minecraft:fishing_hook`, `playerInventoryItemChange` (token swap), `entityDie` (epoch), and `playerBreakBlock` / `playerPlaceBlock` / `blockExplode` / `pistonActivate` (plate generation).
- The world: block reads at the hook cell and at the destination; `isChunkLoaded`; ticking areas from the world-wide budget (`L0-pear-ad01`, adopted at L0 as `L0-adr-prta`).

## Outputs
- Rod dynamic properties and lore; the player property `andrew:life_epoch`; world properties for plate generations.
- A teleport (with `dimension`) and an actionbar or chat message for every outcome.

## Seams
- `src/legendary/craftgate.ts`: a token-swap helper is extracted from it. There is no gate, refund, world flag or retention, and `lgnd` scenarios stay green.
- **Ticking areas:** **world-wide cap of 10**, already drawn on by `spawn-search` (`andrew_find_`, pool 5) and `search-ring` (`andrew_ring_<d>`, 4 per dimension). See `L0-pear-cx01` and `L0-pear-ad01`.
- **Shared `runInterval`:** no `runJob`, and no per-rod interval.

## Probe first (checks BDS, 19136; never 19132)
Run distinct criterion set `probe_pearl_*` (AC `L0-pear-ac07`):
- the hook's events and its resting height per plate type;
- whether the hook's owner is readable;
- whether `hook.remove()` resets the client's cast pose (iPad);
- **whether a cancelled `beforeEvents.itemUse` casts nothing** (`L0-pear-cx02`);
- whether durability can be written back to 0;
- whether dynamic properties survive a reel, a rename, a chest, a drop and a restart;
- ticking-area loads at 10 K, 100 K and 1 M blocks, plus the Nether and the End (`probe_tickingarea_load`);
- whether a cross-dimension teleport works;
- whether the fixed 3×3 recipe pattern is enforced.

Four rules depend on these results (decomposition plan).

## Acceptance
Six §8 bullets, each with a `bds` scenario and a negative control (`L0-pear-ac01` … `ac06`), plus the probe (`ac07`). The `ipad` checks are the cast pose after a retract; the name, lore and icon; the recipe book; how the arrival feels; and the failure messages.

## Reported limitations (C-16)
- A same-type plate replaced through an unobserved path (commands, structures, liquids, other add-ons) still teleports (`xcx34`, `L0-pear-ru03`).
- The input rod's enchantments are lost at the craft (`xasm43`).
- An anvil rename or combine may drop the mark (to be confirmed by the probe).
- The name is one fixed string and does not follow the client's language (`xq12` item 2).
- Used as a crafting ingredient (Orbital Cannon, carrot-on-a-stick, warped-fungus-on-a-stick, its own recipe), it is consumed as a plain rod. A craftgate refund returns a plain fishing rod (`L0-xasm45`).
