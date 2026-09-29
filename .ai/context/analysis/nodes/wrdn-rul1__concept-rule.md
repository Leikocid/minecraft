---
type: "concept-rule"
node_id: "L0-wrdn-rul1"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-rul1"]
is_a: ["rule"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 1027
tags: ["is_a:rule", "worldgen", "candidate-generation"]
level: 2
---
**Rule — Generation eligibility & candidate resolution**

- Dimension: Overworld only.
- Candidate chance: 5% per suitable chunk (`L0-strf-r001`).
- If the 5% roll succeeds but the site is unsuitable, the candidate is **cancelled outright** — it is never relocated to a neighboring chunk (`L0-strf-r002`, with `pending` deferral per §2).
- The structure never generates where the surface point directly above it is ocean, river, or another large body of water; that surface point must be land (`dryLand`, `L0-strf-p002`).
- The structure's top sits at a random Y within **−35…−45**, chosen independently per instance (body value; profile `depth`, `L0-strf-p002`).
- A candidate is cancelled if it physically intersects any already-detected vanilla or custom structure, including a real Ancient City. Existing structures are never damaged to make room for Mini Warden City (`L0-strf-r006`).
