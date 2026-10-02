---
type: "concept-contradiction"
node_id: "L0-xcx19"
source_channel: "rollout"
analysis_version: 4
title: "CX-L0-19 · `magn` does not split its iPad checks into separate criteria"
aliases: ["L0-xcx19"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1809
tags: ["v4", "status:open", "category:plan-vs-child", "target:L0-magn", "severity:medium", "relates_to:L0-magn", "relates_to:L0-sauc", "relates_to:L0-magn-a04", "relates_to:L0-magn-a07", "relates_to:L0-magn-a14", "relates_to:L0-sauc-ac06"]
level: 1
---
---
title: "CX-L0-19 · AC routing wants each child's ACs split into `bds` and `ipad` criteria; `magn` folds its iPad checks into its GameTest criteria"
aliases: ["L0-xcx19"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-magn", "L0-sauc", "L0-magn-a04", "L0-magn-a07", "L0-magn-a14", "L0-sauc-ac06"]
status: open
category: plan-vs-child
---
# CX-L0-19 · `magn` does not split its iPad checks into separate criteria

**Plan (reduce invariant, AC routing).** Each child splits its ACs into:
- the `bds` channel: GameTest with ≥ 2 players, and block and entity counts;
- the `ipad` channel: smooth pull, visible cloud, the fall, and so on.

**Observed (read during reduce at v4):**
- `sauc` complies. Its iPad checks are a separate manual criterion, `L0-sauc-ac06`, which also carries the "reopen after every epic merge" note.
- `magn` has **no** separate iPad criterion:
  - `magn-a04` adds "**(ipad)** the lift looks smooth";
  - `magn-a07` adds "**(ipad)** the fall after the release is visible";
  - `magn-a14` adds "**(ipad)** the cloud of iron is visible during the hold, and the fall is visible".

  Each is a trailing clause inside a GameTest criterion that is tagged with both `channel:bds` and `channel:ipad`.

**Why it matters.** The orchestrator closes a criterion when its GameTest passes. A dual-channel criterion closes its iPad half without anyone looking. This is the known failure where manual criteria get auto-verified.

**Fix (for the `magn` re-run or task creation).**
- Lift the three clauses into one manual criterion `magn-a-ipad`, written like `sauc-ac06` (a person on the iPad, screenshots or a recording, reopened after every merge).
- Leave `a04`, `a07` and `a14` as `bds` only.

This is not self-resolved, because it adds a per-component AC, which reduce must not author.
