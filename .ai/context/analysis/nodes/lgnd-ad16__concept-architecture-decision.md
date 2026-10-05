---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad16"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-16: The Sculk Crossbow is def #5: data plus the passive variant, with no per-weapon framework code"
aliases: ["L0-lgnd-ad16"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 2732
tags: ["v7", "sculk-crossbow"]
level: 2
---
# AD-lgnd-16: The Sculk Crossbow is def #5: data plus the passive variant, with no per-weapon framework code

Related: L0-sclk, L0-adr-scbs, L0-xasm26, L0-lgnd-ad14, L0-lgnd-ad15, L0-lgnd-as18, L0-lgnd-cx15, L0-lgnd-ac25, L0-lgnd-ac27.

**Context.** Crossbow §3/§13: "preserve all global legendary rules". `L0-adr-scbs` (proposed, probe-gated) picks option A, a custom `andrew:sculk_crossbow` with `minecraft:shooter`. The Katana proved that a def needs no framework code (`ad14`).

**Decision.**
1. Append `SCULK_CROSSBOW: PassiveLegendaryDef` with the `as18` data (`keyPrefix "sk"`, not `"sc"`: `cx15`).
2. **No per-weapon framework code.** Verified per path at 1.6.1:
   - craft gate: `defForToken`; the broadcast and refund come from `textPrefix` and `refund`;
   - retention: loops `LEGENDARIES` (`retention.ts`);
   - recovery, the item-entity watch, the minecart and armour-stand Void paths: `defForStack` on the stack;
   - `protectLegendariesIn`: holder block types plus `defForStack`. `sclk`'s crater calls it before carving (`L0-xcx25`);
   - commands: `commands.ts` iterates `LEGENDARIES`, so `/andrew:crossbow give|reset` comes free;
   - magnet: `isLegendaryWeaponStack` and `HELD_LEGENDARY_IDS` are built from `LEGENDARIES`; `magn` needs no edit;
   - HUD and `resolveActivation`: covered by `ad15`'s `hasAbility` skip, not by a crossbow branch.
3. The `ac11` grep guard holds: no `andrew:sk_` literal outside `src/legendary/`.
4. **What `sclk` supplies:** item JSON (`allow_off_hand`, `fire_resistant`, no durability), the token (`menu_category: none`, same icon and name, `max_stack_size` 1), the recipe whose output is the token, the lang keys `andrew.crossbow.{first_craft,craft_blocked,returned,admin_given,reset}`, the bolt pipeline.

**Fallback (if `adr-scbs` adopts B, the vanilla `minecraft:crossbow`).** This is **not** a def; it is a change of identity across the framework:
- `isLegendaryStack`, `isLegendaryWeaponStack`, `defForStack` and `heldLegendaries` must read the mark, so every call costs a dynamic-property read;
- the craft gate cannot tell the ingredient crossbow from the product, and an unmarked vanilla crossbow must stay ordinary everywhere (magnet, retention, protect);
- the magnet's class-3 tagging uses `hasitem`, which cannot see a mark: a mob holding any crossbow would become magnetic;
- durability refill after every shot (T18) moves into `lgnd`;
- every framework GameTest gains vanilla-copy negative cases.
That needs its own L0 decision and its own `lgnd` pass; this pass does not plan it.

**Rejected.**
- (a) A crossbow-specific retention, HUD or magnet branch: duplicates shared logic (C-7, `L0-plan`).
- (b) Reusing `sc` as the plan says: collides with the Scythe (`cx15`).
