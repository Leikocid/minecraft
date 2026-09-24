---
type: "concept-entity"
node_id: "L0-infr-e002"
source_channel: "rollout"
analysis_version: 1
title: "Entity: selftest pack (`packs/selftest`)"
aliases: ["L0-infr-e002"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1095
tags: ["is_a:entity"]
level: 2
---
# Entity: selftest pack (`packs/selftest`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

Dev-only behavior pack. Own manifest (own uuid, distinct from the release packs — `validateSelfTestPack` checks it doesn't duplicate them), own script entry, bundled by the same `build.mjs`/esbuild path as the release script (`bundleSelfTest()`) so what runs in the check is provably the same toolchain as production, not a hand-maintained duplicate.

Loaded only by `bds-check.mjs`, directly from the working tree — never packaged into `dist/andrew.mcaddon`. Its script, once the world loads, exercises in-engine assertions and prints `[selftest] PASS/FAIL <name>` per check and a terminal `[selftest] DONE passed=N failed=M` summary to the BDS log, which is the authoritative verdict source (counters win over individual lines, so log truncation can't turn a real FAIL into a read PASS).

Compiled with an `__SELFTEST_FIXTURE__` esbuild `--define` flag: `false` normally, `true` only for `--break-selftest` negative-test runs (a deliberately-failing fixture proves the check itself can fail).
