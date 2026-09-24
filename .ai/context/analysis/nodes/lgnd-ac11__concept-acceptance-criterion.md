---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac11"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 625
tags: ["acceptance-criterion", "channel:build", "channel:bds", "regression", "C-10"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad06", "L0-lgnd-cx04"]
---
**AC-lgnd-11: Web Sword regression after migration.** Channel: `build` + `bds`.

GIVEN the framework build
WHEN `npm test`, `bds:check` and `bds:gametest` run
THEN every existing test passes **without edits to its assertions**:
- `tests/web-sword-*.test.mjs`;
- the nine `andrew:websword_*` GameTests listed in `scripts/bds-gametest.mjs`;
- the pickaxe and autosmelt suites.
AND `grep -rnE "andrew:(ws|sc)_|andrew:hidden_until" src/` matches only `src/legendary/state.ts`,
AND `/andrew:websword give|reset` still works.
