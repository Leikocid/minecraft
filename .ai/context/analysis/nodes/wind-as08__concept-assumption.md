---
type: "concept-assumption"
node_id: "L0-wind-as08"
source_channel: "rollout"
analysis_version: 2
title: "Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful"
aliases: ["L0-wind-as08"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 754
tags: ["is_a:assumption", "CAN_ASSUME", "guards", "difficulty", "relates_to:L0-wind-r004"]
level: 2
---
# Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r004, L0-strf-p004]`

- Bedrock removes hostile mobs on Peaceful; spawning 10 Zombie Villagers then would kill the one-time guards instantly and mark them "spawned".
- Rule: if `world.getDifficulty() === Peaceful` at `looted → guarded`, the instance stays `looted` and retries on the next discovery visit. The linked Airship waits too.
- Guards that already exist when a player switches to Peaceful are removed by vanilla and never restored (spec: no top-up).
- **Impact if wrong:** low. The spec is silent; a client may prefer "spawn anyway". The iPad world default is Normal.
