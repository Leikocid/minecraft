---
type: "concept-assumption"
node_id: "L0-xasm43"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-43 · Recipe positions and \"infinite durability\""
aliases: ["L0-xasm43"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 2478
tags: ["v11", "pearl-rod", "recipes", "CAN_ASSUME"]
---
---
title: "ASM-L0-43 · \"Fixed positions\" = a full 3×3 pattern with blanks; infinite durability = damage held at 0"
aliases: ["L0-xasm43", "Pearl Rod recipe and durability"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-uwbw", "L0-adr-prbd", "L0-xq12"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4"]
---
# ASM-L0-43 · Recipe positions and "infinite durability"

**Class:** CAN_ASSUME.

**Gap 1: positions.**
- The spec says "Позиции фиксированы, прочие клетки пустые" (positions are fixed; the other cells are empty) and "Верстак 3×3" (a 3×3 crafting table).
- A Bedrock shaped recipe with a 1×2 pattern (`["P","R"]`) matches in any column and row, including the 2×2 inventory grid.

**Assumption 1.**
- The recipe is written as a full 3×3 pattern: `[" P ", " R ", "   "]`, with P = `minecraft:ender_pearl` and R = `minecraft:fishing_rod`.
- On the assumption that Bedrock does not trim blank rows and columns, this matches only at top-middle and centre, and only on a crafting table.
- The probe confirms it: a shifted layout and the 2×2 grid must produce nothing. If Bedrock trims, the limitation is reported and the 1×2 pattern ships.
- **Seam for reduce:** the spec draws the v10 Mace and Rocket recipes at fixed cells too (centre and bottom-centre), so the same rule is offered to `uwbw`.

**Gap 2: durability.** "Бесконечная прочность" (infinite durability) on a vanilla rod, which has **384** durability on Bedrock 1.26.51 — not the 64 this node first claimed (measured, `docs/feedback/probe-pearl.md` row 7) — and no stable "Unbreakable" flag. Writing `durability.damage = 0` back does hold: reads at +0/+1/+5/+40 all return 0, and a cast with the hook already out is not killed by the write.

**Assumption 2.**
- `durability.damage` is written back to 0 after every reel and release of a marked rod, and on the shared interval's hand check.
- The bar may flicker for a tick on the iPad. The rod never breaks.
- Mending and Unbreaking stay legal; they are harmless.

**Gap 3: input rod.** The spec does not say what happens to an enchanted or damaged input rod.

**Assumption 3.** The output is always a fresh rod with no enchantments. The input's enchantments are lost; the token cannot carry them, the same limitation as craftgate's refund.

**Impact if wrong.**
- If fixed positions cannot be enforced, players can craft the rod with shifted ingredients. That is cosmetic and gets reported.
- If damage cannot be written, the fallback is to swap in a fresh marked rod that keeps the binding and the enchantments, which the probe checks.
- If the input's enchantments must carry over, the swap would read the consumed rod. That is impossible after the craft (C-16).
