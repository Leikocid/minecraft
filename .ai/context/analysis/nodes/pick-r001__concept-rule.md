---
type: "concept-rule"
node_id: "L0-pick-r001"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-r001"]
is_a: ["rule"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 1543
tags: ["is_a:rule", "dig-speed", "relates_to:L0-pick-ad01", "relates_to:L0-pick-gl02", "relates_to:L0-pick-gl04"]
level: 2
---
**Rule R1 — Dig speed must be verified against a live vanilla diamond pickaxe, not assumed from the tag query alone.**

`minecraft:digger` on `andrew:miners_pickaxe` has exactly one `destroy_speeds` entry: `query.any_tag('minecraft:is_pickaxe_item_destructible')` → speed 8, `use_efficiency: true`. Bedrock's tag-query digger has **no engine-level tier fallback** — a block the query misses does not fall back to a lower pickaxe tier, it falls back to speed 1 (bare hand). The shipped 0.3.0 build hit exactly this: copper ore took 302 ticks (15.1s) instead of a diamond pickaxe's 0.65s, and ancient debris never broke at all within the test limit.

**Enforcement:** `pickaxe_digs_at_diamond_speed` (GameTest) breaks three representative blocks — one per distinct tag family actually present in the live block data (`copper_ore`: `stone_pick_diggable`-family only; `deepslate`: `is_pickaxe_item_destructible` only; `ancient_debris`: `diamond_tier_destructible` only) — with the pickaxe and, in the same run, with a real `minecraft:diamond_pickaxe`, and asserts the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). Self-calibrating: no hardcoded tick counts that drift when Mojang retunes hardness.

**Rationale:** any future edit to `destroy_speeds` (narrowing the tag query, or adding a second entry) must keep covering all three tag families or this exact bug regresses silently. [src: `packs/behavior/items/miners_pickaxe.json`; `src/gametest/main.ts` L864-962] [see also: `L0-pick-ad01`]
