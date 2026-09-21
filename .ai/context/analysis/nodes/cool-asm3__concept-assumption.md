---
type: "concept-assumption"
node_id: "L0-cool-asm3"
source_channel: "rollout"
aliases: ["L0-cool-asm3"]
part_of: ["L0-cool"]
is_a: ["assumption"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 672
tags: ["assumption","actionbar","scope","L0-cool"]
level: 2
---

## ASM-cool-3 — "Holding" means main-hand or off-hand `CAN_ASSUME`

**Assumed.** A player equipping `andrew:web_sword` in either the main-hand or the off-hand slot counts as a "holder" for R-cool-004's actionbar visibility rule.

**Basis.** §8's *«При удержании Web Sword»* does not restrict to a specific hand slot; only the deferred (Q-010) priority clause distinguishes hands, and that clause is explicitly out of v1's scope.

**Impact if wrong.** If the owner intends main-hand-only visibility, `L0-cool-proc2` step 2's holder filter narrows by one condition — an isolated, low-cost change. Does not affect the cooldown record or timing logic, only render eligibility.
