---
type: "concept-rule"
node_id: "L0-infr-r001"
source_channel: "rollout"
analysis_version: 1
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

`scripts/targets.mjs` is the sole source for three constants: `MIN_ENGINE_VERSION = [1,26,50]`, `SERVER_API_VERSION = '2.10.0'`, `BDS_VERSION = '1.26.51.1'`. Every manifest, `docker/bds/compose.yaml`'s `VERSION`, and the README must agree with it; nothing else may hardcode these as literals [C-2, C-3]. `validate.mjs` and `bds-gametest.mjs` both import from `targets.mjs` directly rather than duplicating the values. `assertComposePinsVersion()` (run at the top of both `bds:check` and `bds:up`) fails the run immediately if `compose.yaml`'s `VERSION` env drifts from `BDS_VERSION`.

**On a version/dependency error** from the game or BDS (`Unsupported version`, `Missing dependency: @minecraft/server …`, `Pack format version mismatch`): read the error text, update the one matching constant in `targets.mjs`, then `npm ci && npm run build` and re-check. **Never** enable a `-beta`/`-preview`/`-rc` module or an experiments toggle to make the error disappear — that hides a real incompatibility instead of fixing it [C-3; README §7].

**Rationale for centralizing**: hand-syncing the version across every manifest was missed twice on 2026-09-20 (`set-version.mjs` header comment) — the fix was a script (`npm run version:set -- <x.y.z>`) that rewrites `package.json`, `package-lock.json`, and every `packs/*/manifest.json` header/module/dependency version in one pass, because the iPad treats same-uuid + same-version as "already imported" and needs a bump on every content change.
