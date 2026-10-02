---
type: "concept-rule"
node_id: "L0-strf-r009"
source_channel: "rollout"
analysis_version: 5
title: "Rule: one-time persistent mobs (\"guards\")"
aliases: ["L0-strf-r009"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1574
tags: ["is_a:rule", "mobs", "persistence", "relates_to:L0-wind", "relates_to:L0-bast", "relates_to:L0-adr-strs", "relates_to:L0-strf-as04"]
level: 2
---
# Rule: one-time persistent mobs ("guards")

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Guards are spawned **once** per instance during the `looted → guarded` step. They are the Windmill's exactly 10 field Zombie Villagers and the Bastion's 7–10 Piglins (count seeded) plus exactly 2 Piglin Brutes (§4.5, §14.5).
- Each guard is a **vanilla** entity type (`minecraft:zombie_villager_v2`, `minecraft:piglin`, `minecraft:piglin_brute`) so that vanilla behaviour stays intact: curing, conversion, AI (`L0-adr-strs`).
- On spawn, each guard gets:
  - tag `andrew:guard:<instanceId>`;
  - a non-empty `nameTag` (localised structure-guard name, or a zero-width name if the probe shows invisible names are not required), which prevents despawn;
  - per-def extras. The Windmill adds permanent, particle-less fire resistance for sun immunity, via `runCommand("effect @s fire_resistance infinite 0 true")` (`L0-strf-as04`).
- **No respawn, no top-up, no tracking loop.** Deaths are not observed (§4.5, §9, §14.5).
- Guards may wander away freely (§4.5). `strf` never teleports them back.
- A cured Zombie Villager becomes a new `minecraft:villager`. `strf` never re-applies guard properties to it (§9). If the name carries over, it is cleared in an `entitySpawn` handler only when the probe shows it carries over *and* the spec requires "ordinary". Default: leave it. Deviation noted.
- Nether piglins must not zombify: they are in the Nether, so vanilla already guarantees that. No action.
- Spawner-produced mobs are **not** guards and get no tags (§4.5 last bullet).
