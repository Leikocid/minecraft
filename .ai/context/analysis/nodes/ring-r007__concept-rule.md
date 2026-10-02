---
type: "concept-rule"
node_id: "L0-ring-r007"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r007"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1109
tags: ["is_a:rule", "underwater", "relates_to:L0-ring-ad03", "relates_to:L0-ring-as04", "relates_to:L0-ring-ac15"]
level: 2
---
**R-ring-007 · Underwater blasts damage entities but change no blocks** (Orbital §10; AC-15)

- **Definition.** A blast is *underwater* when its centre cell (`r010`) is at blast time one of:
  - `minecraft:water` or `minecraft:flowing_water`;
  - a waterlogged block (`Block.isWaterlogged`).
- Lava, bubble columns over soul sand or magma, and cauldrons do **not** count.
- **Underwater blasts** use `breaksBlocks: false, allowUnderwater: true` (`ad03`):
  - no block in the AABB changes;
  - entities in range take normal TNT damage and knockback;
  - the sound and particles still play.
- **Per blast, not per attack.** In one RMB, a ring that crosses a shoreline craters the land and leaves the seabed intact.
- Classification happens at blast time, so a blast queued behind a neighbour that let water into a crater sees the current water state. Water flows over ticks, so within one queue step the result is the terrain as it stands.

**Rationale:** vanilla TNT in water does not break blocks but still hurts. The script decides explicitly, so the result does not depend on the undocumented `allowUnderwater` semantics (`as04`).
