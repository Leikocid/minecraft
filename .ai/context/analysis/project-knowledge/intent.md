---
title: Intent
type: project-knowledge
generated_at: "2026-10-12T18:21:49.800Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 650
---

# Intent

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

_node: L0_

---
title: "Project Intent (v11)"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-uwbw", "L0-ench"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
supersedes: ["L0-intent@v10"]
---
# Project Intent (v11)

**Business goal.** It is unchanged. A small group of players on an iPad play against a BDS server. They get a Bedrock PvP world with **unique, spectacular legendary weapons**, **landmark structures** and **world events**. It all runs on stock Bedrock with no Experiments.

**What a legendary means.** It is unchanged since v1: one legal Survival copy per world that is never lost, a server announcement on first craft, and a signature effect no vanilla item has.

**v10 goals, carried (spec v3 §1–§5 = v2):**
- the Underwater Bow, whose rule is "a miss costs nothing";
- a cheap Mace and paper rockets;
- an enchanting table with treasure enchantments, where honesty comes over coverage (C-38).

**What v11 adds: a player-placed waypoint.** The Pearl Rod gives every player, not just one per world, a **one-shot return ticket** to a spot they marked themselves. The player casts the bobber into a pressure plate at home, base or arena, then later uses the rod to land back on it. The design intent is in the spec's rules:
- **Cheap and common.** It is not legendary: unlimited crafting, droppable, and lost on death like any item. Only its *binding* is personal.
- **One trip per binding.** Teleporting clears the binding. To go again you must physically be at the plate again and re-cast. This keeps it a waypoint, not a free fast-travel network.
- **The binding is the player's, not the item's.** A dropped, stolen or traded rod does not take its new holder to someone else's base. The binder's death voids the binding. That PvP property is the reason for the owner and death rules.
- **Never strand or kill the player.** No distance cap, but no teleport into an unloaded void, a missing plate or a suffocating spot. A failure says so plainly. The client repeats its standing rule: "сообщить об ошибке, не заявлять об успешном переносе" (report the error; do not claim a successful transfer).

**How success is judged.**
- **The `bds` channel:** GameTests on checks (19136):
  - the craft, with fixed positions and unlimited, plus no durability loss after reels;
  - a binding on each vanilla plate type;
  - one teleport, after which the binding is cleared and the next use casts;
  - a broken or replaced plate gives no teleport;
  - the owner's death voids the binding, and a transferred rod casts for its new holder;
  - a far plate is preloaded and reached;
  - a forced preload failure gives no teleport and an error message;
  - the binding survives a restart.
- **The `ipad` channel:** the name, icon and lore; the recipe book; the cast pose snapping back on binding; the arrival; the failure messages; and normal fishing feel.
