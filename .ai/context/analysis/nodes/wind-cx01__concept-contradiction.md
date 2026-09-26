---
type: "concept-contradiction"
node_id: "L0-wind-cx01"
source_channel: "rollout"
analysis_version: 2
title: "CX-wind-01 · The spawn Windmill is \"100 %\" but must be on dry land — undefined when there is no dry land within 500 blocks"
aliases: ["L0-wind-cx01"]
is_a: ["contradiction"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1300
tags: ["is_a:contradiction", "category:assumption-gap", "severity:medium", "status:open", "target:L0-wind", "spawn-windmill", "relates_to:L0-wind-r007", "relates_to:L0-wind-p002"]
level: 2
---
# CX-wind-01 · The spawn Windmill is "100 %" but must be on dry land — undefined when there is no dry land within 500 blocks

**Links:** `part_of: ["L0-wind"]` · `is_a: ["contradiction"]` · `relates_to: [L0-wind-r007, L0-wind-p002, L0-wind-e002]`
**Target:** `L0-wind` · **Category:** assumption-gap · **Severity:** medium · **Status:** open.

- §4.7.6: the spawn Windmill is mandatory, 100 %. §11 DoD: "фактически гарантирована".
- §4.7.9 / §9.1: forced prep picks "лучшую доступную **сухую наземную** позицию"; "при наличии сухой позиции форсировать".
- A world spawning on a small island or in a large ocean area (possible on custom seeds, or when the only land within 500 blocks is covered by villages/structures) has no eligible position. The spec says nothing about this case. Forced prep may replace liquids, which could mean building on water — but that contradicts "сухую".

**Options:**
- (a) Record `status:"failed", reason:"noDryLand"`, no spawn Windmill, deviation logged. **Autopilot default** — keeps the "dry land" and "don't damage structures" rules intact.
- (b) Relax to "least-wet" site: allow shallow liquid (≤ 3 deep) to be filled as part of prep.
- (c) Extend the radius beyond 500.

Needs a client answer; the BDS test uses a normal seed, so it does not block implementation.
