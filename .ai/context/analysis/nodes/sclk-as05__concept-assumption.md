---
type: "concept-assumption"
node_id: "L0-sclk-as05"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-as05"]
is_a: ["assumption"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 919
tags: ["assumption", "CAN_ASSUME", "multishot", "quick-charge", "emulation"]
level: 2
---
**AS-sclk-05 · Emulation of Quick Charge and Multishot if the custom shooter ignores them (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r005", "L0-sclk-p002", "L0-xq7"]`

**Assumption.** If probe Q3 shows no native effect:
- **Multishot:** the substitution of one arrow from a stack with `multishot` spawns 3 bolts, at 0° and ±10° yaw at the same speed. One arrow is spent (vanilla Multishot spends one).
- **Quick Charge:** the shooter's draw stays at 1.25 s. Script-side, the full-charge requirement (r006) is measured in **ticks since `itemStartUse`** rather than by spawn speed: `25 − 5 × level` ticks. A release before that spawns no bolt.

**Impact if wrong.**
- If the operator rejects the bow-like feel (`xq7` item 8): fall back to `adr-scbs` option B (the vanilla crossbow), which re-opens `lgnd`.
- If the ±10° spread is off: one constant.
