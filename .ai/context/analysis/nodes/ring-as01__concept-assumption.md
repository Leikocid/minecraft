---
type: "concept-assumption"
node_id: "L0-ring-as01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as01"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 695
tags: ["is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-ring-ad01", "relates_to:L0-adr-ochg"]
level: 2
---
**ASM-ring-01 · Script explosions drop the blocks they break**

**Assumption.** A `createExplosion(…, 4, {breaksBlocks:true})` on BDS 1.26.x drops the broken blocks as item entities, as vanilla Bedrock TNT does (effectively 100% yield). Suppression is therefore required. This is the probe item named in `L0-adr-ochg`.

**Probe.** Explode on a 9×9×5 stone/dirt pad with `doTileDrops` true, then count `minecraft:item` within ±8.

**Impact if wrong.**
- If script explosions drop nothing by themselves, `ad01` becomes dead code: remove the toggle and keep only the container check.
- If they drop at 1/power probability (Java-like), suppression is still needed, but the load in RG-4 is 4× lower.
