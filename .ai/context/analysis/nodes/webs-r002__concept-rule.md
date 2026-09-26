---
type: "concept-rule"
node_id: "L0-webs-r002"
source_channel: "rollout"
analysis_version: 2
level: 2
aliases: ["L0-webs-r002"]
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 904
tags: ["rule", "targeting", "reach"]
---
---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent2", "L0-webs-p001"]
---
**Rule (R-webs-002 — Target resolution & reach, Q-011).** The ability uses ordinary survival interaction/melee reach — no artificial long-range ray. Reach limit: blocks up to 5, entities up to 3. A block hit resolves the center cell as the air cell immediately adjacent to the struck face (not the struck block itself). An entity hit (including the owner's own feet, if in range — self-entombment is an accepted feature) resolves the center cell as that entity's foot cell; if a block and an entity are both hittable at the same reach, the entity wins. If the ray reaches an opaque block first, that is the effective target point — never attack through walls. If nothing is hit within reach: no target; the ability does not fire and the cooldown is not spent.

**Rationale.** Spec §5/§12; closed by decision Q-011.
