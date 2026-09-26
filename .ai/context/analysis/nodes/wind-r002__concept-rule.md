---
type: "concept-rule"
node_id: "L0-wind-r002"
source_channel: "rollout"
analysis_version: 2
title: "Rule: decay (vines, cobwebs) never blocks the door, the stairs or any chest"
aliases: ["L0-wind-r002"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1004
tags: ["is_a:rule", "template", "decay", "reachability", "relates_to:L0-wind-r001", "relates_to:L0-wind-ac10"]
level: 2
---
# Rule: decay (vines, cobwebs) never blocks the door, the stairs or any chest

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-r001, L0-wind-e001, L0-wind-ac10]`

**Source:** §4.2, §4.4 bullet 4, test 21.

- Vines on part of the exterior walls and inside. Cobwebs in corners, under ceilings, near beams, **most visible on floor 3**. Fields near the building: a few cobwebs/vines.
- **Route cells** = a 1-wide, 2-high walkable path from outside the door through each floor and the stairs to the front face of each of the 25 chests. No cobweb, vine, or solid block may occupy a route cell, and each chest's lid cell (the block above the chest) must be air.
- Checked at build time: the template unit test runs a BFS over the NBT (cobweb = blocked, vine = passable but disallowed on route cells) from the outside door cell, and asserts all 25 chest-access cells and the top stair landing are reachable.
- Fields: cobwebs never on path cells between the fence gaps and the door.
