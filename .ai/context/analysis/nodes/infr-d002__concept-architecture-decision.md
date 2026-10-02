---
type: "concept-architecture-decision"
node_id: "L0-infr-d002"
source_channel: "rollout"
analysis_version: 5
title: "ADR: GameTest stays a separate, beta-only, non-shipping lane"
aliases: ["L0-infr-d002"]
is_a: ["architecture-decision"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1158
tags: ["is_a:architecture-decision", "relates_to:L0-lgnd"]
level: 2
---
# ADR: GameTest stays a separate, beta-only, non-shipping lane

**Links:** `part_of: ["L0-infr"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-lgnd"]`

**Context**: `@minecraft/server-gametest` has no stable channel, and the project's hard constraint is stable-only APIs in the shipped product, no experimental toggles in any manifest [C-2].

**Decision**: isolate GameTest completely — its own dev-only pack (`packs/gametest`, never zipped into `dist/andrew.mcaddon`), its own world (`LEVEL_NAME=gametest`, superflat), the Beta APIs experiment enabled only in that world's `level.dat` (patched by script, never a persistent config on the everyday `andrew` world).

**Rejected alternative**: enable the Beta APIs experiment on the everyday `andrew` world so `bds:check`/`bds:up`/`bds:gametest` could share one world and simpler tooling — rejected because it would make the world iPad testers and `bds:check` exercise not representative of the actual release config, and would risk beta-only behavior leaking into what the `ipad` channel is supposed to prove about the real product.

**Status**: accepted, implemented in `scripts/bds-gametest.mjs`.
