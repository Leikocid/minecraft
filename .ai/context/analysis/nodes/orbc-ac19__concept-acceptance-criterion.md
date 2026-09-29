---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac19"
source_channel: "rollout"
analysis_version: 3
title: "AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]`"
aliases: ["L0-orbc-ac19"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1025
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-19", "relates_to:L0-orbc-r011", "relates_to:L0-orbc-p003"]
level: 2
---
# AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r011", "L0-orbc-p003", "L0-orbc-ad03"]`

**Unload run**
- **GIVEN** P fires at a target, and in the next tick P and every other player are teleported more than 300 blocks away, so the area unloads.
- **WHEN** 200 ticks pass and P returns.
- **THEN**
  - no `onDetonate` was ever called for that attack;
  - after the chunk reloads, no `andrew:orbital_charge` entity exists there (the `entityLoad` sweep);
  - the target block is intact;
  - P's cooldown was not cleared early.

**Restart run** (BDS `stop`, then restart on the checks instance on port 19136)
- **GIVEN** P fires, and the server stops within 10 ticks.
- **THEN**, after the restart:
  - no charge entity exists in the loaded area;
  - no late detonation happens in the next 100 ticks;
  - P's `andrew:cd_orbital_cannon` deadline equals its pre-stop value, so the cooldown persisted.
