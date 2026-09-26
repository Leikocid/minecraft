---
type: "concept-architecture-decision"
node_id: "L0-wrdn-ad02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 1362
tags: ["is_a:architecture-decision", "worldgen", "relates_to:L0-xcx4", "relates_to:L0-wrdn-as01"]
level: 2
---
**AD-wrdn-02 · Placement via post-generation script fill, not vanilla worldgen injection**

**Context:** stable `@minecraft/server` (pinned per project constraint C-2) has no supported hook to register a custom structure/jigsaw piece into actual chunk generation. The spec's own "Implementation" note (§13, mirrored in §15) directs: prefer stable APIs; if an exact rule is impossible, use the closest stable approximation and document the deviation.

**Decision:** Mini Warden City is placed the same way as Windmill/Airship/Bastion — a shared, throttled per-chunk discovery pass rolls the 5% candidate, checks suitability, and then fills the fixed template via script after the chunk is already generated and loaded. "Naturally generated" (§13.1/§13.5) is treated as a behavioral requirement on the placed Shriekers, not a placement-mechanism requirement (`L0-wrdn-as01`).

**Rejected alternative:** true vanilla structure/jigsaw registration at generation time. Rejected as infeasible with stable, non-experimental Bedrock Add-On APIs.

**Open dependency:** the discovery pass itself (whether a permanent throttled per-chunk scan is compatible with constraint C-5) is still open at the parent level — see `L0-xcx4`. This decision does not resolve that; it only fixes Mini Warden City's placement to whatever mechanism the framework (`strf`) ends up providing.
