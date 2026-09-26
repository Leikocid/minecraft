---
type: "concept-entity"
node_id: "L0-pick-ent2"
source_channel: "rollout"
analysis_version: 2
title: "Entity: SmeltedDropAllowList"
aliases: ["L0-pick-ent2"]
is_a: ["entity"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 919
tags: ["is_a:entity", "auto-smelt", "relates_to:L0-pick-r003", "relates_to:L0-pick-r004"]
level: 2
---
# Entity: SmeltedDropAllowList

**Type:** `Map<string, string>` (block type id → smelted item id), defined in `src/autosmelt.ts` as `SMELTED_DROPS`.

**Cardinality:** exactly 7 entries (full table in `L0-pick-r003`). Immutable at runtime — no code path adds or removes entries; changing the allow-list means editing and rebuilding the source.

**Access pattern:** `smeltedDropFor(blockTypeId): SmeltedDrop | undefined`, a pure function (no engine access) — `undefined` means "not on the allow-list," which is the signal the event handler uses to no-op and fall through to vanilla (`L0-pick-r004`). `SmeltedDrop` is `{ itemId: string; count: number }`, and `count` is hardcoded to `1` at every call site (`L0-pick-asm1`).

**Why a `Map` and not an object literal:** avoids prototype-chain lookups (`"constructor"`, `"toString"`) accidentally resolving to a truthy value for an attacker- or bug-supplied block id string.
