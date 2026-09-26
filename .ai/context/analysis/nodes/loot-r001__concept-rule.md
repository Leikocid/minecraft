---
type: "concept-rule"
node_id: "L0-loot-r001"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-r001"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 673
tags: ["is_a:rule", "relates_to:L0-loot-p001"]
level: 2
---
**Rule:** Each Windmill/Airship chest draws 5–12 independent fill attempts. Each attempt selects at most one of the 13 loot categories (never zero-to-many, never a simultaneous multi-category hit) — selection uses relative weights, not independent per-category coin flips, specifically to prevent an attempt from producing more than one category.

**Rationale:** spec §3.1 items 1–2; prevents attempts from being read as independent Bernoulli trials per category (which would make multi-category attempts possible, contrary to the spec's explicit note).

**Scope:** applies only to the custom table (`L0-loot-p001`); does not apply to vanilla-table chests (`L0-loot-r007`).
