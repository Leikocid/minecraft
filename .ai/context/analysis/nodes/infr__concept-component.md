---
type: "concept-component"
node_id: "L0-infr"
source_channel: "rollout"
analysis_version: 5
title: "Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline)"
aliases: ["L0-infr"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 4924
tags: ["devops", "is_a:component", "relates_to:L0-lgnd", "relates_to:L0-strf", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-wrdn", "relates_to:L0-bast", "relates_to:L0-adr-tmpl", "relates_to:L0-adr-strc", "relates_to:L0-adr-strs", "v2-delta"]
level: 1
---
# Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-strf", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-adr-tmpl", "L0-adr-strc", "L0-adr-strs"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, a beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make.

Stage 0's own 5 closing criteria are unchanged and already green [src: stage-0-infrastructure, C-11]. **v2 delta** (Four Structures spec, `L0-adr-tmpl`): infra also owns the toolchain that compiles the four structure templates into shippable `.mcstructure` files, packs them into the behavior pack, and extends the BDS/GameTest verification lanes to prove — structurally, statistically, and across a restart — that structure generation and its one-time init behave as `L0-strf`/`L0-wind`/`L0-airs`/`L0-wrdn`/`L0-bast` specify. Infra builds and runs these checks; it does **not** own the roll algorithm, placement heuristic, or instance registry themselves (owned by `L0-strf`, decided in `L0-adr-strc`/`L0-adr-strs`).

## Inputs
- `src/**/*.ts`, `packs/behavior/`, `packs/resource/`, `packs/gametest/`, `packs/selftest/`, `scripts/targets.mjs` — unchanged from Stage 0.
- **New**: structure template layout sources (per-structure TS/JSON builder definitions): `src/structures/templates/*.ts`, read by `scripts/build-structures.mjs` (`templatesDir`, :22).
- Operator-supplied facts: the iPad's installed Bedrock version.

## Outputs
- `dist/andrew.mcaddon`, `dist/bds-check.log`, `dist/bds-gametest.log`, exit codes — unchanged.
- **New**: `packs/behavior/structures/andrew/*.mcstructure` (generated, gitignored build output — `L0-infr-r007`), a structure round-trip unit-test result, a statistical chunk-roll PASS/FAIL verdict, a restart/idempotency PASS/FAIL verdict — all consumed the same automatic way as existing `bds` evidence [decision-verification-approach-automatic].

## Sub-systems (see child processes for detail)
1. **Build & package** (`npm run build`) — esbuild → **compile structure templates (new)** → validate → zip (`L0-infr-p001`).
2. **Structural validation** (`npm run validate`).
3. **BDS one-shot check** (`npm run bds:check`, `L0-infr-p002`).
4. **GameTest harness** (`npm run bds:gametest`) — the existing Miner's Pickaxe lane (`L0-infr-p003`) **and** the new worldgen/placement + statistical chunk-roll lane (`L0-infr-p006`).
5. **LAN dev server** (`npm run bds:up` / `bds:down` / `bds:logs`, `L0-infr-p004`).
6. **Version targeting** (`scripts/targets.mjs`).
7. **New — structure template pipeline** (`scripts/build-structures.mjs`, `L0-infr-p005`): repo sources → `.mcstructure` NBT, with a round-trip unit test and a BDS 4-rotation placement test.
8. **New — restart/idempotency check** (`L0-infr-p007`): proves a BDS restart never re-runs a structure's one-time init.

## Three verification channels (unchanged shape, wider `bds` content)
- **build** — `tsc --noEmit` + `npm run validate` + (new) the structure round-trip unit test.
- **bds** — `bds:check`, `bds:gametest` (Pickaxe lane), plus the new worldgen/placement, statistical chunk-roll, and restart/idempotency lanes.
- **ipad** — human-eyes-only; now also covers the four structures' visual identity (rendering, silhouette, texture) — a green `bds` structural-count proof never closes an `ipad` criterion [C-6/C-9].

## Known open issues
- CTR-4 — closed 2026-09-24 by `decision-resolve-cool-ctr4`.
- Statistical-check sample size/tolerance and the exact restart mechanism for the idempotency check are infra's own defaults, not spec'd (`L0-infr-as03`, `L0-infr-as04`).

## Boundary
Owns (v2 addition): the structure-template compiler and its round-trip test; packing `structures/` into the behavior pack (already covered by the existing whole-directory zip); the BDS/GameTest lanes that measure structure placement correctness, statistical chunk-roll rate, and restart/idempotency.
Does not own (v2 addition): the chunk-discovery loop, the roll formula/`worldSalt`, the collision heuristic, the instance registry, or loot filling — those belong to `L0-strf`/`L0-loot`; infra only exercises and measures them.
Everything else unchanged from Stage 0 (see prior boundary: build tooling, packaging, JSON/manifest validation, the Docker BDS harness, iPad delivery mechanics, version-target single source of truth; does not own weapon gameplay logic).
