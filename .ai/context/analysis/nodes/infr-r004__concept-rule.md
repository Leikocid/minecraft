---
type: "concept-rule"
node_id: "L0-infr-r004"
source_channel: "rollout"
analysis_version: 1
title: "Rule: the selftest pack proves content from inside the engine but never ships"
aliases: ["L0-infr-r004"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1088
tags: ["is_a:rule"]
level: 2
---
# Rule: the selftest pack proves content from inside the engine but never ships

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`packs/selftest` is a dev-only behavior pack, bundled by `npm run build` (`bundleSelfTest()`) but deliberately **excluded** from `dist/andrew.mcaddon` — only `bds-check.mjs` installs it, straight from the working tree, alongside the release packs. `tests/selftest-pack.test.mjs` asserts the archive's two directory names explicitly, so the selftest pack cannot leak into a release by accident.

It runs inside the engine at world load and prints its own verdict lines (`[selftest] PASS/FAIL …`, terminated by `[selftest] DONE passed=N failed=M`) to the BDS log, which `analyzeLog()` reads as ground truth *independent of* the log-scraping heuristics used for the release script. `--break-selftest` rebundles it with a deliberately-failing fixture (`__SELFTEST_FIXTURE__` esbuild `--define`) for negative testing of the check itself, then unconditionally rebundles clean afterward — so a `--no-build` run right after never inherits the sabotaged bundle.
