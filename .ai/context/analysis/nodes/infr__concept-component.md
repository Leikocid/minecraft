---
type: "concept-component"
node_id: "L0-infr"
source_channel: "rollout"
analysis_version: 1
title: "Component: Build & verification infrastructure (Stage 0)"
aliases: ["L0-infr"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 4222
tags: ["is_a:component", "relates_to:L0-lgnd", "devops"]
level: 1
---
# Component: Build & verification infrastructure (Stage 0)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, an optional beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make (rendering, icons, Creative placement, RU/EN names).

This is Stage 0 of the project: nothing in Stage 1 (Miner's Pickaxe) or Stage 2 (legendary weapons) starts until this component's own 5 closing criteria are green [src: stage-0-infrastructure, C-11].

## Inputs
- `src/**/*.ts` — behavior-pack script sources (single entry `src/main.ts`), plus dev-only sources under `src/selftest/`
- `packs/behavior/`, `packs/resource/` (static manifests, textures, lang files) — hand-authored, not generated
- `packs/gametest/`, `packs/selftest/` — dev-only packs, never shipped
- `scripts/targets.mjs` — the single source of truth for version targets
- Operator-supplied facts: the iPad's installed Bedrock version (read manually from Settings)

## Outputs
- `dist/andrew.mcaddon` — the release archive (behavior + resource only)
- `dist/bds-check.log`, `dist/bds-gametest.log` — saved server logs, the evidence artifacts `/verify` attaches to run-check
- Process exit code 0/1 from every `npm run bds:*` / `npm run validate` / `npm run build` command — this is what ai-kit's autopilot reads to close build/bds-typed acceptance criteria without an operator [src: decision-verification-approach-automatic]
- A running LAN server (`npm run bds:up`) and a printed `ip:19132` address for the iPad

## Sub-systems (see child processes for detail)
1. **Build & package** (`npm run build`) — esbuild → validate → zip
2. **Structural validation** (`npm run validate`, also called from build) — manifests + every JSON under `packs/**`
3. **BDS one-shot check** (`npm run bds:check`) — creative world, in-engine selftest pack, log-verdict
4. **GameTest harness** (`npm run bds:gametest`) — beta-only, SimulatedPlayer, separate world
5. **LAN dev server** (`npm run bds:up` / `bds:down` / `bds:logs`) — Survival+cheats, iPad joins over the network
6. **Version targeting** (`scripts/targets.mjs`, `scripts/set-version.mjs`) — one file, two scripts, keeps every manifest, `compose.yaml` and `package.json` in agreement

## Three verification channels
- **build** — `tsc --noEmit` + `npm run validate`: proves the TS compiles against `@minecraft/server` 2.10.0 types and every JSON is structurally valid. Mac only, no Docker.
- **bds** — `npm run bds:check` (creative, one-shot, self-terminating) and `npm run bds:gametest` (beta, SimulatedPlayer): proves the packs actually load on the real engine, the script executes, and — for GameTest — that specific gameplay behaves as specified, all from a log or exit code alone.
- **ipad** — human-eyes-only: rendering, icons, Creative inventory placement, RU/EN names. A green `bds` run never closes an `ipad` criterion [C-6]; these criteria are typed `manual` and don't block merge/autopilot [decision-verification-approach-automatic].

## Known open issue
CTR-4 (open, target `L0-infr`): the raw specs (`minerspickaxetestspec`, `stage-0-infrastructure`) still quote `@minecraft/server` 2.9.0 / engine 1.26.0 — superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` and the code (`scripts/targets.mjs`: 2.10.0 / [1,26,50] / BDS 1.26.51.1). No code fix needed; the raw docs just haven't been annotated. Not re-filed here.

## Boundary
Owns: build tooling, packaging, JSON/manifest validation, the Docker BDS harness (both the one-shot check and the GameTest lane), the iPad delivery mechanics (import + LAN), and the version-target single source of truth.
Does not own: the gameplay logic that BDS/GameTest exercise (Miner's Pickaxe, Web Sword, Scythe, the `lgnd` legendary-weapon framework) — those are separate components that *consume* this one's verification channels.
