---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac10"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-10 — Target death, logout or dimension change leaves nothing behind (§8 test 10)"
aliases: ["L0-sprj-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 719
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:10", "cleanup"]
level: 2
---
# AC-sprj-10 — Target death, logout or dimension change leaves nothing behind (§8 test 10)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p004", "L0-sprj-r006", "C-14"]` · channel: `bds`

**GIVEN** a live volley with `hits = 0`, run 3 separate times,
**WHEN** the target is (a) killed with `/kill`, (b) disconnected, (c) teleported to the Nether,
**THEN** within 1 tick the volley map is empty, the `runInterval` handle is cleared (no other volleys), busy is false, there is no cooldown, no entity was created, and no Scythe-related dynamic property changed on the target.

**AND** repeating (a)–(c) with `hits = 1` gives the same cleanup plus a committed 30 s cooldown.
