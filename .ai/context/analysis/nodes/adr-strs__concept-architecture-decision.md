---
type: "concept-architecture-decision"
node_id: "L0-adr-strs"
source_channel: "rollout"
analysis_version: 2
title: "ADR — Sparse instance registry + deterministic rolls; guards made persistent by tag/name, not by overriding vanilla entities"
aliases: ["L0-adr-strs"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 2748
tags: ["title:ADR — structure state, idempotency and one-time guards", "alias:L0-adr-strs", "alias:Structure persistence", "is_a:architecture-decision", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-bast", "relates_to:L0-xasm1", "see_also:fourstructuresspecruencopy"]
level: 2
---
# ADR — Sparse instance registry + deterministic rolls; guards made persistent by tag/name, not by overriding vanilla entities

**Status:** accepted 2026-09-26 (strf-p006), with a Q5 proviso. See `decision-adr-l0-adr-strs-accepted-s-ogovorkoy-q5-zond-str`.

## Context
- §6: each structure needs a durable init marker. The Windmill needs a separate "initial guards spawned" flag that deaths do not reset. Loot must be persisted by the container state. Nothing regenerates.
- Density: Warden City and Bastion are 5 %/chunk, Airship 2 %, Windmill 1 %. An explored world can reach thousands of instances. World dynamic properties have a per-key size limit, so one growing JSON blob is unsafe.
- Guards must not despawn (distance, unload, restart), must be sun-immune (Windmill), and a cured Zombie Villager must become an ordinary Villager (§4.5, §9).

## Decision
- **Rolls are deterministic** (`L0-adr-strc` §2). State is stored only where outcomes happen: dynamic properties keyed by region, `andrew:st:<dim>:<rx>:<rz>` for a 32×32-chunk region. Each value holds the evaluated-chunk bitset plus compact instance records `{id, origin, rot, placed, lootFilled, guardsSpawned}`. Before placing, the record is written with `placed=false`, then flipped once. A crash mid-place resumes; it never places twice.
- **Spawn-area Windmill** result: one key `andrew:st:spawn` with `{status, origin}`. It is written once and never retried (§4.7.13).
- **Guards:** spawned by script. Each gets the tag `andrew:guard:<instanceId>` and a name tag. Named mobs do not despawn in Bedrock. Windmill guards also get an infinite, particle-less `fire_resistance`, which prevents sun burning. Curing yields a new `minecraft:villager` entity without the tag or effect, so it is "ordinary" (§9).
- **Loot:** filled once into the placed chests. After that, the container is the state (§6). There is no loot bookkeeping beyond `lootFilled`.

## Rejected alternatives
- **Overriding vanilla `zombie_villager_v2.json` / `piglin.json` with `minecraft:persistent` and burn immunity.** It changes *every* such mob in the world, is fragile across engine updates, and conflicts with other packs.
- **Custom `andrew:field_zombie_villager` entity.** Vanilla curing and conversion would not apply, which breaks §4.5.
- **Marker entities or blocks inside the structure as the init flag.** Players can break or kill them, which would re-trigger init (C-7).

## Consequences / to verify in the `strf` probe
- Does a name tag survive unload and restart without despawn on BDS 1.26.51? Does `fire_resistance` fully prevent sun ignition damage? Does a cured villager keep the name tag? Keeping the name is acceptable; if it matters, `strf` clears it on the `entitySpawn` of the converted villager.
- The epoch-ms convention of `L0-xasm1` does not apply here: nothing is time-based.
