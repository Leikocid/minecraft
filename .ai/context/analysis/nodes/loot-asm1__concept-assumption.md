---
type: "concept-assumption"
node_id: "L0-loot-asm1"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-asm1"]
is_a: ["assumption"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 883
tags: ["CAN_ASSUME", "is_a:assumption", "relates_to:L0-loot-p001", "relates_to:L0-loot-r003"]
level: 2
---
**Assumption (CAN_ASSUME):** The spec says Golden Apple succeeds "at most once per chest" but doesn't say what happens when the weighted roll lands on Golden Apple again after it has already succeeded once. This deep-dive assumes either behavior is acceptable: (a) drop Golden Apple from the pool and renormalize remaining weights for that attempt, or (b) leave the pool unchanged and treat a repeat Golden Apple roll as a no-op/wasted attempt. Recommendation: (a), since it avoids attempts silently producing nothing, which could otherwise skew statistical tests that expect ~N items per chest.

**Impact if wrong:** if a statistical AC (`L0-loot-ac01`/`L0-loot-ac06`) is later written expecting a specific one of the two behaviors (e.g. counting non-empty attempts), the wrong choice could fail that test even though both are spec-compliant. Low blast radius — single-function fix.
