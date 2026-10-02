---
type: "concept-glossary-term"
node_id: "L0-infr-g002"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g002"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 502
tags: ["is_a:glossary-term"]
level: 2
---
**.mcaddon**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A zip archive containing one or more Minecraft Bedrock behavior/resource packs — Minecraft's native add-on import format. This project's build produces exactly one, `dist/andrew.mcaddon`, containing only the `behavior` and `resource` pack directories (never the dev-only `selftest`/`gametest` packs). Importing it on the iPad installs both packs; re-importing the same uuid+version is a no-op from the device's point of view.
