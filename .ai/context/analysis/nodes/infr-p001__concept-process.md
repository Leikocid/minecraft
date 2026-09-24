---
type: "concept-process"
node_id: "L0-infr-p001"
source_channel: "rollout"
analysis_version: 1
title: "Process: Build & package (`npm run build`)"
aliases: ["L0-infr-p001"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1907
tags: ["is_a:process"]
level: 2
---
# Process: Build & package (`npm run build`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]`

## Steps (scripts/build.mjs)
1. **Bundle the release script** — esbuild compiles `src/main.ts` → `packs/behavior/scripts/main.js` (`--bundle --format=esm --platform=neutral --external:@minecraft/*`; the `@minecraft/*` modules stay external, they are runtime-provided by the engine, never bundled).
2. **Bundle the selftest script** — same esbuild flags, `src/selftest/main.ts` → `packs/selftest/scripts/main.js` (via the exported `bundleSelfTest()`, shared with `bds-check.mjs` so a `--break-selftest` fixture run exercises the identical bundling path as a normal run).
3. **Validate** — `validatePacks()` over `packs/behavior` + `packs/resource`, and `validateSelfTestPack()` over `packs/selftest`, both with `requireScriptEntry: true`. Any error aborts the build (`throw new Error("validate: N error(s)")`) after printing every message to stderr.
4. **Package** — zips `packs/behavior` and `packs/resource` (not `selftest`, not `gametest`) into `dist/andrew.mcaddon`, deleting any prior archive first. `-x '*.DS_Store'` excludes macOS junk. `tests/selftest-pack.test.mjs` asserts the archive's two top-level directory names and that `selftest`/`gametest` never appear in it.

## Trigger
`npm run build` directly, or transitively from `bds:check`/`bds:up`/`bds:gametest` unless invoked with `--no-build`.

## Failure modes
- esbuild error (TS type error surfaces separately via `npm run typecheck`, which `build.mjs` does **not** run — `tsc --noEmit` is a distinct npm script) → non-zero exit, no archive produced.
- Validation error → build aborts before packaging; nothing overwrites the last good `dist/andrew.mcaddon`.

## Invariant
Must succeed from a clean clone with no manual steps or machine-specific paths [C-7] — `scripts/build-clean-clone.sh` exists specifically to prove this in isolation.
