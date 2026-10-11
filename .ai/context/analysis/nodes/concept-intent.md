---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 9
title: "Project Intent (v9)"
aliases: ["L0"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 2495
tags: ["v9", "above-water-trident"]
level: 0
---
---
title: "Project Intent"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "stage-0-infrastructure"]
supersedes: ["L0-intent@v8"]
---
# Project Intent (v9)

**Business goal.** A small group of players on an iPad play against a BDS server. They get a Bedrock PvP world with **unique, spectacular legendary weapons**, **landmark structures** and **world events**. It all runs on stock Bedrock with no Experiments, so the world survives game updates and the client needs no toggles.

**What a legendary means to the player.**
- Each world has exactly **one legal Survival copy**, and it is never lost: it survives death, hazards and the Void.
- The server announces it when it is first crafted.
- It has a signature effect that no vanilla item has.
- Each new spec adds one weapon under the same contract.

**What v9 adds: the Above-Water Trident.** It is a mobility weapon. It takes the vanilla trident's best enchantments, Loyalty and Riptide, and frees them from their conditions:
- **Riptide anywhere.** Dash through dry air and in any dimension, with no rain or water, no cooldown, and a safe landing.
- **Loyalty, made better.** A thrown trident always comes back, visibly, at 10 blocks/s, and never duplicates or gets lost.
- **Channeling, made reliable.** Every hit gives one lightning and +2 HP, with no weather needed.
- **Fast underwater** while it is held.

The spec's main tension is that **one item carries two Use behaviours, throw and dash**, with "no separate button". Its second tension is that the item **leaves every inventory while in flight**, and the legendary guarantees (never lost, one copy) must hold during that time too.

**How success is judged.**
- **The `bds` channel:** GameTests with SimulatedPlayers on the checks instance prove the acceptance list in the spec's final section, including the craft, the buckets, the restart, the damage, the dash, the landing, the return speed and the re-throw lock.
- **The `ipad` channel:** the operator checks the dash feel, the swim speed, the visible return, the lightning, the icon and the in-flight model, and the recipe in the recipe book.
- **Limitations are reported, not hidden.** Where stable Bedrock cannot do exactly what is asked, we report the specific limit, as the spec demands ("сообщить о конкретном ограничении"). We then build the closest stable server-authoritative version (C-16).
