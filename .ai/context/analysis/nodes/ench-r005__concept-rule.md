---
type: "concept-rule"
node_id: "L0-ench-r005"
source_channel: "rollout"
analysis_version: 10
title: "R-ench-005 · Wind Burst and Unbreaking levels: 70/40/20 independent rolls, highest wins"
aliases: ["L0-ench-r005"]
is_a: ["rule"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1535
tags: ["v10", "enchanting", "level-rule", "wind-burst", "unbreaking", "C-39"]
level: 2
---
# R-ench-005 · Wind Burst and Unbreaking levels: 70/40/20 independent rolls, highest wins

**is_a:** rule · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-gl02, L0-ench-ac03

**Rule.** When `wind_burst` or `unbreaking` is chosen, **in either branch of the rare stage**, the roller:
1. draws three independent rolls: I succeeds when u₁ < 0.70, II when u₂ < 0.40, III when u₃ < 0.20;
2. takes the highest successful level;
3. uses **I** if none succeeds (the safe fallback);
4. caps the result at `min(vanillaMax = 3, tierCap)`, where `tierCap` is I / II / III for tiers 1 / 2 / 3 (`xasm39`, "context max"). The spec says to use the highest level the context allows.

These are independent probabilities, not shares of 100 %.

**Expected distribution at tier 3:**
- P(III) = 0.20;
- P(II) = 0.40 × 0.80 = 0.32;
- P(I) = 0.48. This is 0.7·0.6·0.8 from a successful I roll, plus 0.3·0.6·0.8 from the fallback.

At tier 2, P(II) = 0.52 and P(I) = 0.48. At tier 1, P(I) = 1.

**Statistics (C-39, n = 1 000 at tier 3, ±3σ):**
- III ∈ [162, 238];
- II ∈ [276, 364];
- I ∈ [433, 527].

The I-roll does not change the output distribution, so the test **also** checks the trace (`ent1`). Each roll's own success rate must sit within ±3σ of 0.70, 0.40 and 0.20, and all three rolls must be drawn every time, never short-circuited. This proves the "independent checks" wording in §5 bullet 5, not just the final shape.

**Other enchantments** do not use this rule (`L0-ench-asm1`).

**Source:** spec v2 §4 (level paragraph); §5 bullet 5.
