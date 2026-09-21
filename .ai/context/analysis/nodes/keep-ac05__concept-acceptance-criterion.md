---
type: "concept-acceptance-criterion"
node_id: "L0-keep-ac05"
source_channel: "rollout"
title: "AC K-5 — Death leaves the craft flag untouched, including during cooldown"
aliases: ["L0-keep-ac05"]
part_of: ["L0-keep"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1381
tags: ["acceptance-criterion","craft-flag","cooldown","boundary","L0-keep"]
---

# AC K-5 — Death leaves the craft flag untouched, including during cooldown

**Links** — `part_of: ["L0-keep"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-keep-r004", "L0-once", "L0-cool"]` · `maps_to: ["§12", "K-4", "K-5"]` · `owner_after_reduce: ["L0-qatg"]`

**GIVEN** a world where the one survival craft has been spent, and a player holding the crafted `andrew:web_sword`
**WHEN** the player activates the ability, then dies **while the 30 s cooldown is still running**, then respawns
**THEN** a second survival craft remains blocked
**AND** the player holds exactly one `andrew:web_sword`
**AND** the total number of Web Swords in the world is unchanged.

**Spec basis.** §12, quoted directly: *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»*

**How to verify.** GameTest: craft (or set the flag), activate, kill mid-cooldown, respawn, then attempt a second survival craft and assert it is refused. Survives restart too — compose with `L0-keep-ac04`.

**Why the cooldown context.** §12 singles out this timing because it is when the most state is in flight — cooldown timer, ledger entry and craft flag all live at once. It is the natural place for a cross-component write to leak.

**Note.** Whether the *cooldown itself* survives death/respawn is **not** tested here — that is Q-009, owned by `L0-cool`.
