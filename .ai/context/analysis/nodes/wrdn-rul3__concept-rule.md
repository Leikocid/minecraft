---
type: "concept-rule"
node_id: "L0-wrdn-rul3"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-rul3"]
is_a: ["rule"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 871
tags: ["is_a:rule", "surface-marker"]
level: 2
---
**Rule — Surface sculk marker alignment**

- An irregular ~5×5 patch of Sculk/Sculk Vein is generated directly above the city's center, on the actual world surface.
- The marker is a locator only: it must never form a ready-made mineshaft, ladder, or vertical tunnel.
- The city's interior geometry and the marker's placement must be co-designed (and must rotate together with the template) so that a player who starts digging straight down from the marker's center is **guaranteed** to break into the structure.
- The marker may only be placed on valid land, and it must never be used as justification to destroy another generated structure that happens to be nearby.

Rationale: gives players a reliable, lightly-telegraphed way to find the buried city without literally handing them a tunnel — mirrors how real Ancient Cities are locatable via generated terrain cues.
