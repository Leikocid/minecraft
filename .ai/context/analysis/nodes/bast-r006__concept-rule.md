---
type: "concept-rule"
node_id: "L0-bast-r006"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-r006"]
is_a: ["rule"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 659
tags: ["is_a:rule", "persistence", "idempotency"]
level: 2
---
**Rule:** After generation, every ordinary block, the lava, the chests and the Gold Blocks are normal mutable world state, minable/placeable under standard vanilla rules for those block types. Nothing that is destroyed, looted, or altered by a player — including killed guards — is ever restored, regardless of chunk unload/reload or server restart. Initializing (or re-initializing on load) a given instance must be idempotent: it must never create a second set of chests, Gold Blocks, or mobs for the same bastion. Cite: `L0-strf-r008`, `L0-strf-p004`, `L0-strf-r009`, `L0-adr-strs`.

**Rationale:** Matches the family-wide no-regeneration and idempotent-init invariants shared by all four structures.

**Source:** §14.6, §15.
