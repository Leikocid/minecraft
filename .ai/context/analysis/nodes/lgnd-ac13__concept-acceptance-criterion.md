---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac13"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-ac13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 646
tags: ["acceptance-criterion", "channel:build", "channel:bds", "busy"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r009", "L0-sprj"]
---
**AC-lgnd-13: busy blocks re-use, is volatile, and hands off to cooldown without a gap.** Channel: `build` (unit) + `bds`.

GIVEN `setBusy(P, "scythe_of_calamity", true)`
THEN `isReady` is false, the HUD shows the `active` key, and a Use press with the Scythe in the main hand does not call its ability.

WHEN `setBusy(false)` and `start()` are called in the same turn
THEN no tick observes `isReady == true`.

WHEN `setBusy(false)` is called alone
THEN the ability is ready at once.

AND after a server restart with busy set, `isBusy` is false.
