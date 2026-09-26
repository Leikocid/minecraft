---
type: "concept-entity"
node_id: "L0-strf-e002"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `RegionShard` and `InstanceRecord` (the persistent registry)"
aliases: ["L0-strf-e002"]
is_a: ["entity"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1707
tags: ["is_a:entity", "persistence", "dynamic-properties", "relates_to:L0-adr-strs", "relates_to:L0-strf-as05"]
level: 2
---
# Entity — `RegionShard` and `InstanceRecord` (the persistent registry)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

**Key.** `andrew:st:<dimShort>:<rx>:<rz>`, where `rx = floor(cx/32)`, `rz = floor(cz/32)` and `dimShort ∈ {o, n}`. Other keys: `andrew:st:salt` (string), `andrew:st:ver` (schema version, int), `andrew:st:spawnWindmill` (owned by `wind`).

**Value (JSON string, compact):**
```ts
interface RegionShard {
  v: 1;
  ev: string;               // base64 bitset, 1024 bits = evaluated chunks (row-major 32×32)
  i: InstanceRecord[];
}
interface InstanceRecord {
  id: string;               // `${def}:${dimShort}:${cx}:${cz}` or `${def}:L:${parentId}` / `${def}:S` for linked/spawn
  d: string;                // def id
  o: [number, number, number]; // origin (min corner, world coords)
  r: 0 | 1 | 2 | 3;         // rotation
  s: "p" | "P" | "l" | "g" | "d" | "f"; // planned, placed, looted, guarded, done, failed
  x?: Record<string, unknown>; // def extras: linkedTried, clearance, goldCount …
}
```
- A record lives in the shard of its **origin chunk**. Collision lookup reads every shard whose region intersects the AABB plus 1 chunk.
- Size estimate: a record is about 70 chars and the bitset about 172. A worst-case region (1024 chunks × Σ chance ≈ 13 % Overworld, before cancellations) holds ~130 records, about 9 KB. That stays under the per-key limit measured by the probe (`L0-strf-as05`). If a shard exceeds 80 % of the limit, split it into `:<rx>:<rz>:b` (overflow key).
- Schema migrations bump `andrew:st:ver`. Unknown future versions → generation is disabled (fail safe; no re-generation).
- An in-memory LRU cache of 64 shards. Writes are coalesced per job slice.
