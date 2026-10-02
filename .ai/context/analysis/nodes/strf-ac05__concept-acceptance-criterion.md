---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 665
tags: ["is_a:acceptance-criterion", "verify:bds", "idempotency", "restart"]
level: 2
---
**AC-strf-05 · Restart and reload never duplicate anything** (`L0-strf-r008`, `-p004`; spec tests 22, 58, §11)

GIVEN a placed and initialised instance with chests, guards and a spawner, WHEN a player loots a chest, kills 3 guards, and breaks the spawner, AND the server restarts twice, AND the area is unloaded (player > 300 blocks away) and reloaded, THEN: the registry still holds exactly one record in state `done`; the looted chest is still empty; the guard count equals the initial count − 3; the spawner block is still absent; no second copy of the template exists (the chest count within AABB+32 is unchanged).
**Verify:** bds (restart harness from `infr`).
