---
type: "concept-rule"
node_id: "L0-infr-r002"
source_channel: "rollout"
analysis_version: 5
title: "Rule: verification is split across three channels, and only two of them are automatic"
aliases: ["L0-infr-r002"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1314
tags: ["is_a:rule"]
level: 2
---
# Rule: verification is split across three channels, and only two of them are automatic

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

- **build** — `tsc --noEmit` (types) + `npm run validate` (manifest/JSON structure). Mac-only, no Docker.
- **bds** — `npm run bds:check` / `npm run bds:gametest`. Proves pack loading, manifest/dependency errors, and script/gameplay execution from a Bedrock Dedicated Server log or in-engine GameTest assertions.
- **ipad** — human-eyes-only: rendering, icon, Creative-inventory placement, RU/EN names. **A green `bds` run never closes an `ipad` criterion** [C-6] — the engine-log analysis in `bds:check` can prove the resource pack was *accepted*, but not that it *renders* correctly.

Per `decision-verification-approach-automatic` (full autopilot, 2026-09-20): `build` and `bds` criteria are typed `build`/`unit`/`e2e` and closed automatically by `/verify` from run-check artifacts, no operator involved when green. `ipad` criteria are typed `manual`, are planned minimally, and **do not block merge/autopilot** — they stay open until an operator confirms them (`task_accept` / board button). Auto-smelt specifically must be verified in a **Survival** world; Creative suppresses drops [C-9], so `bds:up` always starts Survival+cheats while `bds:check` stays Creative.
