---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad13"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-13 (v7): Type-based legendary predicates; the magnet now uses the weapon predicate to *include*, not to exclude"
aliases: ["L0-lgnd-ad13"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1508
tags: ["v7", "magnet", "predicate"]
level: 2
---
# AD-lgnd-13 (v7): Type-based legendary predicates; the magnet now uses the weapon predicate to *include*, not to exclude

Related: L0-magn, L0-lgnd-r016, L0-lgnd-ac21, L0-lgnd-ad16.

**Context.** v4–v6: `magn` consulted `isLegendaryStack` to skip legendaries (UFO AC 13). Since 1.6.0 (`de0fc68`) the operator made legendary weapons magnetic.

**Decision (as built).**
1. `registry.ts` exports two pure, type-only predicates, with no dynamic-property read (O(1) per slot):
   - `isLegendaryStack(stack)`: any def's `itemId` **or** `craftTokenId`. Answers "is it legendary or a craft in flight".
   - `isLegendaryWeaponStack(stack)`: any def's `itemId` only. Answers "is it a legendary weapon".
2. `magn` uses `isLegendaryWeaponStack` to **include** weapons as magnetic (`iron.ts:139-140`, `magnet-select.ts:8`, `:393`), and `HELD_LEGENDARY_IDS` (from `LEGENDARIES`) for `hasitem` holder tags.
3. Neither predicate reads the mark. Marked, unmarked (`/give`, Creative) and stale copies are treated alike.
4. `isLegendaryItemEntity` keeps its live-marked-only meaning for `ring` drop suppression.
5. **Type identity is a framework invariant.** Every def's `itemId` must be an `andrew:` id. A vanilla base item (`adr-scbs` B) would make both predicates true for every vanilla crossbow; see `ad16` §Fallback.

**Rejected.**
- (a) A mark-based predicate: a dynamic-property read per slot, and `hasitem` (magnet class 3) cannot express it.
- (b) Keep the exclusion: contradicts the operator decision of 2026-10-04.
