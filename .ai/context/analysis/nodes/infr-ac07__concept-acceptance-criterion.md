---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac07"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-infr-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 381
tags: ["is_a:acceptance-criterion", "channel:bds"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `docker/bds/compose.yaml`'s `VERSION` and `scripts/targets.mjs`'s `BDS_VERSION` disagree, WHEN `npm run bds:check` or `npm run bds:up` is run, THEN `assertComposePinsVersion()` fails the run immediately, before any Docker or build work happens. [src: scripts/bds-lib.mjs assertComposePinsVersion; C-2/C-3]
