---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 8
level: 0
title: "Project Intent (v8)"
aliases: ["L0"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 2042
tags: ["v8", "storm-blade"]
---
---
title: "Project Intent"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2", "stage-0-infrastructure"]
supersedes: ["L0-intent@v7"]
---
# Project Intent (v8)

**Business goal.** A small group of players on an iPad play against a BDS server. They get a Bedrock PvP world with **unique, spectacular legendary weapons**, **landmark structures** and **world events**. All of it runs on stock Bedrock with no Experiments, so the world survives game updates and the client needs no toggles.

**What a legendary means to the player.** Each world has exactly **one legal Survival copy**, and it is never lost: it survives death, hazards and the Void. The server announces it when it is first crafted. It has a signature effect that no vanilla item has. Each new spec adds one weapon under the same contract.

**What v8 adds.**
- **The Storm Blade.** A melee legendary that stays a plain diamond sword in feel, plus two layers of power:
  - a 30-second **ranged active** ability: a 10-block bolt line that hits one target for 10 HP before armour;
  - an always-on **melee passive**: a 30 % chance of +6 HP before armour.

  The lightning is spectacle only and must never add damage, fire or knockback. The spec's tension is *a strong, readable effect* against *exact, non-stacking damage*.
- **Quality-of-life recipes.** Real vanilla Elytra and Totems of Undying become craftable without limit. The players want these items reachable without the End or raids. The spec asks for no new mechanics.

**How success is judged.**
- The `bds` channel: GameTests with SimulatedPlayers on the checks instance prove spec §06.
- The `ipad` channel: the operator looks at the trace, the strikes, the icon, the HUD line and the two recipes in the recipe book.
- Where stable Bedrock cannot do exactly what is asked, we build the closest stable server-authoritative version and document the deviation (C-16; storm spec §05, last bullet).
