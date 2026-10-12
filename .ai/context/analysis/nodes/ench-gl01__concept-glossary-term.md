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

A non-curse enchantment that is valid for an item's slot but that the vanilla Bedrock 1.26.51 table never offers. The set is Mending, Frost Walker, Soul Speed, Swift Sneak and Wind Burst — measured, not expected (`docs/feedback/probe-enchanting.md` §5, 1000 rolls per item per mode). **Lunge is not in it:** the vanilla table already offers it on spears, 334 of 1000 at level 30, so §4 leaves it alone. Wind Burst is the odd one: the mace accepts it, but no generator ever produces it, 0 of 3000. The per-slot list is latched to the engine in `src/enchanting/eligibility.ts` (`ENCH-DATA-01-AA`) and read by `TREASURE` in `roll.ts`. Curses (`binding`, `vanishing`) are treasure in vanilla but are **never** in this set.

A **valid generation** is one roll for an item whose eligible set holds at least one of these. Only valid generations count toward the 20 % statistic.

**Synonyms:** rare enchantment, treasure enchantment, "редкая (ранее недоступная через стол) чара".
