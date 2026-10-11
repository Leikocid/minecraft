---
type: "concept-acceptance-criterion"
node_id: "L0-trdt-a004"
source_channel: "rollout"
analysis_version: 9
title: "AC-trdt-004 (bds) · Throw, return, custody fallbacks"
aliases: ["L0-trdt-a004"]
is_a: ["acceptance-criterion"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1170
tags: ["above-water-trident", "bds", "throw", "custody", "C-33"]
level: 2
---
# AC-trdt-004 (bds) · Throw, return, custody fallbacks

**Links.** relates_to: L0-trdt-pthr, L0-trdt-pfbk, L0-trdt-r001, L0-xcx30.

- **Return speed.** A throw at a wall 20 blocks away: the return starts on the block hit, covers 20 blocks in 2.0 s ± 5 %, passes through the wall, and the copy is re-inserted into the selected slot.
- **Re-throw.** During the return, the thrower holds no copy and a release does nothing. The live-copy count is 1 at every tick (`r001` observer).
- **Entity hit.** A hit on a zombie triggers the return from the hit point.
- **Mid-flight fallbacks**, each ending with exactly one live copy:
  - **thrower dies:** after respawn the copy is in their inventory;
  - **thrower leaves** (sim player removed): the owed entry is redeemed on the next spawn;
  - **thrower switches dimension:** delivered directly, with a message;
  - **entity unloaded:** delivered;
  - **30 s return cap:** delivered.
- **Restart.** A restart mid-return delivers on load. The pre-restart entity is removed by `entityLoad` with a `stale` log, and no second copy appears.
- **Through `lgnd` with def #7:** the Void, chest, fire, lava and explosion scenarios pass.
