---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac08"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 746
tags: ["title:AC-7/AC-10 (ipad) · Looks like a blasted shaft, instant, one boom, ~1 s wave", "is_a:acceptance-criterion", "channel:ipad", "orbital-ac:7", "orbital-ac:10", "manual", "relates_to:L0-pntr-p003", "relates_to:L0-pntr-ad02"]
level: 2
---
**GIVEN** the release build on the production BDS (port 19132), joined from the iPad, in Survival with the Cannon.
**WHEN** the tester fires LMB at grass, then at an ocean floor, then in the Nether.
**THEN**, judged by the tester on the device (not by a gametest):
- the shaft appears in the same instant as the boom, with no visible top-to-bottom "unzipping";
- the walls look ragged, not a clean square;
- exactly one loud explosion sound is heard;
- a particle wave visibly runs down the shaft for about 1 s;
- ocean water pours into the shaft;
- the owner standing nearby takes no hit.

This criterion must be closed by the human tester only. Orchestrator auto-verification does not count (memory: orchestrator auto-verifies manual criteria).
