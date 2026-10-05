---
title: Intent
type: project-knowledge
generated_at: "2026-10-05T17:12:56.138Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 610
---

# Intent

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

_node: L0_

---
title: "Project Intent"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-4", "dragonkatanaspecv1ruen-part-1", "stage-0-infrastructure"]
supersedes: ["L0-intent@v6"]
---
# Project Intent (v7)

**Business goal.** Give a small group of players, who play on an iPad against a BDS server, a Bedrock PvP world with **unique, spectacular legendary weapons**, **landmark structures** and **world events**. Everything must run on stock Bedrock with no Experiments, so the world survives game updates and needs no toggles on the client.

**What a legendary means to the player.** There is exactly **one legal Survival copy per world**. It is never lost: it survives death, hazards and the Void. It is announced to the server when first crafted, and it has a signature effect no vanilla item has. Each new spec adds one weapon to the same contract.

**What v7 adds.** A **ranged** legendary, the Sculk Crossbow. Its power is a bounded passive effect on every bolt, with no ability and no cooldown:
- a fixed, armour-ignoring Sonic Boom hit;
- a permanent sculk scar on the terrain.

The tension the spec declares is *spectacle and terrain change* against *PvP fairness and server cost*. Its §14 settles the order: correct damage replacement first, then Multishot independence, then bounded terrain, then visuals, then the legendary rules.

**How success is judged.**
- The `bds` channel: GameTests with SimulatedPlayers on the checks instance prove T01–T20.
- The `ipad` channel: the operator looks at what renders (the boom trail, the crater and the sculk, the icon and the Creative entry).
- Where stable Bedrock cannot do exactly what is asked, the closest stable server-authoritative version is built and the deviation is documented (C-16; crossbow §13).
