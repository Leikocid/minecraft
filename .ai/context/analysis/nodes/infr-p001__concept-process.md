---
type: "concept-process"
node_id: "L0-infr-p001"
source_channel: "rollout"
analysis_version: 5
title: "Process: Build & package (`npm run build`)"
aliases: ["L0-infr-p001"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 2027
tags: ["is_a:process", "relates_to:L0-infr-p005"]
level: 2
---
# Process: Build & package (`npm run build`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]` · `relates_to: ["L0-infr-p005"]`

## Steps (scripts/build.mjs)
1. **Bundle the release script** — esbuild compiles `src/main.ts` → `packs/behavior/scripts/main.js` (`--bundle --format=esm --platform=neutral --external:@minecraft/*`).
2. **Bundle the selftest script** — same esbuild flags, `src/selftest/main.ts` → `packs/selftest/scripts/main.js` (via `bundleSelfTest()`).
3. **Compile structure templates (v2, new)** — `scripts/build-structures.mjs` compiles the four structures' checked-in layout sources into `.mcstructure` NBT under `packs/behavior/structures/andrew/`, then round-trips each file to assert its block-entity counts against the source definition. Runs before validation so a bad template aborts the build the same way a validation error does. See `L0-infr-p005`.
4. **Validate** — `validatePacks()` over `packs/behavior` + `packs/resource`, and `validateSelfTestPack()` over `packs/selftest`, both with `requireScriptEntry: true`. Any error aborts the build (`throw new Error("validate: N error(s)")`).
5. **Package** — zips `packs/behavior` (now including its `structures/andrew/` subtree) and `packs/resource` into `dist/andrew.mcaddon`, deleting any prior archive first. `-x '*.DS_Store'` excludes macOS junk. `tests/selftest-pack.test.mjs` asserts the archive's two top-level directory names and that `selftest`/`gametest` never appear in it.

## Trigger
`npm run build` directly, or transitively from `bds:check`/`bds:up`/`bds:gametest` unless invoked with `--no-build`.

## Failure modes
- esbuild error → non-zero exit, no archive produced.
- Structure round-trip mismatch (v2) → build aborts before validation/packaging.
- Validation error → build aborts before packaging; nothing overwrites the last good `dist/andrew.mcaddon`.

## Invariant
Must succeed from a clean clone with no manual steps or machine-specific paths [C-7 [sic, C-8]] — `scripts/build-clean-clone.sh` proves this in isolation.
