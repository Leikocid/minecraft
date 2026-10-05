---
type: "concept-architecture-decision"
node_id: "L0-adr-scbs"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated)"
aliases: ["L0-adr-scbs"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 2758
tags: ["v7", "sculk-crossbow", "status:proposed", "probe-gated"]
---
---
title: "ADR-L0-scbs · The Sculk Crossbow's base item: a custom shooter, not a marked vanilla crossbow"
aliases: ["L0-adr-scbs", "Sculk Crossbow base item"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xcx24", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated)

**Context.** Spec §1 says "base: Vanilla Crossbow". It requires infinite durability, a Creative/search/`/give` entry, Quick Charge and Multishot working (T14, T16), and Piercing impossible (T15). The framework identifies legendaries **by type id** (`isLegendaryStack`, `registry.ts:127`). Every shipped legendary is a custom `andrew:` item: the Web Sword and Katana clone a sword, and the Cannon looks like a fishing rod.

**Options.**
- **A: a custom `andrew:sculk_crossbow`** with `minecraft:shooter` (arrow ammunition), `minecraft:enchantable` (slot `crossbow`), no `minecraft:durability`, and a crossbow icon.
  - Pros: framework identity is unchanged, as are Creative/`/give` (T03) and infinite durability by omission.
  - Measured: with `charge_on_draw` it loads at `max_draw_duration` and fires on the next press, like a crossbow — not like a bow. Quick Charge has **no** native effect; Multishot was not measured. Quick Charge is therefore emulated: set the native draw to the QC III floor (0.5 s) and gate on the length of the loading draw, 25 − 5·level ticks. Multishot, if it is not native, is two extra bolts at ±10°.
- **B: the vanilla `minecraft:crossbow`** with the legendary mark in item dynamic properties.
  - Pros: real loading; Quick Charge and Multishot are native.
  - Cons: `isLegendaryStack` has to become mark-aware throughout the framework, the magnet and the GameTests. There is no Creative entry (§10). Durability must be refilled after every shot (T18). The unmarked vanilla crossbow is the recipe input and looks identical.

**Decision (proposed).** **A.** It keeps C-7 (one identity mechanism) and needs only the no-ability framework delta (`L0-xcx24`).

**Gate.** It is accepted only after the `sclk` probe records:
1. that the custom shooter fires arrows in Survival and consumes ammunition;
2. whether the enchanting table and the anvil offer Quick Charge, Multishot and Piercing for slot `crossbow`;
3. whether Multishot and Quick Charge change the custom shooter's behaviour natively.
4. ~~(added at reduce) the minimum release time (probe Q5)~~ — **satisfied natively on BDS**: `charge_on_draw` + `max_draw_duration` admit no early shot at all, so §9's limiter needs no script.

If (1) or (4) fails, B is adopted. Under B, T18 (durability kept at 0) moves from `sclk` to `lgnd`, together with mark-aware identity. The reduce then re-opens `lgnd` for mark-based identity. Under C-16, emulated Quick Charge is a documented deviation from the vanilla feel.

**Rejected: C, a custom item that shoots nothing** (the script spawns bolts on `itemUse`). It loses the crossbow's charge, the ammunition use and vanilla enchantment handling altogether, and §9 makes the standard reload the weapon's only limiter.
