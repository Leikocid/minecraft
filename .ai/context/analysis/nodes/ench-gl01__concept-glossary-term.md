---
type: "concept-glossary-term"
node_id: "L0-ench-gl01"
source_channel: "rollout"
analysis_version: 10
aliases: ["L0-ench-gl01"]
is_a: ["glossary-term"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 753
tags: ["v10", "enchanting", "glossary"]
level: 2
---
**Formerly table-inaccessible enchantment (rare, treasure)**

A non-curse enchantment that is valid for an item's slot but that the vanilla Bedrock 1.26.51 table never offers. The expected set is Mending, Frost Walker, Soul Speed, Swift Sneak and Wind Burst. Also Lunge, if the probe finds it is not offered. The exact per-slot list comes from the probe (`L0-ench-prob` Q3) and is held in `TREASURE` in `roll.ts`. Curses (`binding`, `vanishing`) are treasure in vanilla but are **never** in this set.

A **valid generation** is one roll for an item whose eligible set holds at least one of these. Only valid generations count toward the 20 % statistic.

**Synonyms:** rare enchantment, treasure enchantment, "редкая (ранее недоступная через стол) чара".
