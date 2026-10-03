---
title: Intent
type: project-knowledge
generated_at: "2026-10-03T14:58:23.868Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 600
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
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3", "ufomagnetspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1", "webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "fourstructuresspecruencopy-part-1"]
supersedes: ["L0-intent@v4"]
---
# Project Intent

1. **Weapons.** A PvP add-on for Minecraft Bedrock on iPad with a growing set of *legendary* weapons. Each one is unique per world, survives death, is protected from destruction and has a server-side ability on a cooldown.
   - Shipped: Web Sword, Scythe of Calamity, Orbital Cannon (v1.4.4).
   - **New in v6: the Dragon Katana.** It is the first *mobility* legendary. The weapon itself stays an ordinary Diamond Sword, and the ability moves its wielder up to 20 blocks along the view, never through a wall (Katana §1, §13). It gives PvP an engage/escape tool on a 30 s rhythm that matches the other legendaries.
2. **World content.** Four custom structures make the world worth exploring (shipped v1.2.0).
3. **World events.** Recurring server-wide events give the world a rhythm. The UFO Magnet is shipped (stage 6). It is tied into the weapon family on purpose: the Orbital Cannon shoots it down, and legendaries are never pulled.
4. **One framework, many weapons.** Each weapon spec repeats the same "global legendary rules". The project implements them once (`lgnd`), and each new weapon is a definition plus its ability. Katana §13 asks to "preserve all global legendary-item rules". The project reads that as "register with the framework", not "re-implement".
5. **Reliability first** (C-15): no duplication or world corruption, then correct gameplay, then multiplayer, then visuals. Katana §14 agrees:
   1. server-authoritative range;
   2. never phase through solids;
   3. persistent uniqueness and protection;
   4. cheap particles;
   5. synchronisation and UI.
6. **Stable APIs, measured facts, documented compromises.** There are no Experiments. Where stable Bedrock cannot express a rule exactly, the closest stable equivalent is implemented and the deviation is documented next to the code (C-16; Katana §13 says the same). Engine behaviour is probed before it is relied on. This applies to the Katana's fall protection (`L0-adr-ktfl`).
7. **Delivery.** Each feature is developed, tested with ≥ 2 players where multiplayer matters, accepted on BDS and then on the iPad, and only then is the next one started.
