---
type: "concept-rule"
node_id: "L0-pntr-r004"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-r004"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 917
tags: ["title:No drops, no contents, no XP", "is_a:rule", "relates_to:L0-pntr-as02", "relates_to:L0-xasm7", "source:orbital-§9", "source:orbital-§15", "ac:8"]
level: 2
---
**Rule R-pntr-4 · No drops.** Removing a column cell produces **no item entity and no experience orb**:
- Blocks are removed with `Block.setType`, never with `/setblock … destroy`, `/fill … destroy` or `createExplosion`.
- For a container, its inventory is cleared (`container.clearAll()`) *after* legendary protection and *before* `setType`. This guarantees "ordinary contents disappear" even if the engine were to spill block-entity contents on replacement (`L0-pntr-as02`).
- Spawners and vaults drop nothing and give no XP.

**Not covered by this rule (environmental, allowed):**
- Blocks *outside* the column that lose their support (a torch on the shaft wall, sand or gravel falling in, a door half) behave by vanilla rules and may drop items (`L0-pntr-as06`).
- Item entities already on the ground in the column are not touched. They just fall.

**Exception.** Legendaries are never destroyed (`L0-pntr-r005`).
