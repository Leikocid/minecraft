---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac05"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 866
tags: ["acceptance-criterion", "katana", "channel:bds", "T11", "T12", "is_a:acceptance-criterion"]
level: 2
---
---
title: "AC-katn-05 (T11, T12, bds): one-shot fall protection"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p002", "L0-katn-r006", "L0-adr-ktfl"]
---
- **T11.** GIVEN a player teleported to an air point 15 blocks above stone (SimulatedPlayers regenerate, so damage is measured with `entityHurt`), WHEN they land, THEN no `entityHurt` with cause `fall` fires for that landing, and the fall flag map is empty afterwards.
- **T11 at height.** The same from a 20-block cap point over a 30-block drop, with health set to 4. The player survives.
- **T12.** GIVEN the flag consumed, WHEN the same player drops 10 blocks with `/tp` and then lands, THEN `entityHurt` cause `fall` fires with ≥ 6 damage.
- **Expiry.** A flag with no landing in 10 s is cleared.
- **Negative control** (in-test): with the watcher disabled, the T11 landing hurts.
