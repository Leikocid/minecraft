---
type: "concept-entity"
node_id: "L0-infr-e005"
source_channel: "rollout"
analysis_version: 5
title: "Entity: Structure template source & compiled `.mcstructure`"
aliases: ["L0-infr-e005"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1284
tags: ["is_a:entity", "relates_to:L0-adr-tmpl", "relates_to:L0-infr-e001", "v2-delta"]
level: 2
---
# Entity: Structure template source & compiled `.mcstructure`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-e001"]`

**Attributes**
- **Source** (repo, hand-authored): per-structure TS/JSON layout/builder definitions — block palette plus block-entity data (chest positions, `mob_spawner` + `EntityIdentifier`, shrieker `can_summon`, door half-state, wheat `growth`, rotated-stair states). Exact path not yet fixed by an ADR (`L0-infr-as05`).
- **Compiled output** (generated, gitignored, never hand-edited — `L0-infr-r007`): `packs/behavior/structures/andrew/*.mcstructure`, little-endian NBT, one file per structure (Windmill/Airship/Warden City/Bastion), fixed layout with random rotation only (0/90/180/270) applied at placement time, not baked into 4 separate files [`L0-adr-tmpl`].
- **Identity rule**: like `packs/behavior/scripts/`, this directory is build output produced by `scripts/build-structures.mjs` and is already inside the zip `L0-infr-p001` packages — no separate ship path.
- **Consumers**: `world.structureManager.place(templateId, dim, origin, {rotation})` at runtime (`L0-strf`, `L0-adr-strc`); the round-trip unit test (`L0-infr-p005`) and the BDS 4-rotation placement test (`L0-infr-p006`) at build/check time.
