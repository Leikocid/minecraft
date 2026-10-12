---
type: "concept-glossary-term"
node_id: "L0-ench-gl03"
source_channel: "rollout"
analysis_version: 10
aliases: ["L0-ench-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 877
tags: ["v10", "enchanting", "glossary"]
level: 2
---
**Roller / adapter / scrub / verdict**

- **Roller:** the pure function `rollEnchantments` in `src/enchanting/roll.ts`. It turns `{itemId, tier, rng}` into an enchantment list under §4's rules. It has no engine import and is proven by unit statistics.
- **Adapter:** the optional engine-side code that applies roller output in the game: (a) a post-hoc re-roll, or (b) a custom station. It is built only after Andrey's approval in `xq11` (C-38).
- **Scrub (strip):** the existing C-37 code that removes a def's forbidden enchantments after they arrive: `src/legendary/enchant.ts` for the trident's Loyalty/Riptide, and `src/sculk/enchant.ts` for the crossbow's Piercing. It always runs after any adapter.
- **Feasibility verdict:** the probe's written answer to Q1–Q4, with evidence and the option table, attached to `xq11`.

**Synonyms:** roller = enchant roller, rules engine.
