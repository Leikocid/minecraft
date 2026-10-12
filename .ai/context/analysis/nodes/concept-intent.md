---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 10
title: "Project Intent (v10)"
aliases: ["L0"]
is_a: ["intent"]
priority: 640
size_chars: 2795
tags: ["v10", "underwater-bow", "enchanting"]
level: 0
---
---
title: "Project Intent (v10)"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
---
# Project Intent (v10)

**Business goal.** A small group of players on an iPad play against a BDS server. They get a Bedrock PvP world with **unique, spectacular legendary weapons**, **landmark structures** and **world events**. It all runs on stock Bedrock with no Experiments, so the world survives game updates and the client needs no toggles.

**What a legendary means to the player.** It is unchanged since v1:
- one legal Survival copy per world, which is never lost;
- the server announces the first craft;
- it has a signature effect that no vanilla item has.

**What v10 adds.** v10 has two goals.
1. **A ranged legendary that ignores water: the Underwater Bow.** Its arrows fly in water and lava as they do in air. Every hit burns. On demand it arms one heavy hit: 14 HP, a lightning visual, and fire that water cannot put out. The player's trust rests on one rule: **"a miss costs nothing"**. The charge and the cooldown are spent only by a real hit.
2. **Quality of life for gear progression.**
   - A cheap path to the Mace, because Heavy Cores are rare.
   - Paper-and-string rockets for Elytra flight. This pairs with v8's Elytra recipe.
   - An enchanting table that can roll treasure enchantments (Mending, Wind Burst, Swift Sneak), at a tuned rarity and never with curses, so they no longer need villagers or loot.

**The spec's main tension.** The enchanting goal targets a **native engine system** that add-ons may not be able to intercept. The client asks for honesty over coverage:
- "НЕ заявлять о полной реализации" (do not claim a full implementation);
- an alternative only "после согласования" (after approval).

So in this release, success for §4 can be a **verified "not possible, here is what is possible" report** (C-16, C-38).

**How success is judged.**
- **The `bds` channel:** GameTests on checks (19136) cover:
  - recipe outputs, including real vanilla items and both buckets;
  - arrow speed in water and lava against an air baseline;
  - normal fire vs Super Fire in water;
  - miss and hit vs the cooldown;
  - restart persistence of the bow's uniqueness, recovery and armed state.

  Large-sample statistics (≥ 1000 rolls) prove the roller's rates: 20 % rare, 0 % curses, and 70/40/20 levels.
- **The `ipad` channel:**
  - the bow's HUD (ready / armed / cooldown);
  - the lightning visual;
  - fire that persists underwater;
  - the recipes in the recipe book;
  - the rockets boosting an Elytra;
  - anything about the enchanting table that a SimulatedPlayer cannot operate.
