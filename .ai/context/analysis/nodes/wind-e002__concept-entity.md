---
type: "concept-entity"
node_id: "L0-wind-e002"
source_channel: "rollout"
analysis_version: 2
title: "Entity — `SpawnWindmillRecord` (`andrew:st:spawn`)"
aliases: ["L0-wind-e002"]
is_a: ["entity"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1620
tags: ["is_a:entity", "persistence", "spawn-windmill", "relates_to:L0-strf-e002", "relates_to:L0-wind-r011", "relates_to:L0-wind-p002"]
level: 2
---
# Entity — `SpawnWindmillRecord` (`andrew:st:spawn`)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-e002, L0-wind-r011, L0-wind-p002, L0-wind-p003]`

A single world dynamic property, owned by `wind`, written through the `strf` store API (C-6). Compact JSON, well under 1 KB.

```ts
interface SpawnWindmillRecord {
  v: 1;
  status: "searching" | "preparing" | "done" | "failed" | "skipped";
  spawn: [number, number];          // world spawn x,z captured at first start (never re-read)
  stage?: 1 | 2 | 3;                // 1 = 5×5 chunks, 2 = ring ≤500, 3 = forced prep
  cursor?: { ring: number; window: number };  // resume point while searching
  best?: { o: [number,number,number]; r: 0|1|2|3; score: number }; // best forced-prep candidate so far
  plan?: string;                    // hash of the SitePrepPlan being applied (status "preparing")
  origin?: [number, number, number];
  rot?: 0 | 1 | 2 | 3;
  prepared?: boolean;               // true if forced prep ran
  reason?: string;                  // "no-dry-land", "interrupted: …", "error: …", "placement …"
}
```

## Invariants
- Created once, on the first world load with the add-on. `done` and `failed` are terminal and never re-run, even if the Windmill is later destroyed (§4.7.13, §2).
- `spawn` is captured once. A later `/setworldspawn` does not move or add a Windmill.
- The placed instance lives in the regular registry with id `windmill:spawn`; this record only holds the search state and outcome. Registry is authoritative for "exists" (`L0-strf-r008`).
- A schema version bump never resets `status` (`L0-strf-e002` migration rule).
