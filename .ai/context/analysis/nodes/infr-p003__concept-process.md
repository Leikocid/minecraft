---
type: "concept-process"
node_id: "L0-infr-p003"
source_channel: "rollout"
analysis_version: 1
title: "Process: GameTest harness (`npm run bds:gametest`)"
aliases: ["L0-infr-p003"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 2842
tags: ["is_a:process", "relates_to:L0-lgnd"]
level: 2
---
# Process: GameTest harness (`npm run bds:gametest`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]` · `relates_to: ["L0-lgnd"]`

## Purpose
Drive a Miner's Pickaxe scenario through a `SimulatedPlayer` on the real Bedrock engine, with no human and no iPad — the automatable half of gameplay verification that a static/log check can't reach (actual mining speed, actual block interaction).

## Why not a one-liner — three BDS gaps this script works around (docs/dev/gametest-on-bds.md)
1. **No supported way to turn on the Beta APIs experiment.** No `server.properties` key, no env var. The flag lives in the world's `level.dat` NBT, which only exists after world generation — so the server boots once to generate the world, the script reads/patches the NBT (`readNbt`/`writeNbt`), and the server boots again with the experiment on.
2. **`register()` refuses to run without a committed `.mcstructure`.** Rather than checking in a binary structure blob, `writeStructure()` generates the test platform's `.mcstructure` at run time.
3. **The image's `send-command` can't find the server process under Rosetta** (it matches by `/proc` exe symlink, which points at the emulator for every process there). `sendCommand()` instead matches by cmdline and writes to the process's stdin directly.

## Isolation from the release build
- `@minecraft/server-gametest` (`1.0.0-beta.1.26.51-stable`) is a devDependency only; `packs/gametest` is never zipped into `dist/andrew.mcaddon` [C-2].
- Runs in its own world (`LEVEL_NAME=gametest`, `LEVEL_TYPE=FLAT` — a default/DEFAULT world's origin can land underwater, e.g. y=53 in an ocean, which is 5x slower to mine and can drown the simulated player inside the test's tick budget). The everyday `andrew` world used by `bds:check`/`bds:up` never gets the experiments flag or the gametest pack.

## Flow (scripts/bds-gametest.mjs)
`main()` → assert compose version pin + Docker → (build unless `--no-build`) → `up()` boots the container once to generate the `gametest` world → patch `level.dat` to enable Beta APIs (`enableBetaApis()`) → write the test structure (`writeStructure()`) → bundle and install `packs/gametest` alongside behavior+resource (`bundleGameTestScript()`, `installPacks()`) → reboot → `waitFor()` polls the log for completion markers up to a deadline → `sendCommand()` for any in-test console interaction → `analyzeLog()` produces the verdict → `--keep-up` leaves the server running for manual inspection instead of tearing down.

## CLI
`npm run bds:gametest`, `-- --no-build --timeout 600`, `-- --keep-up`.

## Relation to multiplayer proof
Per `decision-q-012` (two-player DoD), GameTest with two `SimulatedPlayer`s is the accepted proof of scripted multiplayer behaviour (craft races, shared world state) for legendary weapons (`L0-lgnd`); a live two-iPad test is not required.
