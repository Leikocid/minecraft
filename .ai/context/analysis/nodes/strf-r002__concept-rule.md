---
type: "concept-rule"
node_id: "L0-strf-r002"
source_channel: "rollout"
analysis_version: 5
title: "Rule: one roll per (chunk, structure), no relocation, and a fixed priority order within a chunk"
aliases: ["L0-strf-r002"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1471
tags: ["is_a:rule", "worldgen", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast"]
level: 2
---
# Rule: one roll per (chunk, structure), no relocation, and a fixed priority order within a chunk

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

1. Each chunk of the matching dimension gets exactly one roll per `StructureDef`, with chances from one config table: Windmill 0.01, Airship 0.02, Warden City 0.05, Bastion 0.05 (§4.6, §5.5, §13.2, §14.2; `L0-xq2`).
2. A successful roll with an invalid site is **cancelled**. It is not moved to a neighbouring chunk or retried later with a different origin. *Exception:* `pending` (footprint not loaded) is a deferral, not a relocation. The same origin and rotation are retried.
3. **At most one instance of a given structure per candidate chunk** (§4.6, §5.5). This follows from (1).
4. **Order within a chunk (Overworld):** Windmill → Airship → Warden City. Later candidates see earlier ones in the registry and are cancelled if their AABBs overlap (`L0-strf-r006`). Different structures on the same chunk are allowed when they do not overlap (e.g. an underground Warden City beneath a surface Windmill).
5. **Relocating searches** are only these, exposed as `strf` API calls:
   - the guaranteed spawn Windmill (`wind`, §4.7);
   - the Windmill-linked Airship (`airs`, §5.6, hard ring 40–100).
   Both use the same validation and collision rules. They differ only in how origins are generated.
6. A linked Airship does not count as the chunk's independent Airship, and it does not consume that chunk's roll (§5.6).
