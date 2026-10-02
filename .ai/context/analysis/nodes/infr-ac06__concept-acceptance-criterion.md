---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac06"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 622
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-infr-as01"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-as01"]`

GIVEN a built add-on plus the `packs/gametest` beta pack, WHEN `npm run bds:gametest` runs, THEN a `SimulatedPlayer` completes the registered scenario on a dedicated `gametest` world with the Beta APIs experiment enabled, without a human or an iPad, and the run's log-derived verdict is PASS/FAIL with exit code 0/1 accordingly. [src: scripts/bds-gametest.mjs; decision-q-012]

Note: see `L0-infr-as01` — this criterion is treated as an additional verification lane, not one of Stage 0's five original closing criteria.
