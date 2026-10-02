---
type: "concept-contradiction"
node_id: "L0-pntr-cx01"
source_channel: "rollout"
analysis_version: 5
title: "CX-pntr-01 · Legendary in an item frame: \"never destroyed\" vs no stable item-frame API"
aliases: ["L0-pntr-cx01"]
is_a: ["contradiction"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1815
tags: ["title:CX-pntr-01 · Legendary in an item frame: \"never destroyed\" vs no stable item-frame API", "is_a:contradiction", "category:source-vs-engine", "severity:medium", "status:resolved", "target:L0-pntr", "relates_to:L0-lgnd", "relates_to:L0-xcx10", "relates_to:L0-pntr-r005", "constraint:C-7′", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-oprt
level: 2
---
# CX-pntr-01 · Legendary in an item frame: "never destroyed" vs no stable item-frame API

**Statement A (Orbital §5, §9).**
- Legendary weapons "cannot be destroyed by the attack".
- The LMB removes "all other destructible blocks", which includes item frames.

**Statement B (engine, verified in `node_modules/@minecraft/server` 2.10.0 `index.d.ts`).**
- In Bedrock, item frames (`minecraft:frame`, `minecraft:glow_frame`) are **blocks** with a block entity.
- The stable API has **no** `ItemFrame`/frame component, so a script cannot read or take the framed item.
- `setType(air)` on the frame deletes the framed item silently, with no item entity.
- `lgnd.protectLegendariesIn` (via `BlockInventoryComponent`) therefore cannot see it.

**Why it matters.** A player can put a legendary in a frame. An LMB through that frame then deletes the only instance. That breaks C-7′ (no loss) and, depending on `lgnd` recovery, may or may not be re-issued.

**Options (do not self-resolve):**
- (a) **Keep frames.** Add `frame`/`glow_frame` to the column's keep set. This is simple, but it deviates from "all destructible blocks" (a cosmetic deviation, C-15 rank 4).
- (b) **Break frames vanilla-style.** Use `runCommand("setblock x y z air destroy")` so the engine drops the framed item and the frame. Then remove new non-legendary item entities in that cell's AABB, reusing `ring`'s snapshot suppression (`L0-adr-ochg` §3).
- (c) Accept the loss and rely on `lgnd` "destroyed → returned". This only works if `lgnd` detects an instance that vanished without an item entity. That is unverified.

**Recommendation for the reducer.** Option (b) keeps both the spec and C-7′. It needs a BDS probe that `setblock … destroy` on a frame drops its item. The `lgnd` v3 delta should decide whether `protectLegendariesIn` owns frames.

**Resolution (reduce, v3):** resolved by `L0-adr-oprt`.
