---
type: "concept-assumption"
node_id: "L0-ring-as02"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as02"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 828
tags: ["is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-ring-ad01", "relates_to:L0-xasm7", "relates_to:L0-ring-ent3"]
level: 2
---
**ASM-ring-02 · `doTileDrops=false` also stops container contents spilling, and nothing else**

**Assumption.** While `world.gameRules.doTileDrops` is false:
- a chest, barrel, hopper or shulker box destroyed by the explosion drops neither itself nor its contents;
- mob loot and player death drops (`doMobLoot`, `keepInventory`) are unaffected.

**Probe.** One chest with 10 cobblestone, one zombie and one SimulatedPlayer (via the `bds-gametest` pack; see memory about SimulatedPlayer visibility) inside a blast. Count the items by type afterwards.

**Impact if wrong.**
- If contents still spill, enable the container fallback in `ad01`/`ent3`. That is a small, localised change.
- If mob or player drops are also suppressed, `ad01` fails `r006`. Revert to a diff limited to destroyed-block cells, and reopen `L0-ring-cx01`.
