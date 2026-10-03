---
type: "concept-rule"
node_id: "L0-orbc-r003"
source_channel: "rollout"
analysis_version: 5
title: "Rule · The target is a block within 25 blocks, on any face"
aliases: ["L0-orbc-r003"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1062
tags: ["is_a:rule", "relates_to:L0-orbc-ad01", "relates_to:L0-xcx8", "targeting"]
level: 2
---
# Rule · The target is a block within 25 blocks, on any face

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ad01", "L0-xcx8", "L0-orbc-ent2"]`

- The target is the **block that was hit**, on top, bottom or side. It is not the adjacent block. Its (x, z) column is the attack's column. Its Y is the reference for spawn height (`r007`).
- The range is measured from the eye to the nearest point of the block (`distanceToBlock`, target.ts:29): ≤ 25; ray `maxDistance: 25`.
- Blocks that do not count as targets:
  - air;
  - liquids (`includeLiquidBlocks: false`);
  - passable blocks such as grass, flowers, torches and snow layer (`includePassableBlocks: false`). The ray passes through these to the block behind them.
- Entities in the way do not block the ray. `getBlockFromViewDirection` ignores entities.
- Both modes use the same rule and the same distance, **subject to `L0-xcx8`**: until `L0-xq5` is answered, LMB is physically limited to the vanilla reach.
- **No marker.** There is no particle, outline or HUD hint. The vanilla highlight is the only aim cue (§6).

Source: Orbital §6.
