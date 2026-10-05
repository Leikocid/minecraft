---
type: "concept-rule"
node_id: "L0-sclk-r003"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r003"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 954
tags: ["rule", "C-27", "crater", "bounds", "T11"]
level: 2
---
**R-sclk-003 · Crater shape and bounds (§6, C-27)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-sctr", "L0-sclk-ent4", "L0-sclk-p005"]`

- The footprint is a 5×5 square centred on the impact cell, in the plane of the hit face. The depth goes ≤ 3 cells into the face, from the impact cell inward. The crater never leaves this 5×5×3 box.
- Shape: an ellipsoid with semi-axes ≈ (2.5, 2.5, 3), each surface cell jittered by `seed`. **The impact cell and the cell behind it are always carved**, so the centre is ≥ 2 deep.
- Irregularity: on flat stone, at least one of the 25 footprint columns at the rim is left uncarved, so it is never a perfect box.
- The same `(impact, face, seed)` always gives the same cells (a pure function, node-tested).
- Side and ceiling hits carve into the face hit, not downward.
- The skip rules are r010 and `xasm25`: air, liquids, the deny list, unloaded cells and cells out of height range.
