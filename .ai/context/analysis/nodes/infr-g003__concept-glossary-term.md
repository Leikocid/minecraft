---
type: "concept-glossary-term"
node_id: "L0-infr-g003"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g003"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 634
tags: ["is_a:glossary-term"]
level: 2
---
**SimulatedPlayer / GameTest harness**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

`@minecraft/server-gametest`'s API for scripting an artificial player inside a running Bedrock world — movement, mining, item use — without a real client. Beta-only (no stable channel), so it's confined to a dev-only pack (`packs/gametest`) and a dedicated, experiments-enabled world (`LEVEL_NAME=gametest`), driven here by `npm run bds:gametest`. Used both for single-player scripted-behavior proof and, per `decision-q-012`, as the accepted stand-in for multiplayer proof (two `SimulatedPlayer`s instead of two physical devices).
