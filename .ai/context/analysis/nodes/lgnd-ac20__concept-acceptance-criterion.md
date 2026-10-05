---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac20"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-ac20"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 761
tags: ["v3-delta", "destruction-policy", "containers"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r013", "L0-lgnd-r012", "L0-lgnd-cx12"]
---
**AC-lgnd-20: A vanilla container destruction spills the legendary and never loses it.** Channel: `bds`.

GIVEN a barrel holding a marked Orbital Cannon last held by P
WHEN a Survival player breaks the barrel
THEN the Cannon lies on the ground as an item entity and is watched.

WHEN instead primed vanilla TNT destroys the barrel
THEN the Cannon ends up either on the ground or back with P (`gen + 1`, `returned` message), and **never** both or neither,
AND a count over the world (every player inventory plus item entities near the spot) finds exactly one live Cannon.

A Cannon inside a **shulker-box item** is outside this AC (`cx12`).
