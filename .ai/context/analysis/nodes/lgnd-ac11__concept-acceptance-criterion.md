---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac11"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 920
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad07", "L0-lgnd-ad08", "L0-adr-lgnd"]
---
**AC-lgnd-11: Regression gate for the v3 framework change.** Channel: `build` + `bds`.

GIVEN the v3 build
WHEN `npm test`, `bds:check` and `bds:gametest` run
THEN every existing test passes **without edits to its assertions**:
- `tests/web-sword-*.test.mjs`;
- the `andrew:websword_*` and Scythe GameTests;
- the pickaxe and autosmelt suites.

Harness changes are allowed (`L0-adr-lgnd`, cx04 reading), for example a simulated craft now inserting the craft token.

AND `grep -rnE "andrew:(ws|sc|oc)_|andrew:(cd|busy)_|andrew:hidden_until" src/` matches only files in `src/legendary/`,
AND `/andrew:websword`, `/andrew:scythe` and `/andrew:orbital` `give|reset` all work,
AND a node test asserts that `itemId`, `keyPrefix`, `abilityKey`, `command` and `craftTokenId` are unique across `LEGENDARIES`.
