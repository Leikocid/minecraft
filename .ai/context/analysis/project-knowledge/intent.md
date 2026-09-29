---
title: Intent
type: project-knowledge
generated_at: "2026-09-29T19:09:13.619Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 540
---

# Intent

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

_node: L0_

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
