---
type: "concept-glossary-term"
node_id: "L0-trdt-g003"
source_channel: "rollout"
analysis_version: 9
aliases: ["L0-trdt-g003"]
is_a: ["glossary-term"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 368
tags: ["above-water-trident", "glossary"]
level: 2
---
**Fall grant**

A one-shot, per-player permission set by each trident dash. It cancels the first fall damage that follows. It is consumed by that cancel or by a damage-free landing, and expires after 10 s (`xasm36`). A new dash refreshes it; grants never stack.

**Related:** the katana's `FALL_FLAG_MS` and teleport method in `src/katana/fall.ts`, the fallback path.
