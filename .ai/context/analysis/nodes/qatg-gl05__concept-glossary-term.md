---
type: "concept-glossary-term"
node_id: "L0-qatg-gl05"
source_channel: "rollout"
title: "Glossary — iPad Visual Pass"
aliases: ["L0-qatg-gl05"]
part_of: ["L0-qatg"]
is_a: ["glossary-term"]
relates_to: ["L0-qatg-gl04", "L0-qatg-asm3"]
analysis_version: 2
level: 2
priority: 510
size_chars: 803
tags: ["glossary-term","L0-qatg"]
---

**iPad Visual Pass** · analysis term, referring to the C-11 manual-verification half of the loop

The manual, on-device check performed on the project's one iPad: Creative Equipment placement, icon rendering, RU/EN text display, and the actionbar cooldown readout. Exists because, per C-11, there is no macOS Bedrock client and BDS logs cannot confirm anything about how the client *renders* — only that the server-side state is correct. Distinguish from `bds:check`, which proves the same underlying facts (item exists, is enchantable) without needing the device at all, by asserting on the server side instead of observing the client.

Bound by ASM-010/Q-012: only one iPad is documented in the environment, which is why the two-player DoD requirement cannot be satisfied by this mechanism alone.
