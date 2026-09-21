---
type: "concept-acceptance-criterion"
node_id: "L0-qatg-ac01"
source_channel: "rollout"
title: "AC Q-1 — Clean import on the stable target"
aliases: ["L0-qatg-ac01"]
part_of: ["L0-qatg"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-qatg-ent3"]
analysis_version: 2
level: 2
priority: 510
size_chars: 978
tags: ["acceptance-criterion","dod","bds","L0-qatg"]
---

# AC Q-1 — Clean import on the stable target

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-qatg-ent3"]` · `maps_to: ["§14"]`

**GIVEN** the Web Sword's behavior/resource pack changes built and installed via `bds:check`
**WHEN** the Docker BDS server loads the world
**THEN** the console log shows zero content errors and zero dependency errors attributable to the Web Sword's item, recipe, or script changes
**AND** the existing pickaxe/Stage-0/1 content continues to load without new errors.

**Spec basis.** §14: *«Оружие импортируется без content/dependency errors на выбранной стабильной версии Bedrock.»*

**How to verify.** `npm run bds:check`; grep the resulting log per the existing pattern `scripts/bds-check.mjs` already uses for the pickaxe.

**Not covered here.** Whether the item behaves correctly once loaded — that is AT-1 through AT-12 (`L0-qatg-ac02`).
