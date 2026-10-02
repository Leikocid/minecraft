---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a14"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a14"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 795
tags: ["is_a:acceptance-criterion", "ufo-ac-14", "channel:bds", "relates_to:L0-magn-prel", "relates_to:L0-adr-ufpc", "relates_to:L0-magn-aipd"]
level: 2
---
**UFO AC-14 (bds).**
- **GIVEN** 10 held elements (items, a golem, a minecart, a zombie) and a held player,
- **WHEN** the magnet goes off,
- **THEN**:
  - in the release tick, every element's velocity is ≈ 0;
  - from the next tick, every y decreases with no script teleport (no `teleport` calls are logged after release);
  - every element lands on the ground below its last slot;
  - the items can be picked up;
  - the zombie takes fall damage and the golem takes none.
- Release from a shoot-down and from `/andrew:ufo stop` behaves identically. Both go through the `requestMagnetOff` latch (`L0-adr-ufpc`), so the release runs at the start of the next UFO interval tick, at most one hold step after the request.

The iPad check that the cloud and the fall are visible is in `L0-magn-aipd`.
