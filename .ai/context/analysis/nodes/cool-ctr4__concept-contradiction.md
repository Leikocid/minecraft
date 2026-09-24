---
type: "concept-contradiction"
node_id: "cool-ctr4"
source_channel: "rollout"
analysis_version: 1
title: "CTR-4 · Version targets differ between sources (covered by a decision; the raw spec is out of date)"
aliases: ["cool-ctr4"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 729
tags: ["target:L0-infr","status:open","category:source-vs-source","severity:low","title:API/engine version targets differ","resolved"]
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-cool-ctr4
---

# CTR-4 · Version targets differ between sources (covered by a decision; the raw spec is out of date)

- `minerspickaxetestspec` "Compatibility target": `@minecraft/server` **2.9.0**, `min_engine_version` **1.26.0**.
- `stage-0-infrastructure`: 2.9.0, "if needed 2.10.0".
- `analysis/constraints.md` + `scripts/targets.mjs` + `package.json`: pinned **2.10.0**, engine **[1,26,50]**, BDS 1.26.51.1.

The code follows `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001`, which also matches the pickaxe spec's rule to retarget from the actual game version. The contradiction is between raw sources only; no code change is needed. Keep it open until the raw specs are annotated, so later readers don't retarget back to 2.9.0.
