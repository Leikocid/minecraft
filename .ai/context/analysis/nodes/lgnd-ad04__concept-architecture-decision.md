---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad04"
source_channel: "rollout"
analysis_version: 6
title: "AD-lgnd-04: Fall through to the off hand only when the main-hand ability is \"not ready\""
aliases: ["L0-lgnd-ad04"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1317
tags: ["architecture-decision", "hand-priority", "dispatch"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-r004", "cool-ctr3"]
---
# AD-lgnd-04: Fall through to the off hand only when the main-hand ability is "not ready"

**Context.** Both specs: *«готовая способность main hand имеет приоритет; если main-hand способность на cooldown, может сработать готовая off-hand способность»*. A ready main-hand ability can still refuse (Web Sword: no target in reach; Scythe: "There is no player here"). The specs do not say whether a refusal lets the off hand fire.

**Decision.** Readiness decides, not outcome. If the main-hand legendary is ready, it is called and the press ends there, whatever it returns. The off hand is considered only when the main hand is on cooldown or busy. At most one ability runs per press.

**Rejected.**
- (a) Fall through on refusal too. One press could then produce a "no player here" message *and* a cobweb cube, and the result depends on the order of two handlers' side effects. The rule text keys on cooldown only.
- (b) Off hand fires only when the main hand holds no legendary. That contradicts the explicit "on cooldown → off hand" clause.

**Consequence.** The player gets a predictable, spec-literal behaviour. A player who wants the off-hand ability while the main one is ready must swap hands.
