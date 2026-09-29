---
type: "concept-component"
node_id: "L0-airs"
source_channel: "rollout"
analysis_version: 2
title: "Airship (`airs`) — Дирижабль"
aliases: ["L0-airs"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 5110
tags: ["is_a:component", "structures", "airship", "worldgen", "altitude", "linked-search", "relates_to:L0-strf", "relates_to:L0-loot", "relates_to:L0-wind", "relates_to:L0-infr", "relates_to:L0-adr-strc", "relates_to:L0-adr-tmpl"]
level: 1
---
# Airship (`airs`) — Дирижабль

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-strf, L0-loot, L0-wind, L0-infr, L0-adr-strc, L0-adr-tmpl]`

**Source:** Four Structures spec §1, §2, §3, §5.1–§5.6, §6, §7, §9, §10.2 (tests 24–33), §11, §12.
**Status:** shipped in v1.2.0 (af024e4) — `src/structures/bodies/airship.ts`, template `src/structures/templates/airship.ts` → `andrew:airship`.

## Responsibility
`airs` is a *body* component on top of the `strf` contract layer, at the same level as `wind`. It supplies the Airship's `StructureDef` and hooks, and owns the two Airship-only decisions `strf` explicitly delegates to it: the parameters of its own validity profile, and the ring policy + "not above the Windmill" exclusion for the linked search (`L0-strf-d004`, `L0-strf-r002` item 5). It must not restate generation, persistence or loot rules; it references `strf-*`/`loot-*` by id.

1. **Template** (`L0-airs-e001`, `-r001`). One fixed `.mcstructure` (`L0-adr-tmpl`): 75×18×13 (`AIRSHIP_SIZE`; envelope 73×13×13, gondola 13×7×4; spec §5.1's ≈15×7×10–12 superseded by the operator 2026-09-27, AIRS-SCALE-01-AA), modern grey/light-grey concrete, glass windows, no decay (no vines/cobwebs/cracks). Lower hull = elongated oval gondola with 1 central corridor + 4 small rooms, 2 opposite doors, one ceiling lamp per room. Upper hull = fully decorative oval balloon, no chests/spawner inside it. No ground-access aid (no ladder/lift/waterfall/teleport to the ground). Only rotation varies (`L0-strf-r004`).
2. **Contents** (`-r002`). 10 fixed chests: 2 per room × 4 rooms + 2 in the corridor, filled once from the shared table (`L0-loot`, custom path only — no vanilla-table path for `airs`). Exactly 1 fixed vanilla spawner, iron-axe Vindicator, at the corridor centre (`L0-strf-r010`). No one-time persistent mobs of its own (`-r005`) — unlike `wind`, `airs` has no field guards.
3. **Independent generation** (`-r003`). 2 % per suitable Overworld chunk (`L0-strf-r002`), validated by `strf`'s `dryLand` profile at a 10 % liquid threshold (`L0-strf-as02`) plus its `altitude` profile (bottom ≥ maxSurfaceY + clearance, clearance seeded in [40,70] clamped to 40, reject on ceiling — `L0-strf-r005`, `-r003`, `-p002`). Cancel on invalid site or collision; never terraforms, never relocates, at most one per candidate chunk.
4. **Windmill-linked generation** (`-r004`, `-e002`, `-d001`). Every Windmill instance, spawn one included, calls `airs.tryLinked(parentInstance)` from its own `afterPlace` hook, exactly once (`L0-strf-p003` step 7). `airs` runs `strf.searchRing(airsDef, windmillCentre, 40, 100)`: same validation and collision rules as independent generation, plus an `airs`-specific 2D exclusion so the candidate never sits directly over the Windmill's own footprint (`L0-strf-d004`). No dedup either direction: a pre-existing independent Airship inside 100 blocks does not satisfy the linked attempt, and a linked Airship does not consume or block the chunk's own independent 2 % roll (`L0-strf-r002` item 6). If nothing in [40,100] validates, the linked Airship is simply not created — no widening past 100, no forced site prep (contrast with `wind`'s guaranteed spawn, which always forces a site).

## Inputs
- `strf` API: `registerDef`, `tryPlaceAt`, `searchRing(def, centre, rMin, rMax)`, the `dryLand`/`altitude` validity profiles, the collision detector, the instance registry, `runJob` budget.
- `wind`'s `afterPlace` hook call `airs.tryLinked(parentInstance)`, carrying the parent Windmill's centre and footprint AABB.
- Template `packs/behavior/structures/andrew/airship.mcstructure` (built by `infr`, `L0-adr-tmpl`).

## Outputs
- Placed Airships and their `InstanceRecord`s (`id = "airship"`; linked instances carry `parentInstance` for traceability only — `strf` still keys collision purely on AABB, not on the link).
- `loot.fillChest` ×10 per instance.
- Deviation-report rows (`L0-strf-r012`) for anything the probe finds affecting spawner/rotation/clearVolume placement of this template.
- Debug lines `[Scripting] [andrew] strf:airs …`.

## Not owned
Discovery queue, seeded rolls, rotation transform, generic collision heuristic, registry, tick budget, the numeric altitude/dryLand thresholds themselves (`strf`); loot table and fill algorithm (`loot`); when/how often the linked attempt is triggered (`wind` decides once, after its own init); NBT writer (`infr`).

## Key risks
- **"Run the linked check once" (§7) vs the loaded-footprint guarantee** (`L0-strf-r007`, C-12): Resolved: ring loaded through temporary ticking areas; `pending` only when loading fails (decision-l0-airs-cx01, b619e55).
- **Door placement on the two "opposite sides"** is not disambiguated by the spec (long axis vs short axis) — assumed long axis (`L0-airs-as01`).
- **Ring-candidate sampling pattern** inside [40,100] is not specified by the spec beyond the two radii — assumed (`L0-airs-as02`).
- Spawner light threshold and the iron-axe Vindicator are shared unknowns already tracked by `strf`'s probe (`L0-strf-p006` items 1, 6).
