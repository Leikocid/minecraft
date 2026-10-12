---
type: "concept-rule"
node_id: "L0-pear-ru03"
source_channel: "rollout"
analysis_version: 11
title: "Rule: plate identity = typeId + observed-path generation (proposed close of `xcx34`)"
aliases: ["L0-pear-ru03"]
is_a: ["rule"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1915
tags: ["v11", "pearl-rod", "rule", "plate-identity", "closes:L0-xcx34"]
level: 2
---
# Rule: plate identity = typeId + observed-path generation (proposed close of `xcx34`)

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xcx34, L0-pear-ent2.

A binding names a plate by `{dim, cell, typeId, generation}`. At teleport time the plate counts as **the same plate** only if:
- the cell's typeId equals the recorded typeId (the permutation is ignored, because `redstone_signal` changes on every press); **and**
- the world generation at that cell equals the recorded one.

**Generation bump sources.** Each bump is applied only to watched cells (`andrew:pg_watch`) and only in the plate's own dimension.

| Path | Event | Cells checked |
|---|---|---|
| A player breaks the plate or its support | `world.afterEvents.playerBreakBlock` | the broken cell and the cell above it |
| A player places a block at a watched cell (re-placing a plate) | `world.afterEvents.playerPlaceBlock` | the placed cell |
| An explosion | `world.afterEvents.blockExplode` | the exploded cell and the cell above it |
| A piston | `world.afterEvents.pistonActivate`, over `getAttachedBlocksLocations()` and the arm cell | each moved cell and the cell above it |

**Not observed** (a same-type re-place still teleports; reported limitation):
- `/setblock`, `/fill`, `/clone`;
- structure or template loads;
- other add-ons' `setType`;
- liquid flow;
- game rules that clear blocks.

**A different-type or missing plate on any path** is always caught by the typeId check.

**Scenario proof:**
- a player break and re-place of the same type → no teleport, binding cleared (positive);
- TNT next to a plate, then the same type re-placed → no teleport;
- `/setblock` to a different plate type → no teleport;
- **negative control:** an untouched plate, pressed by a mob walking over it → teleport succeeds. This proves the permutation is ignored.

**Closes `xcx34`** once Andrey accepts the limitation in the acceptance sheet.
