---
type: "concept-assumption"
node_id: "L0-pick-asm3"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-asm3"]
is_a: ["assumption"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 672
tags: ["is_a:assumption", "relates_to:L0-pick-r001"]
level: 2
---
**Assumption:** `SPEED_TOLERANCE_TICKS = 4` and `BREAK_LIMIT_TICKS = 300` are empirically chosen GameTest constants, not derived from any written spec value — the raw spec only says "Diamond-like intended mining speed" (qualitative, no numeric target).

**Impact if wrong:** too tight a tolerance risks flaky CI on a slower Docker/BDS host (false failures unrelated to the pickaxe); too loose a tolerance risks the exact class of regression this test exists to catch (0.3.0's hand-speed fallback, `L0-pick-gl02`) slipping through silently on a future edit to `destroy_speeds`. No incident yet from either direction — this is a forward-looking risk note, not a bug report.
