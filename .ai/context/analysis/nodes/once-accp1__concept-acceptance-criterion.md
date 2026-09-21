---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp1"
source_channel: "rollout"
aliases: ["L0-once-accp1"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1165
tags: ["acceptance-criterion","craft","announcement","spec-13-3","L0-once"]
---

**AC-ONCE-1 — First survival craft succeeds and is announced.**

Maps to §13: *«Первый survival-крафт успешен и объявляется в чате»* (first half).

**GIVEN** a fresh world where `andrew:web_sword` has never been crafted, and a player in Survival mode with 4× Cobweb and 1× Diamond Sword,
**WHEN** the player crafts the plus-pattern recipe at a crafting table,
**THEN** the player receives exactly 1× `andrew:web_sword`,
**AND** the world craft flag `andrew:web_sword_craft_gate` is present with `crafted: true` and `crafterName` equal to that player's display name,
**AND** every player online at that moment receives a chat message naming the weapon and the crafter,
**AND** no second sword is created anywhere.

**Harness:** `packs/gametest` with a simulated player performing the craft; assert on the dynamic property and on the message. Content-log evidence via `bds:check`.

**Negative half:** if the flag write fails, the announcement must NOT be sent — assert that a forced write failure leaves both the flag absent and the chat silent (`L0-once-pcft` failure handling).

**Owned by:** `L0-once` · **Rules:** R-001, R-004, R-006 · **Rolls up to:** `L0-qatg`
