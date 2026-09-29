---
type: "concept-contradiction"
node_id: "L0-orbc-cx03"
source_channel: "rollout"
analysis_version: 3
title: "CX-orbc-03 · Nether \"+10 to avoid ceiling problems\" vs \"spawn inside solid → detonate immediately\""
aliases: ["L0-orbc-cx03"]
is_a: ["contradiction"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1662
tags: ["is_a:contradiction", "category:source-vs-source", "severity:low", "status:resolved", "target:L0-orbc", "relates_to:L0-orbc-r007", "relates_to:L0-orbc-r008", "relates_to:L0-ring", "relates_to:L0-pntr", "nether", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-oded
level: 2
---
# CX-orbc-03 · Nether "+10 to avoid ceiling problems" vs "spawn inside solid → detonate immediately"

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-orbc-r007", "L0-orbc-r008", "L0-ring", "L0-pntr"]`

**Target:** `L0-orbc`. **Category:** spec-internal. **Severity:** low. **Status:** resolved by `L0-adr-oded` (reduce, v3).

- **§8.** In the Nether, charges spawn at +10 "to reduce problems with the bedrock ceiling". A coordinate above the limit is clamped to the maximum. A charge spawned inside a solid block triggers **immediately** there.
- The Nether's bedrock roof fills Y ≈ 123–127, and `heightRange.max − 1 = 127`. Any target with Y ≥ 113 therefore gets `spawnY` in the roof, either by the +10 or by the clamp. So the charge detonates **in the roof**, not at the target:
  - **RMB:** the blast happens at the ceiling. The player sees no effect near the target.
  - **LMB:** the column starts at the roof and runs through the target to the bottom, keeping bedrock (`xasm6`). That is effectively fine.
- The literal rules defeat the stated intent for high Nether targets. The same happens under any low solid overhang in the Overworld or End, and that case is intended ("trigger immediately").

**Options.**
- (a) Literal: keep it as specified, and document it.
- (b) For the Nether only, lower `spawnY` to the first non-solid cell at or below `min(target.y+10, 127)`, above the target. A charge then never starts inside the roof bedrock.
- (c) Skip only `minecraft:bedrock` cells at spawn in the Nether.

**Autopilot default:** (a) with a C-16 note, because it follows the literal §8 rule and AC-5. This needs a client answer if Nether-roof PvP matters.
