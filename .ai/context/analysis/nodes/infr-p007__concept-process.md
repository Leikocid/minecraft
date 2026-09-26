---
type: "concept-process"
node_id: "L0-infr-p007"
source_channel: "rollout"
analysis_version: 2
title: "Process: Restart/idempotency check on BDS"
aliases: ["L0-infr-p007"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1501
tags: ["is_a:process", "relates_to:L0-adr-strs", "relates_to:L0-strf", "v2-delta"]
level: 2
---
# Process: Restart/idempotency check on BDS

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]` · `relates_to: ["L0-adr-strs", "L0-strf"]`

## Purpose
Prove a BDS restart never re-runs a structure's one-time init — no duplicated chests/loot/spawners/guards/markers, and the instance registry's `placed`/`lootFilled`/`guardsSpawned` flags are unchanged — the engine-provable half of `C-7`/`L0-adr-strs`'s idempotency contract.

## Flow
1. Boot the `gametest` world, force at least one structure to generate and complete init (reusing the placement check's forced-roll hook, `L0-infr-p006`).
2. Snapshot the region's dynamic-property registry value and in-world entity/container counts.
3. Restart the BDS server process while keeping the same world data — **not** `bds:down`/`bds:up`'s fresh re-stage (`L0-infr-p002`), which intentionally resets to a clean world. Exact restart mechanism (container `restart` vs. in-place server stop/start) not fixed by any ADR — `L0-infr-as04`.
4. Re-snapshot after the restart and diff against step 2: registry flags must be byte-identical, and chest/spawner/guard/marker counts must be unchanged.

## Verdict
PASS iff the two snapshots match exactly; any new instance, duplicated container, or re-spawned guard is FAIL. Same exit-code convention as the rest of `bds`.

## Boundary
This lane only proves idempotency is observable on BDS; the registry format and the `placed=false→true` write ordering that make it idempotent belong to `L0-strf` (`L0-adr-strs`).
