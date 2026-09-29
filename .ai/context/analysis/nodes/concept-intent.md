---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 3
title: "Project Intent"
aliases: ["L0-intent", "Intent"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4", "webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "fourstructuresspecruencopy-part-1"]
supersedes: ["L0-intent@v2"]
priority: 540
size_chars: 1515
tags: ["title:Project Intent", "alias:L0-intent", "alias:Intent", "is_a:intent", "relates_to:L0", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "see_also:webswordspecv1ruen-part-1", "see_also:scytheofcalamityspecv1ruen-part-1", "see_also:fourstructuresspecruencopy-part-1", "supersedes:L0-intent@v2"]
level: 0
---
# Project Intent

1. **Weapons.** A PvP add-on for Minecraft Bedrock on iPad with a growing set of *legendary* weapons. Each one is unique per world (one Survival craft), survives death, is protected from ordinary destruction and has a server-side ability on a cooldown. Shipped: Web Sword and Scythe of Calamity. **New:** the Orbital Cannon, a strategic, terrain-changing weapon with two area attacks (Orbital §1).
2. **Portability.** The Orbital spec asks for a *standalone, testable module that can later be moved into the full PvP add-on* (Orbital §1). In this repo the "full add-on" already exists. The intent is read as: a self-contained module (`src/orbital/`) plugged into the shared legendary framework, testable alone through the gametest pack (`L0-xasm9`).
3. **World content.** Four custom structures make the world worth exploring (v2, shipped v1.2.0).
4. **Reliability first.** The Orbital spec §16 ranks conflicts. This ranking is adopted project-wide:
   1. no duplication or save corruption;
   2. correct gameplay;
   3. multiplayer sync and performance;
   4. visual fidelity.
5. **Stable APIs, documented compromises.** No Experiments or Preview. Where stable Bedrock cannot express a rule exactly (LMB input, TNT physics, indestructible items), implement the closest stable equivalent and write the compromise next to the code (Orbital §12, §15).
6. **Delivery.** Each weapon and structure is developed, tested (with ≥2 players for weapons) and accepted on its own before the next one starts.
