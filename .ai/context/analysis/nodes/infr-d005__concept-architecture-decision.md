---
type: "concept-architecture-decision"
node_id: "L0-infr-d005"
source_channel: "rollout"
analysis_version: 2
title: "ADR: infra's structure-template compiler and BDS/GameTest verification lanes operationalize `L0-adr-tmpl`/`L0-adr-strc`/`L0-adr-strs`"
aliases: ["L0-infr-d005"]
is_a: ["architecture-decision"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 2421
tags: ["is_a:architecture-decision", "relates_to:L0-adr-tmpl", "relates_to:L0-adr-strc", "relates_to:L0-adr-strs", "relates_to:L0-strf", "v2-delta"]
level: 2
---
# ADR: infra's structure-template compiler and BDS/GameTest verification lanes operationalize `L0-adr-tmpl`/`L0-adr-strc`/`L0-adr-strs`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-adr-tmpl", "L0-adr-strc", "L0-adr-strs", "L0-strf"]`

**Context**: `L0-adr-tmpl` decides templates are generated `.mcstructure` files, not hand-built in-game (no Windows editor, no macOS Bedrock client). `L0-adr-strc` decides structures generate via a throttled per-chunk deterministic roll with no chunk-generated event on the stable API. `L0-adr-strs` decides state lives in a sparse regional instance registry with `placed=false→true` idempotency. None of the three specify how these get *tested* beyond "a unit test round-trips each file" and "a BDS test places each template in 4 rotations" (both from `L0-adr-tmpl`). Infra owns the actual test harness that proves the rest.

**Decision**:
1. `scripts/build-structures.mjs` runs as a new step inside `npm run build`, before `validatePacks()`, so a structural template error fails the build the same way an esbuild/validation error does (`L0-infr-p005`).
2. The BDS placement test is a new GameTest scenario in `packs/gametest`, not a bare `bds:check` extension — it needs `structureManager.place`/`SimulatedPlayer`, both beta-only APIs, so `L0-infr-d002`'s isolation rule (dev-only pack, `gametest` world, Beta APIs experiment never on the everyday `andrew` world) applies unchanged. It runs the 4-rotation matrix `L0-adr-tmpl` specifies (`L0-infr-p006`).
3. The statistical chunk-roll check and the restart/idempotency check reuse the same `gametest` world and Beta-APIs pattern rather than standing up a third world, to avoid a second version-pin/port surface.
4. All three new checks are `bds`-channel: automatic, log/registry-derived PASS/FAIL, no operator step when green [decision-verification-approach-automatic].

**Rejected alternative**: verify structure placement only visually on the iPad. Rejected — `L0-adr-strc`/`L0-adr-strs` exist precisely because placement, rotation, one-time init and idempotency are provable from engine state; `C-9` reserves the iPad for what genuinely can't be (visual identity only).

**Status**: proposed (mirrors `L0-adr-tmpl`'s status) — accepted once the `strf` probe (per the L0 v2 decomposition plan) confirms `structureManager.place` preserves block-entity and rotation data on BDS 1.26.51.1.
