---
type: "concept-entity"
node_id: "L0-strf-e001"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `StructureDef` (the contract a body component registers)"
aliases: ["L0-strf-e001"]
is_a: ["entity"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1810
tags: ["is_a:entity", "contract", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-loot"]
level: 2
---
# Entity — `StructureDef` (the contract a body component registers)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

```ts
interface StructureDef {
  id: "windmill" | "airship" | "warden_city" | "bastion";   // registry key, also part of the roll hash
  templateId: `andrew:${string}`;                           // .mcstructure id
  dimension: "minecraft:overworld" | "minecraft:nether";
  chance: number;                                           // per chunk, from the one config table
  priority: number;                                         // order within a chunk (L0-strf-r002)
  size: { x: number; y: number; z: number };               // unrotated template size
  validity: ValidityProfile;                                // dryLand | flat | altitude | depth | netherFloor + thresholds
  verticalMode: "surface" | "altitude" | "depth" | "netherFloor";
  clearVolume: boolean;                                     // pre-fill AABB with air before place
  chests: { local: Vec3; table: LootTableRef }[];           // custom | vanilla:<path>
  guards?: (ctx: InitCtx) => GuardSpec[];                   // one-time mobs
  afterPlace?: (ctx: PlaceCtx) => void;                     // e.g. enqueue linked Airship
  afterInit?: (ctx: InitCtx) => Generator<void>;            // marker, gold blocks — must be idempotent
  nameKey: string;                                          // RU/EN localisation key (C-4)
}
```

- The registry is populated once at `worldLoad` (script start) and is immutable afterwards.
- `chests.length` and guard counts are asserted by the template test against the spec counts: Windmill 25 (5/8/12), Airship 10, Warden City 10 (3 central), Bastion 10 (3 treasure).
- Local points are in **unrotated template space** and are converted only by `rotateLocal` (`L0-strf-r004`).
