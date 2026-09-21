---
type: "concept-rule"
node_id: "L0-keep-r001"
source_channel: "rollout"
title: "Rule K-R1 — A bonded Web Sword never becomes a death drop"
aliases: ["L0-keep-r001"]
part_of: ["L0-keep"]
is_a: ["rule"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1175
tags: ["rule","invariant","death","L0-keep"]
---

# Rule K-R1 — A bonded Web Sword never becomes a death drop

**Links** — `part_of: ["L0-keep"]` · `is_a: ["rule"]` · `relates_to: ["L0-keep-p001", "L0-keep-ac01"]` · `spec: ["§4"]` · `implements: ["WS-9"]`

**Rule.** When a player dies carrying a provenance-marked Web Sword, that item must not appear as a dropped entity in the world at any point — not transiently, not for one tick.

**Source.** §4: *«Web Sword владельца не должен выпадать при смерти.»*

**Rationale.** A one-per-world legendary lying on the ground is lootable by the killer and despawnable by the engine. Either outcome defeats §4's *«предмет должен вернуться тому же владельцу»*. A *transient* drop is worse than a permanent one: if the item exists on the ground even briefly while a ledger entry is also owed, both can be collected — that is the primary dup path C-7 forbids.

**Scope.** Marked instances only. An unmarked admin/`/give` copy drops normally (`L0-keep-ent2`) — it is an ordinary item.

**Testable as.** `L0-keep-ac01`.

**Violation looks like.** Cobweb-sword item entity visible near the death location, or recoverable by another player, even if the owner also gets one back on respawn.
