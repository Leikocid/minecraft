---
type: "concept-contradiction"
node_id: "L0-xcx1"
source_channel: "rollout"
analysis_version: 1
level: 0
title: "CX-L0-01 · Web Sword rule overrides `lgnd`: who calls `cooldown.start`"
aliases: ["L0-xcx1"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1511
tags: ["title:Web Sword overrides lgnd cooldown ownership", "target:L0", "resolved", "reduce"]
---
---
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-webs", "L0-lgnd", "L0-webs-r005", "L0-webs-ad02", "L0-lgnd-r003", "L0-lgnd-p004", "L0-adr-cast"]
status: resolved
resolved_by: L0-adr-cast
category: weapon-overrides-framework
target_node: L0
---
# CX-L0-01 · Web Sword rule overrides `lgnd`: who calls `cooldown.start`

**Side A:** `L0-lgnd-r003` and `L0-lgnd-p004` step 4 say: *"Only the ability owner arms a cooldown. The framework never starts one."* The handler returns `"cast" | "refused" | "busy"`.

**Side B:** `L0-webs-r005` and `L0-webs-ad02`, as first written in this run, said: *"`L0-lgnd` must not start the cooldown"* on zero cells, and *"`L0-lgnd` … owns the actual cooldown start/skip decision"*. The callback returned `{filled: number}`, and the component "never reads or writes cooldown state itself".

**Why it is a contradiction.** The reduce invariant says that a weapon overriding a `lgnd` rule becomes an L0 contradiction. The two statements put the same write in opposite modules. Taken together, neither module would start the Web Sword cooldown, or the framework would have to infer success from a weapon-specific return shape.

**Resolution.** `L0-adr-cast` keeps `lgnd`'s contract. The Web Sword handler calls `start` when `filled > 0` and returns `"cast"`. Otherwise it returns `"refused"` and calls `hud.notify`. Both children came from this run, so the `L0-webs` texts were reconciled in place. The behaviour does not change: zero cells still costs no cooldown (Q-017).
