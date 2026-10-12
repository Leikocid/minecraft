---
type: "concept-architecture-decision"
node_id: "L0-adr-enrl"
source_channel: "rollout"
analysis_version: 11
title: "ADR-L0-enrl · Enchanting: a pure roller, with the hook gated"
aliases: ["L0-adr-enrl"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2459
tags: ["v10", "enchanting", "status:proposed", "gated:xq11"]
level: 2
---
---
title: "ADR-L0-enrl · Enchanting rules in a pure roller; the engine hook is gated on the probe and on xq11"
aliases: ["L0-adr-enrl", "Enchant roller"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ench", "L0-xcx32", "L0-xq11", "L0-xasm39", "L0-ench-cx01", "L0-ench-adr1"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-2", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
governs_files: ["src/legendary/enchant.ts", "src/sculk/enchant.ts"]
---
# ADR-L0-enrl · Enchanting: a pure roller, with the hook gated

**Context.** §4's rules are testable on their own: rare stage 20 %, curses 0 %, conflicts, and independent level rolls for Wind Burst and Unbreaking. Where they plug into the game may be impossible (`xcx32`). The acceptance asks for 1000+ samples, which a SimulatedPlayer cannot produce at a real table.

**Decision.**
1. **A pure module `src/enchanting/roll.ts` with no `@minecraft/server` import.**
   - Input: `{itemId, cost tier, rng}`.
   - Output: an enchantment list, built in four steps:
     1. the eligible set is the vanilla data for the item's slot, minus curses, minus the def's FORBIDDEN list;
     2. the rare stage: with p = 0.2, **at least one** formerly table-inaccessible eligible enchantment is included; if there are none, the standard pool is used;
     3. the standard vanilla pool fills the rest, respecting the conflict groups;
     4. for Wind Burst or Unbreaking, three independent rolls (I 0.7, II 0.4, III 0.2) set the level: highest success wins, else I, capped at the context max.
   - Tests: statistics with ±3σ bands on 10 000 seeded and unseeded runs; a fuzz test that no conflict pair or curse ever appears (C-39).
2. **The engine hook is a separate, swappable adapter.** It is built only for the option Andrey picks in `xq11`:
   - **(a) post-hoc re-roll (detection amended at reduce v10, `L0-ench-cx01`):** the table takes the item into its own slot, so no stack gains enchantments in place. The signal is an enchanted stack **arriving** in the inventory after a level drop of 1–3 at an earlier click. The adapter replaces the enchantments with the roller output for that tier. An anvil plus a book produces the same signal. Adapter (a) is therefore built only together with a separator that probe Q4 proves (lapis consumed, the book leaving, table proximity, …). Without one, the `xq11` cost line must say that (a) can re-roll anvil results. The preview shows vanilla offers, so this is reported as a deviation either way.
   - **(b) a custom station.**
   - **(c) none, with a limitation report.**

   The C-37 scrubs run after any adapter.

**Rejected.**
- **Experimental or beta APIs** (C-2).
- **Building adapter (a) before approval.** C-38 says the spec forbids a silent substitute.
- **Mixing the probabilities into adapter code.** That would make the 1000-sample acceptance impossible without the table.
