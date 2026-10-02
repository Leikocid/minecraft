---
type: "concept-entity"
node_id: "L0-airs-e001"
source_channel: "rollout"
analysis_version: 5
title: "Entity — the Airship's `StructureDef` values"
aliases: ["L0-airs-e001"]
is_a: ["entity"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1692
tags: ["is_a:entity", "contract", "structuredef", "relates_to:L0-strf-e001", "relates_to:L0-strf-as02", "relates_to:L0-adr-tmpl"]
level: 2
---
# Entity — the Airship's `StructureDef` values

**Links:** `part_of: ["L0-airs"]` · `is_a: ["entity"]`

Concrete values `airs` registers into the shared contract (`L0-strf-e001`):

```ts
const airshipDef: StructureDef = {
  id: "airship",
  templateId: "andrew:airship",
  dimension: "minecraft:overworld",
  chance: 0.02,
  priority: 2,                          // after "windmill" (1), before "warden_city" (3) — L0-strf-r002 item 4
  size: [75, 18, 13],                    // AIRSHIP_SIZE, templates/airship.ts:20; unrotated
  validity: { profile: "dryLand", maxLiquidShare: 0.10 },  // L0-strf-as02
  verticalMode: "altitude",              // clearance solved by strf, L0-strf-r005/-r003
  clearVolume: true,                     // L0-strf-p003 step 2 - the Airship needs this for its whole volume
  chests: [ /* 8 room points (2 x 4 rooms) + 2 corridor points, template-local */ ],
  guards: undefined,                     // L0-airs-r005 - no one-time mobs
  afterPlace: undefined,                 // airs does not trigger anything after its own placement
  nameKey: "andrew.structure.airship",   // RU "Дирижабль" / EN "Airship", C-4
};
```

- `chests.length === 10` is asserted by `strf`'s template test (`L0-strf-e001`).
- The two door local points and the "not above Windmill" exclusion are not fields of this def — the doors are template geometry only (no script-visible contract), and the exclusion is applied inside `airs.tryLinked`, not in the def (`L0-airs-r004`, `L0-airs-e002`).
- Exact XYZ of the 10 chest points and the 1 spawner point live in the template builder source (`infr`, `L0-adr-tmpl`), not here; this entity fixes only their **count** and **grouping** (8 room + 2 corridor).
