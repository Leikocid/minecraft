---
type: "concept-assumption"
node_id: "L0-ring-as06"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as06"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 650
tags: ["is_a:assumption", "CAN_ASSUME", "geometry", "relates_to:L0-xasm8", "relates_to:L0-ring-ent1", "relates_to:L0-ring-p001"]
level: 2
---
**ASM-ring-06 · The charge count is 140–160 per RMB, with a hard cap of 200**

**Assumption.**
- The real-radius midpoint circle in `p001` gives about 1 + 16 + 28 + 44 + 56 ≈ 145 columns. `L0-xasm8` estimated ≈ 160.
- All budgets (orbc's 480-charge flight sweep, RG-1 to RG-3) are sized for ≤ 160 per attack × 3 attacks.
- A unit test pins the exact count, and `layout` asserts ≤ 200.

**Impact if wrong.**
- If the client wants visibly thicker rings (a 2-wide band), the count roughly doubles to ~300. That breaks orbc's sweep budget and RG-3, and needs a new L0 budget decision.
- If the client accepts a 4-connected ring, the count drops to ~100.
