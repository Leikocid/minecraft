---
type: "concept-glossary-term"
node_id: "L0-sprj-gl06"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-sprj-gl06"]
is_a: ["glossary-term"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 408
tags: ["is_a:glossary-term"]
level: 2
---
**Busy** (ability state "active")

An in-memory flag in `L0-lgnd`'s cooldown service, keyed by player and ability. It is true while that player's volley is in flight (ASM-017, ADR-025). While busy, Use is rejected silently and the HUD shows "active" rather than Ready or the remaining time. It is never persisted, so a restart clears it.

**Status values of the ability:** Ready → Busy → (Cooldown | Ready).
