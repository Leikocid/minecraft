---
type: "concept-glossary-term"
node_id: "L0-pick-gl02"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-gl02"]
is_a: ["glossary-term"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 688
tags: ["is_a:glossary-term", "relates_to:L0-pick-r001"]
level: 2
---
**Digger tag-query fallback ("hand-speed trap")**

Bedrock behavior of `minecraft:digger`'s `destroy_speeds`: each entry matches blocks via a molang tag query (e.g. `query.any_tag('minecraft:is_pickaxe_item_destructible')`). If a block matches **no** entry, the engine does **not** fall back to a lower tool tier — it falls back to speed 1, the same as breaking with a bare hand. No partial credit for "close" tag coverage. Caused the 0.3.0 regression on copper ore and ancient debris (`L0-pick-r001`). Also hit the sibling Web Sword item (cobweb cut at hand speed, fixed separately) — a recurring bug class across every `minecraft:digger` item in this add-on, not unique to the pickaxe.
