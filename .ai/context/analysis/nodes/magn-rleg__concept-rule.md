---
type: "concept-rule"
node_id: "L0-magn-rleg"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rleg"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1844
tags: ["is_a:rule", "legendary", "relates_to:L0-lgnd", "relates_to:L0-lgnd-r016", "relates_to:L0-lgnd-ad13", "relates_to:L0-lgnd-ac22", "relates_to:L0-magn-aslh", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §4, AC-13, C-7″).** A legendary weapon is never iron and is never pulled, wherever it lies.

**Predicate.** "Legendary" means `isLegendaryStack(stack)` from `lgnd` v4 (`L0-lgnd-ad13`): the stack's type is a def's `itemId` **or** `craftTokenId`, in any mark state.
- **Before `lgnd` v4 ships**, use `defForStack(s) !== undefined || defForToken(s) !== undefined` from `src/legendary/registry.ts`. `defForStack` alone matches only `itemId`, so it would miss a craft token inside a pulled minecart.
- **Item entities** are judged by that predicate on their `minecraft:item` stack, **not** by `isLegendaryItemEntity`. That one is true only for a live marked instance, so it would let the magnet take an unmarked `/give` or Creative copy (`lgnd-ad13`, rejected option a).

**Call sites in `magn`:**
- ground items;
- container stacks;
- the player hand test;
- the drop exemption;
- every slot of a chest or hopper minecart, and the hand and armour slots of an armour stand or mob, before it is selected as a holder.

**Holders.** A class 3 holder whose inventory or equipment holds a legendary is **not selected**; the next candidate takes its place. A legendary therefore never moves through the magnet, not even inside its holder (`L0-magn-aslh`).

**Players.** A pulled player who carries a legendary is still pulled. The player is not "the legendary", and `lgnd` retention covers their death.

**Owned by `lgnd`, not restated here:** the predicate itself (`L0-lgnd-ad13`), the never-pulled rule including holders and players (`L0-lgnd-r016`), the watching of moved holders (`L0-lgnd-as15`), and death retention (`L0-lgnd-ac22`). The call sites above implement `L0-lgnd-r016` §2, §3, §5 and §6. Its §4 (holder blocks) is dormant, because the hopper is never a pulled block (`L0-adr-ufnd`). Where the two read differently, `lgnd` wins.
