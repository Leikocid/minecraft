---
type: "concept-rule"
node_id: "L0-lgnd-r016"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-r016"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 1781
tags: ["v7", "magnet", "operator-tuning"]
level: 2
---
**R-lgnd-016 (v7): Legendary weapons are magnetic by operator tuning; craft tokens never are, and magnetism never destroys or duplicates an instance.**

Related: L0-magn, L0-lgnd-ad13, L0-lgnd-ac21, L0-lgnd-ac22.

**History.** UFO §4 / AC 13 said legendaries are never pulled. The operator reversed it on 2026-10-04 (1.6.0, `de0fc68`, "Replaces UFO AC 13 / R-lgnd-016"). This rule is now an **operator-tuned exception** to the spec.

**As built (1.6.1).**
1. The magnet's predicate is `isMagneticStack(stack) = isIronItem || isLegendaryWeaponStack` (`iron.ts:139-140`, `magnet-select.ts:393`). A legendary **weapon** (any def's `itemId`, marked, unmarked or stale) is pulled like iron:
   - on the ground, from container slots, and as a late drop;
   - a player holding one in a hand is lifted (`magnet-hold.ts:117-136`);
   - a mob or armour stand holding one is a class-3 holder, tagged via `hasitem` over `HELD_LEGENDARY_IDS` (`magnet-select.ts:179`, `:320`).
2. A **craft token** is never magnetic: `hasitem` rejects `menu_category: none` items, and a token is a craft in flight (`ad08`).
3. A hopper holding anything is a container, never a pulled block (`decision-resolve-l0-lgnd-cx13`), so no block pull ever removes a holder with a legendary in it; `protectLegendariesIn` has no magnet call site.
4. **The framework invariants still hold under magnetism:** after a pull the world holds exactly one live copy of each marked instance, its gen is unchanged unless a tier-3 loss happened, and a fall death after the hold keeps every held legendary (`ac22`).
5. Every new def is magnetic with no `magn` edit, because the predicate is built from `LEGENDARIES`. The Katana and the crossbow are pulled; the crossbow spec does not list the magnet as a hazard, so this is no breach.
