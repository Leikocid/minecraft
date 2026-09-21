---
type: "concept-entity"
node_id: "L0-cool-ent1"
source_channel: "rollout"
title: "CooldownRecord & AbilityRegistration"
aliases: ["L0-cool-ent1"]
part_of: ["L0-cool"]
is_a: ["entity"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 2221
tags: ["entity","cooldown","L0-cool"]
level: 2
---

# CooldownRecord & AbilityRegistration

Two related shapes this component owns: the **per-player timer state**, and the **registration seam** ADR-007 requires for future weapons.

## CooldownRecord

Per-player, per-ability cooldown state. One record per `(playerId, abilityKey)` pair.

- `abilityKey` — namespaced string, e.g. `andrew:web_sword` (not hardcoded to the sword at the API boundary — ADR-007 seam)
- `readyAtTick` — absolute server tick at which the ability becomes usable again; `currentTick >= readyAtTick` ⇒ ready
- `startedAtTick` — tick the record was written; retained for diagnostics
- `v` — schema version, mirrors `L0-once`'s ADR-012 pattern so a future shared registry can read old records forward

**Storage** (`L0-cool-adr1`): a player-scoped dynamic property, one per `abilityKey` (e.g. `andrew:cd_web_sword`), holding a small serialized record. Survives disconnect/reconnect because it travels with the player entity's saved data.

**Lifecycle.** Absent, or `readyAtTick <= currentTick` ⇒ ready. Written once by `start()` — a whole-record replace, never a partial field update (mirrors ADR-012's torn-write avoidance). Read by `isReady()` and by the actionbar render loop.

## AbilityRegistration

The seam ADR-007 requires so a second legendary weapon can plug into the same cooldown service without a rewrite. Not a spec requirement by itself — justified by §8's forward-looking hand-priority clause and §12's reference to a project-wide cooldown system.

- `abilityKey` — one per weapon; v1 has exactly one: `andrew:web_sword`
- `durationTicks` — 600 for Web Sword (R-cool-001)
- `itemTypeId` — `andrew:web_sword`; the item that makes a player a "holder" (glossary: Holder)
- `readoutTranslateKey` — the `.lang` key (owned by `L0-item`) used to render the countdown

**v1 scope.** Exactly one registration exists; no registry beyond "one row" is required. Documented so the shape is right at weapon #2, not because v1 needs more. **Explicitly excludes** any hand-priority/arbitration field — that belongs to the deferred framework (Q-010; see component's "Explicitly not owned").

**Relates to:** `L0-cool-proc1` (write path for `CooldownRecord`), `L0-cool-proc2` (read path for both shapes).
