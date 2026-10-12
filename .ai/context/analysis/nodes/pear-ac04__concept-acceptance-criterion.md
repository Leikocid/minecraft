---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac04"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-04 · Owner death resets the binding; others cannot exploit a transferred bound rod (§8 bullet 4)"
aliases: ["L0-pear-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1263
tags: ["v11", "pearl-rod", "acceptance", "bds", "spec-8.4", "C-45"]
level: 2
---
# AC-pear-04 · Owner death resets the binding; others cannot exploit a transferred bound rod (§8 bullet 4)

**Relates to:** L0-pear-ru01, L0-pear-ent2, C-45.

**`bds`:** two sim players A and B, with a plate bound by A.
- **Transfer:** A drops the rod and B picks it up and uses it → a vanilla hook spawns for B, with no teleport. If B's hook lands in a plate, the record is overwritten with B as owner.
- **Death:** A dies, which bumps `andrew:life_epoch` by 1. The dropped rod is picked up by B → B's use is a vanilla cast. A, respawned, picks the rod back up → A's use is also a vanilla cast. The epoch is checked, not just the id.
- **Death in a chest:** A's rod is in a chest when A dies → after the respawn A takes it out → a vanilla cast. The binding was voided with no inventory search.
- **Death while pending:** A uses the rod and is killed before the preload ends → no teleport, the area is released, and the ticking-area count is back to its baseline.
- **Negative control:** A bound, A alive, the rod round-tripped through a chest and a ground drop → A's use teleports.
- **Note:** the dead sim player stays in `getAllPlayers` (engine fact), so tests read the epoch, not presence. Sim players regenerate, so kills use `kill` or lethal `applyDamage`.
