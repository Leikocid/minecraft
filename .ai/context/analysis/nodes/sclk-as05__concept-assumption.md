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

**Assumption.** Probe Q3 measured no native Quick Charge effect (Multishot was not measured), so:
- **Multishot:** the substitution of one arrow from a stack with `multishot` spawns 3 bolts, at 0° and ±10° yaw at the same speed. One arrow is spent (vanilla Multishot spends one).
- **Quick Charge:** the native draw is set to the QC III floor (0.5 s), and the script holds each load to `25 − 5 × level` ticks of the **loading draw**, removing the arrow fired by the next press when the load was shorter. Measuring by spawn speed is impossible: every fired arrow is full speed.

**Impact if wrong.**
- If the operator rejects hold-to-load/press-to-fire with scripted Quick Charge (`xq7`, the feel item): fall back to `adr-scbs` option B (the vanilla crossbow), which re-opens `lgnd`.
- If the ±10° spread is off: one constant.
