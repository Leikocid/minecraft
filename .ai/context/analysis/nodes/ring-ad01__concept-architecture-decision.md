---
type: "concept-architecture-decision"
node_id: "L0-ring-ad01"
source_channel: "rollout"
analysis_version: 3
title: "AD-ring-01 · Suppress block drops with a scoped `doTileDrops` toggle, not a snapshot-diff of item entities"
aliases: ["L0-ring-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 2149
tags: ["is_a:architecture-decision", "drops", "status:proposed", "relates_to:L0-adr-ochg", "relates_to:L0-xasm7", "relates_to:L0-ring-r006", "relates_to:L0-ring-ent3", "relates_to:L0-ring-cx01", "relates_to:L0-ring-as01", "relates_to:L0-ring-as02"]
level: 2
---
# AD-ring-01 · Suppress block drops with a scoped `doTileDrops` toggle, not a snapshot-diff of item entities

**Status:** proposed. It amends `L0-adr-ochg` §3 (see `L0-ring-cx01`).

**Context.**
- Bedrock explosions drop broken blocks as items (`as01`). One RMB can break several thousand blocks, and 3 players at once multiply that.
- `L0-adr-ochg` §3 snapshots the item ids in the blast AABB and deletes *new* non-legendary items after the blast. That also deletes mob loot and the death drops of players killed in the same blast. It also still creates thousands of entities before deleting them (C-19, RG-3).

**Decision.**
1. Around each batch of explosions, run this synchronously in `try/finally`:
   - `prev = world.gameRules.doTileDrops`;
   - set it to `false`;
   - run the `createExplosion` calls;
   - restore `prev`.
   The rule is never toggled across a tick, an `await` or a `system.run` (`ent3`).
2. Container contents are covered too, if `doTileDrops` false also stops container spill (`as02`). Otherwise enable the **container fallback**:
   - snapshot the non-legendary contents of containers in the AABB;
   - after the blast, delete only new items of those types, within 1 block of a container cell that was destroyed, up to the snapshot count.
3. Legendaries are moved out beforehand (`r008`). The fallback skips them as well.

**Rejected.**
- **Snapshot-diff over the whole AABB** (`adr-ochg` §3): it deletes player death drops and mob loot, and creates and then removes ~10³ entities per attack.
- **Pre-removing the blast blocks with `setType(air)`**, then `breaksBlocks:false`: it re-implements TNT resistance and ray occlusion by hand, and loses the engine crater shape.
- **Killing items on `entitySpawn` by position**: it is asynchronous, it races with death drops, and it cannot tell a block drop from a mob drop.

**Consequences.**
- One gamerule write pair per queue step (≤ 20/s).
- A `gameRuleChange` after-event fires. Nothing in this add-on listens to it.
- If a probe shows that a client chat or toast is broadcast on each change, fall back to the container-fallback-style diff limited to destroyed-block cells.
