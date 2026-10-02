---
type: "concept-rule"
node_id: "L0-strf-r006"
source_channel: "rollout"
analysis_version: 5
title: "Rule: collision cancels the candidate. Existing structures and spawners are never damaged."
aliases: ["L0-strf-r006"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1633
tags: ["is_a:rule", "collision", "heuristic", "relates_to:L0-xasm3", "relates_to:L0-strf-d004"]
level: 2
---
# Rule: collision cancels the candidate. Existing structures and spawners are never damaged.

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

A candidate is cancelled if its rotated **3D** AABB, expanded by a 2-block margin (`L0-strf-d004`), intersects any of the following (§2, §6, §13.2, §14.2, §15):
1. **Custom structures.** The AABB of any `InstanceRecord` in any state, including `planned` and `failed`. The check reads the shards covering the AABB plus 1 region margin.
2. **Protected spawners.** Any `minecraft:mob_spawner` or `minecraft:trial_spawner` block, vanilla or ours (`L0-xasm3`).
3. **Vanilla structures (heuristic).** A sparse volume probe (step 4, step 2 near the surface layer) finds a signature block from `L0-xasm3`'s list: village/temple/mineshaft/stronghold/ancient city/bastion/fortress/trial chamber markers, plus `chest`, `barrel` and `bell`. A block counts only when it is not natural for the dimension and depth. For example, `deepslate_tiles` counts, `deepslate` does not.

- The whole check runs **before** reservation and again right before `place` (`L0-strf-p003`).
- Normal candidates are cancelled. The spawn Windmill and the linked Airship try their next origin (`L0-strf-r002` §5).
- **Known limitation, for the deviation report:** structures made only of natural-looking blocks (e.g. ruined portals partly, igloos' surface part, pillager outposts' logs) may be missed. Probing is sparse, so thin features can slip between samples. This is accepted per §7 "наиболее безопасная доступная эвристика".
- `strf` never calls `/locate` and never reads structure data. Stable APIs offer neither.
