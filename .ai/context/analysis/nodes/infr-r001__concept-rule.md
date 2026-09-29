---
type: "concept-rule"
node_id: "L0-infr-r001"
source_channel: "rollout"
analysis_version: 2
title: "Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel"
aliases: ["L0-infr-r001"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1652
tags: ["is_a:rule"]
level: 2
---
# Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`scripts/targets.mjs` is the sole source for three constants: `MIN_ENGINE_VERSION = [1,26,50]`, `SERVER_API_VERSION = '2.10.0'`, `BDS_VERSION = '1.26.51.1'`. Every manifest, `docker/bds/compose.yaml`'s `VERSION`, and the README must agree with it; literal copies that exist: `package.json:27` (npm types, unguarded), `README.md:8-10` (unguarded), `docker/bds/compose.yaml:20` (guarded), `tests/validate.test.mjs:35,41,44,54` (test expectations) [C-2, C-3]. `validate.mjs`, `bds-lib.mjs` (BDS_VERSION), `lib/mcstructure.mjs` (MIN_ENGINE_VERSION) and tests `gametest-pack`/`selftest-pack` import from `targets.mjs`; `bds-gametest.mjs` reaches them through `bds-lib.mjs`. `assertComposePinsVersion()` (run at the top of `bds:check`, `bds:up` and `bds:gametest`) fails the run immediately if `compose.yaml`'s `VERSION` env drifts from `BDS_VERSION`.

**On a version/dependency error** from the game or BDS (`Unsupported version`, `Missing dependency: @minecraft/server …`, `Pack format version mismatch`): read the error text, update the matching constant in `targets.mjs`; for `SERVER_API_VERSION` also `npm install @minecraft/server@<x> --save-exact` (`package.json:27` + lock: `npm ci` alone keeps compiling against the old types), the manifests (`validate` forces them), `README.md:8-10` and `tests/validate.test.mjs:35,41,44,54`; then `npm run build` and re-check. **Never** enable a `-beta`/`-preview`/`-rc` module or an experiments toggle to make the error disappear — that hides a real incompatibility instead of fixing it [C-3; README §7].

**Rationale for centralizing**: hand-syncing the version across every manifest was missed twice on 2026-09-20 (`set-version.mjs` header comment) — the fix was a script (`npm run version:set -- <x.y.z>`) that rewrites `package.json`, `package-lock.json`, and every `packs/*/manifest.json` header/module/dependency version in one pass, because the iPad treats same-uuid + same-version as "already imported" and needs a bump on every content change.
