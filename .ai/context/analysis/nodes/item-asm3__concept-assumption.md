---
type: "concept-assumption"
node_id: "L0-item-asm3"
source_channel: "rollout"
aliases: ["L0-item-asm3"]
part_of: ["L0-item"]
is_a: ["assumption"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 887
tags: ["assumption","icon","low-impact"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-ent1"]`

**Assumption:** a dedicated custom icon/texture is required for the Web Sword, despite §11's hedge *«собственная иконка/текстура при необходимости»* ("own icon/texture, if needed").

**Basis.** The platform precedent (`andrew:miners_pickaxe`) ships its own texture and `item_texture.json` entry even though a generic/vanilla-like texture would have been technically sufficient. Consistency with this established convention is assumed to outweigh the spec's optionality hedge.

**Impact if wrong.** Low — purely cosmetic/effort tradeoff. If a shared or vanilla-adjacent texture were acceptable, some art/production effort is saved, but nothing in §13's acceptance tests distinguishes a custom icon from a placeholder one, so this assumption carries no correctness risk, only scope/effort risk.
