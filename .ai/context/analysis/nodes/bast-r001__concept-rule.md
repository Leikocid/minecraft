---
type: "concept-rule"
node_id: "L0-bast-r001"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-r001"]
is_a: ["rule"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 750
tags: ["is_a:rule", "generation", "candidate"]
level: 2
---
**Rule:** A Nether chunk becomes a Mini Bastion candidate with 5% probability, evaluated once per suitable chunk. A successful roll is discarded (not relocated) if: (a) the site is over a lava ocean, (b) the site lacks solid supporting ground for the template, or (c) the site physically intersects any other detected structure — custom (Windmill, Airship, Mini Warden City) or vanilla (including a genuine Bastion Remnant). Existing structures are never damaged or removed to accommodate a Mini Bastion candidate. All Nether biomes are eligible provided the physical site passes these checks.

**Rationale:** Keeps generation rare and predictable, and guarantees no other content is ever destroyed by Mini Bastion placement.

**Source:** §14.2, §15.
