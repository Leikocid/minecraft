---
type: "concept-glossary-term"
node_id: "L0-infr-g001"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g001"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 544
tags: ["is_a:glossary-term"]
level: 2
---
**BDS (Bedrock Dedicated Server)**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

The official headless Minecraft Bedrock server binary. Ships Linux x86_64 only — no native macOS build — so on the Mac mini (Apple Silicon) it runs inside Docker under Rosetta 2, via the `itzg/minecraft-bedrock-server` image [C-5]. Two roles in this project: the one-shot automated check (`bds:check`) and the manual LAN dev server the iPad joins (`bds:up`).

**Synonyms**: Bedrock Dedicated Server, "the server", the `bds` verification channel.
