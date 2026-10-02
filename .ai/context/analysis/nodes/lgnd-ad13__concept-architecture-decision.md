---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad13"
source_channel: "rollout"
analysis_version: 5
title: "AD-lgnd-13: `isLegendaryStack(stack)` is type-based, and a magnet block pull of a holder goes through `protectLegendariesIn`"
aliases: ["L0-lgnd-ad13"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 2504
tags: ["ufo", "magn", "contract"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-magn", "L0-lgnd-r016", "L0-lgnd-ac21", "L0-lgnd-ad12", "L0-lgnd-p008", "ufomagnetspecv1ruen-part-2", "ufomagnetspecv1ruen-part-4"]
---
# AD-lgnd-13: `isLegendaryStack(stack)` is type-based, and a magnet block pull of a holder goes through `protectLegendariesIn`

**Context.**
- UFO §4: *«Легендарные оружия не являются железными и не притягиваются никогда, где бы они ни лежали»*. AC 13: "Legendary weapons are never pulled."
- `magn` selects ground stacks, container stacks, whole entities (minecarts, armour stands, mobs) and blocks, including the `hopper` block (§4 "Блоки в мире").
- The only published predicate is `isLegendaryItemEntity(entity)`. It is entity-level and true only for a **live marked** stack.

**Decision.**
1. `lgnd` exports `isLegendaryStack(stack?: ItemStack): boolean` from `registry.ts`. It is true when `stack.typeId` is any def's `itemId` **or** `craftTokenId`, **whatever its mark state**: marked, unmarked (`/give`, Creative) or stale. It is a pure function with no dynamic-property read, so it costs O(1) per slot.
2. `magn` consults it for:
   - every candidate ground stack;
   - every container slot it extracts;
   - every slot of a chest or hopper minecart it would pull whole;
   - the hand slots of an armour stand it would pull.
   An entity that **carries** a legendary is skipped as an element (`r016`).
3. Before `magn` turns a block in `HOLDER_TYPES` into air (in practice the hopper), it calls `protectLegendariesIn(dim, {min: cell, max: cell}, {reason: "ufo"})` in the same synchronous step. That is the tier-1 duty of `r013` and `ad10`, applied to the magnet.

**Rejected.**
- (a) **Reuse `isLegendaryItemEntity`.** It needs an entity, so it cannot judge a container slot. It is also false for unmarked and stale copies, which are still "legendary weapons" to a player reading AC 13.
- (b) **Rely on "legendaries are not in the iron list".** It holds for whole stacks, but not for whole-entity pulls: a chest minecart or armour stand carrying a legendary would drag it along.
- (c) **Mark-based predicate (live only).** It lets the magnet carry off a Creative test copy, which fails AC 13 as written. The cost difference is nil.

**Consequence.**
- `isLegendaryItemEntity` keeps its live-only meaning for `ring` drop suppression, where only a protected instance matters.
- The two predicates differ on purpose: one answers "is it a legendary", the other "is it a protected instance".
