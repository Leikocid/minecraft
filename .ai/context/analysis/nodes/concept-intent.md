---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 4
title: "Project Intent"
aliases: ["L0"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2321
tags: ["v4", "title:Project Intent", "alias:L0-intent", "is_a:intent", "relates_to:L0", "see_also:ufomagnetspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-4", "supersedes:L0-intent@v3"]
level: 0
needs_rebuild_marked_at: 2026-10-02T19:13:14.954Z
---
---
title: "Project Intent"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1", "webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "fourstructuresspecruencopy-part-1"]
supersedes: ["L0-intent@v3"]
---
# Project Intent

1. **Weapons.** A PvP add-on for Minecraft Bedrock on iPad with a growing set of *legendary* weapons. Each one is unique per world, survives death, is protected from destruction and has a server-side ability on a cooldown. Shipped: Web Sword, Scythe of Calamity and Orbital Cannon (v1.4.4).
2. **World content.** Four custom structures make the world worth exploring (shipped v1.2.0).
3. **World events (new in v4).** Recurring server-wide events give the world a rhythm and give players a reason to interact. The first is the **UFO Magnet** (UFO §1):
   - It punishes carrying iron in the open: you lose items, or fall to your death.
   - It gives the Orbital Cannon a target worth a reward: 8 diamonds and a totem.

   Events are tied into the weapon family on purpose. Weapon changes must keep the saucer shootable (`L0-adr-ufoi`).
4. **Portability.** Both the Orbital and UFO specs call themselves *standalone* modules for "the PvP add-on". In this repo that add-on already exists. Each spec is read as a self-contained source module (`src/orbital/`, `src/ufo/`) plugged into the shared frameworks and testable through the gametest pack (`L0-xasm9`, `L0-adr-ufom`).
5. **Reliability first.** Orbital §16 and UFO §15 give the same ranking (C-15):
   1. no duplication or world corruption;
   2. correct gameplay;
   3. multiplayer;
   4. visual fidelity.
6. **Stable APIs, measured facts, documented compromises.**
   - No Experiments or Preview.
   - The UFO spec is the first one written *after* engine probes (U1–U11), so its mechanics are measured rather than hoped for. The project keeps this practice: probe first, then specify.
   - Where stable Bedrock cannot express a rule exactly, implement the closest equivalent and write the compromise next to the code (C-16).
7. **Delivery.** Each feature is developed, tested with ≥2 players where multiplayer matters, accepted on BDS and then on the iPad, and only then is the next one started.
