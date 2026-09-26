---
type: "concept-assumption"
node_id: "L0-xasm2"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — A second Golden Apple pick in the same chest is an empty attempt"
aliases: ["L0-xasm2"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1239
tags: ["title:Golden Apple repeat attempt yields nothing", "alias:L0-xasm2", "is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-loot", "see_also:fourstructuresspecruencopy"]
level: 1
---
# Assumption (CAN_ASSUME) — A second Golden Apple pick in the same chest is an empty attempt

**Gap.** §3.1.5 and §3.2 say Golden Apple "может успешно появиться не более одного раза в одном сундуке". The spec does not say what happens when a later attempt picks the category again: re-pick, or nothing.

**Assumption.** The attempt is spent and produces nothing ("успешно" implies later picks can fail). The weights are not renormalised per chest.

**Impact if wrong.** If a re-pick was intended, the average stacks per chest rise slightly (≈ +0.02 per chest at weight 7/213). The loot statistics test (tests 34, 39) would need its expected distribution adjusted. It is a one-line change in `loot`.

---

**Related gaps assumed at the same time (all CAN_ASSUME, owner `L0-loot`):**
- "Logs or wood" means a log block of a uniformly random vanilla Overworld wood type (oak, spruce, birch, jungle, acacia, dark oak, mangrove, cherry, pale oak). Nether stems are excluded.
- A random enchantment count of 1–3 from the item's compatible, non-curse, non-treasure-only set, with a uniform level in 1..max, validated with `canAddEnchantment`. Treasure enchants (Mending, Frost Walker, Swift Sneak, Soul Speed) are excluded from the custom table.
