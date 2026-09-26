---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
analysis_version: 2
title: "Project Intent"
aliases: ["L0"]
is_a: ["intent"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1760
tags: ["title:Project Intent", "alias:L0-intent", "alias:Intent", "is_a:intent", "relates_to:L0", "see_also:fourstructuresspecruencopy", "see_also:webswordspecv1ruen", "see_also:scytheofcalamityspecv1ruen", "supersedes:L0-intent@v1"]
level: 0
---
# Project Intent

1. **Primary goal — weapons.** Give the user a PvP add-on for Minecraft Bedrock on iPad with a set of *legendary* weapons: unique per world (one Survival craft), undroppable, with a server-side active ability on a cooldown. Web Sword and Scythe of Calamity are shipped. More are expected (Shadow Blade, Dragon Katana are referenced by other specs but not specified).
2. **Primary goal — world content (new in v2).** Make the world worth exploring. Four custom structures (Windmill, Airship, Mini Warden City, Mini Bastion) appear in the world with their own loot, spawners and one-time guards. A Windmill is guaranteed near world spawn, so every new world starts with a reachable raid target and a linked Airship nearby. Sources: Four Structures spec §1, §4.7, §11.
3. **De-risking goal.** Prove the toolchain end-to-end on the available hardware (Mac mini + iPad, no Windows, no macOS Bedrock client) and the stable-API stack on the installed game version before building features (Stage 0, Stage 1). For structures, the same logic applies: prove that stable-API placement, rotation, block-entity (chest/spawner) preservation and seeded per-chunk rolls work on BDS **before** authoring four full templates.
4. **Delivery goal.** Each weapon and each structure is a self-contained module that is developed, tested and accepted on its own before moving to the next.
5. **Quality goal.** No duplication exploits (craft, death, reconnect, restart). Nothing regenerates: loot, spawners, guards and structures appear once and player changes are permanent. No dependency on Experiments/Preview. Safe on a dedicated multiplayer server. Every place where stable Bedrock forced an approximation is recorded in a technical deviation report (spec §11).
