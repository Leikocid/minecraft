---
type: "concept-rule"
node_id: "L0-wind-r013"
source_channel: "rollout"
analysis_version: 2
title: "Rule: the spawn search completes before normal discovery may place anything near spawn"
aliases: ["L0-wind-r013"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 940
tags: ["is_a:rule", "spawn-windmill", "ordering", "relates_to:L0-strf-p001", "relates_to:L0-wind-p002", "relates_to:L0-wind-ad01"]
level: 2
---
# Rule: the spawn search completes before normal discovery may place anything near spawn

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-p001, L0-wind-p002, L0-wind-ad01]`

**Source:** derived from §4.7 (guarantee, nearest site) + §2/§6 (no overlaps, existing structures win).

- While `andrew:st:spawn.status` is non-terminal, the `strf` worker leaves Overworld chunks within 548 blocks of spawn (500 + plot half-diagonal) un-evaluated (not rolled, evaluated bit not set). They are processed normally once the status is terminal.
- Reason: otherwise a 5 % Warden City or 2 % Airship rolled in the first seconds could occupy the best spawn site and push the guaranteed Windmill farther or into forced prep.
- Once placed, the spawn Windmill is a registry instance; later normal candidates that overlap it are cancelled.
- Gate is in-memory + derived from the persisted status, so it survives restarts.
