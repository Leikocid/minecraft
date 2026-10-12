---
type: "concept-contradiction"
node_id: "L0-pear-cx02"
source_channel: "rollout"
analysis_version: 11
title: "CX-pear-02 · \"Cancel the cast\" vs a recorded claim that stable API cannot switch fishing off on a real rod"
aliases: ["L0-pear-cx02"]
is_a: ["contradiction"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1556
tags: ["v11", "pearl-rod", "contradiction", "assumption-gap", "fishing-cancel", "status:resolved", "resolved"]
level: 2
closed_at: 2026-10-12
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-prcn
---
# CX-pear-02 · "Cancel the cast" vs a recorded claim that stable API cannot switch fishing off on a real rod

**Target:** L0-adr-prbd §5 ("`beforeEvents.itemUse` cancels the cast").

**Side A (ADR).** A bound use by its owner cancels `beforeEvents.itemUse`, so no bobber is cast and the teleport starts instead (spec: "инициирует телепортацию… вместо нового заброса" — "starts the teleport instead of a new cast").

**Side B (existing deviation record).** `src/orbital/README.md` item 1 (`L0-xcx13`) says the Orbital Cannon is a custom item "because stable API cannot switch fishing off on one" (a real fishing rod).
- That statement was about switching fishing off **permanently**, not about cancelling one use.
- No probe that cancels `itemUse` on `minecraft:fishing_rod` has been run. Whether the client predicts the cast (the line appears and then snaps back) is unknown.

**Category:** assumption-gap (missing evidence), not yet a proven conflict. The probe item "a cancelled `beforeEvents.itemUse` on a vanilla rod casts nothing" settles it.

**Outcomes:**
- **Cancel works on the server and the client:** the ADR stands.
- **The server spawns no hook, but the iPad shows a line flicker:** ship it, and list the flicker as an iPad item.
- **Cancel does not stop the hook:** use the fallback in `L0-pear-pr03` §1. Allow the cast, `hook.remove()` at `entitySpawn` +0, then teleport. Ownership must then come from the `itemUse` correlation, and the `ipad` check covers the visual.

**Not affected:** the binding and non-owner paths, which never cancel.
