---
type: "concept-assumption"
node_id: "L0-infr-as02"
source_channel: "rollout"
analysis_version: 5
title: "Assumption: verification runs locally, not in hosted CI"
aliases: ["L0-infr-as02"]
is_a: ["assumption"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1028
tags: ["is_a:assumption"]
level: 2
---
# Assumption: verification runs locally, not in hosted CI

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]`

**Assumed**: no CI/CD pipeline automates `build`/`bds:check`/`bds:gametest` on push; these commands are run manually by the developer, or by the ai-kit autopilot task loop, on the Mac mini itself. No `.github/workflows` or equivalent was found in the repo listing reviewed for this deep-dive, and the `bds` channel's design assumes local, macOS-specific facts that a typical hosted runner wouldn't have: Docker Desktop already running (`assertDockerRunning` just checks, never installs, Docker), `en0`/`en1` LAN interfaces for `detectLanIp()`, and Apple Silicon + Rosetta for the image's `linux/amd64` platform pin.

**Impact if wrong**: if a hosted CI runner is later introduced, `bds:up`'s LAN-IP detection and the iPad-facing address it prints become meaningless there (no iPad can reach a CI runner's network), and `assertDockerRunning`'s guidance ("start Docker Desktop") would need a CI-specific branch.
