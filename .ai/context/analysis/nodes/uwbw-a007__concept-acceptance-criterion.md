---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a007"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-007 (bds) · A restart keeps uniqueness and recovery; the charge persists"
aliases: ["L0-uwbw-a007"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 892
tags: ["v10", "underwater-bow", "bds", "legendary", "restart", "§5-7"]
level: 2
---
# AC-uwbw-007 (bds) · A restart keeps uniqueness and recovery; the charge persists

**Links.** relates_to: L0-lgnd, L0-uwbw-earm. Spec §5 bullet 7.

- **Uniqueness.** GIVEN the bow was crafted, WHEN BDS restarts, THEN the craft flag still blocks a second craft (refund path).
- **Death.** GIVEN the owner dies with the bow, THEN it returns on respawn.
- **Void.** GIVEN the bow item is dropped into the Void, THEN it returns to its last owner.
- **Destruction.** Lava, fire and cactus do not destroy it.
- **Pending recovery.** A pending recovery survives a restart and is delivered at the next join.
- **The charge.** GIVEN `ub:armed` is true, WHEN the player logs out and back in, and after a restart, THEN it is still armed and the HUD reads armed.
- **Magnet.** The `magn` legendary scenarios include def #8.
- **Negative control.** A Creative copy dropped into the Void is not recovered.
