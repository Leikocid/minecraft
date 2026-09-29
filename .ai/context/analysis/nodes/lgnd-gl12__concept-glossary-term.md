---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl12"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-gl12"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 641
tags: ["v3-delta"]
level: 2
---
**Destruction policy tiers: prevent / spill / return**

How the framework meets "a legendary is not destroyed" (Orbital §5) within the stable API. The first tier that applies wins:
1. **Prevent:** destruction this add-on causes, such as the Cannon, runs the protection pass first, so the item stays in the world.
2. **Spill:** vanilla destruction of a container drops its contents, including the legendary.
3. **Return:** when the engine destroys the item entity (fire, lava, cactus, vanilla TNT, despawn, the Void), the item is re-issued to the last holder with `gen + 1`. This tier is the documented deviation (C-16).

See `L0-lgnd-r012`.
