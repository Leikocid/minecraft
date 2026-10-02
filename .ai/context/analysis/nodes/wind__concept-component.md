---
type: "concept-component"
node_id: "L0-wind"
source_channel: "rollout"
analysis_version: 5
level: 1
title: "Windmill (`wind`) — Мельница"
aliases: ["L0-wind"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 4487
tags: ["is_a:component", "structures", "windmill", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-airs", "relates_to:L0-infr", "relates_to:L0-adr-strc", "relates_to:L0-adr-strs", "relates_to:L0-adr-tmpl"]
needs_rebuild_marked_at: 2026-10-02T18:41:56.509Z
---
# Windmill (`wind`) — Мельница

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-strf, L0-loot, L0-airs, L0-infr, L0-adr-strc, L0-adr-strs, L0-adr-tmpl]`

**Source:** Four Structures spec §1, §2, §4.1–§4.7, §5.6, §6, §7, §9, §10.1 (tests 14–23, 33), §11, §12, §15.
**Status:** Implemented: `src/structures/spawn-search.ts`, `bodies/windmill.ts`; shipped in v1.2.0.

## Responsibility
`wind` is a *body* component on top of the `strf` contract layer. It supplies the Windmill's `StructureDef` and hooks, and it owns the two Windmill-only behaviours that `strf` explicitly delegates to it: the guaranteed spawn-area search with forced site preparation, and the trigger for the linked Airship. It must not restate generation, persistence or loot rules; it references `strf-*` / `loot-*` by id.

1. **Template** (`L0-wind-e001`, `-r001`, `-r002`). One fixed `.mcstructure` (`L0-adr-tmpl`): ~15×15×30 stone-lower / wood-upper abandoned mill, fixed 4-blade rotor and a wooden door on the front, 3 full floors joined by one continuous stair, fixed ~35×35 plot of mostly mature wheat, water ditches, dirt paths, trampled patches, a damaged wooden fence with gaps, vines and cobwebs that never block the main route. Only rotation varies (`L0-strf-r004`).
2. **Contents** (`-r003`). 25 fixed chests (floor 1: 5, floor 2: 8, floor 3: 12) filled once from the shared table (`L0-loot`). 3 fixed vanilla spawners: floor 1 Zombie Villager, floor 2 Zombie, floor 3 Vindicator with an iron axe (`L0-strf-r010`). Weak decorative light that keeps spawner zones dark.
3. **Field guards** (`-r004`, `-r005`, `-e003`). Exactly 10 vanilla Zombie Villagers spawned once per instance, persistent until death, sun-immune, free to wander, curable into an ordinary Villager (`L0-strf-r009`, `L0-adr-strs`).
4. **Normal generation** (`-p001`, `-r006`). 1 % per suitable Overworld dry-land chunk via `strf` discovery; `dryLand` + `flat` profiles; cancel on invalid site or collision; never terraform, never relocate.
5. **Guaranteed spawn Windmill** (`-p002`, `-p003`, `-r007`…`-r011`, `-r013`, `-e002`, `-e004`). Exactly one per world, 100 %: 5×5 chunks around the spawn chunk → nearest valid site ≤ 500 blocks → best dry site with forced preparation (natural blocks only, level ~35×35, smooth edges, fill only shallow voids). Runs once per world; the result is persisted in `andrew:st:spawn`.
6. **Linked-Airship trigger** (`-r012`). Every Windmill instance, spawn one included, asks `airs` for exactly one linked attempt (40–100 blocks) after its own init. `wind` owns *when* and *once*; `airs` owns the ring search and validity.

## Inputs
- `strf` API: `registerDef`, discovery callbacks, `tryPlaceAt(def, origin, rot, opts)`, `searchRing`, validity profiles, collision detector, instance registry, `runJob` budget.
- `world.getDefaultSpawnLocation()` (x/z) at first world load; world dynamic property `andrew:st:spawn`.
- Template `packs/behavior/structures/andrew/windmill.mcstructure` (built by `infr` from repo sources, C-8).

## Outputs
- Placed Windmills and their `InstanceRecord`s (`d = "windmill"`; spawn one has id `windmill:spawn`).
- `loot.fillChest` ×25 per instance; 10 guard entities per instance.
- One `LinkedAirships.start(parent)` call per instance, recorded as `la` + `ls`.
- Deviation-report rows (`L0-strf-r012`) for: discovery-time generation, forced-prep heuristics, ticking-area use, guard sun immunity via effect, anything the probe finds.
- Debug lines `[Scripting] [andrew] strf:wind …`.

## Not owned
Discovery queue, seeded rolls, rotation transform, collision heuristic, registry, tick budget (`strf`); loot table and fill algorithm (`loot`); linked ring search and Airship validity (`airs`); NBT writer (`infr`).

## Key risks
- **Spawn search needs far chunks loaded** before any player exists (C-12). Resolved by temporary ticking areas (`L0-wind-ad01`); unverified on BDS 1.26.51.1.
- No dry land within 500 blocks: no spawn Windmill, `status "failed", reason "no-dry-land"`, logged (decision `L0-xq4`).
- **"Check the linked Airship once"**: resolved — the ring is loaded by temporary ticking areas (decision-l0-airs-cx01).
- Forced preparation in an existing world could touch player builds; mitigated by a natural-block whitelist (`L0-wind-r008`).
- Spawner light threshold and the vanilla Vindicator axe are assumptions to confirm in the probe (`L0-wind-as06`, `as07`). On Peaceful the guard step throws and waits in the queue: the instance stays `looted`, the one spawn search is not spent (runtime.ts:232-245, measured live, CNTR-WIND-CX01-AA).
