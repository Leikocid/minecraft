---
type: "concept-architecture-decision"
node_id: "L0-infr-d003"
source_channel: "rollout"
analysis_version: 5
title: "ADR: one module (`scripts/targets.mjs`) is the single source of truth for version targets"
aliases: ["L0-infr-d003"]
is_a: ["architecture-decision"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1353
tags: ["is_a:architecture-decision"]
level: 2
---
# ADR: one module (`scripts/targets.mjs`) is the single source of truth for version targets

**Links:** `part_of: ["L0-infr"]` · `is_a: ["architecture-decision"]`

**Context**: three version-like values (`min_engine_version`, the `@minecraft/server` module version, the BDS server version) must agree across manifests, `docker/bds/compose.yaml`, and documentation. Hand-syncing them was tried first and failed silently twice on 2026-09-20 (per `scripts/set-version.mjs`'s own header comment).

**Decision**: centralize the three constants in `scripts/targets.mjs`, imported by `validate.mjs`, `bds-lib.mjs` and `lib/mcstructure.mjs` (`bds-gametest.mjs` reaches them through the last two); enforce the Docker side with a runtime assertion (`assertComposePinsVersion`, run at the top of `bds:check`/`bds:up`) rather than trusting the file to stay in sync by convention alone. A companion script, `version:set`, rewrites `package.json` + `package-lock.json` + every manifest's version fields atomically for the *product* version (separate from the three target constants, which change only on a retarget).

**Rejected alternative**: keep the literals hand-duplicated in each manifest, `compose.yaml`, and the README, relying on code review to catch drift — empirically rejected; this is exactly what caused the two missed bumps that motivated the fix.

**Status**: accepted, in force since before Stage 0's first commit.
