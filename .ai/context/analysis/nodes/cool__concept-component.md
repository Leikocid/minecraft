---
type: "concept-component"
node_id: "L0-cool"
source_channel: "rollout"
title: "Cooldown & Actionbar UI"
aliases: ["L0-cool"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0"]
analysis_version: 2
priority: 510
size_chars: 6521
tags: ["component","web-sword","cooldown","actionbar","ui","L0-cool"]
level: 1
---

# Cooldown & Actionbar UI

**Links** — `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-trap", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Own the Web Sword ability's per-player cooldown and its player-visible countdown: the exact-30-second timer keyed by **player + ability** (not by item instance), the rule that only a *confirmed successful* activation starts the clock, the actionbar readout of remaining time while the sword is held, and the ability-key seam ADR-007 reserves for a future cross-item cooldown framework that does not exist yet. Spec sections owned: §8 in full, §12's *«cooldown должен сохраняться настолько, насколько это требуется общей системой cooldown проекта»*, and the cooldown half of §9's per-activation independence.

## Why this is its own component

Every sibling deals with a one-shot event (craft, death, cobweb placement). This component is the only one with **standing timed state and a recurring render loop** — the failure modes are different in kind: a timer that doesn't persist is a logout-abuse exploit (C-7's spirit), a render loop that isn't scoped is a C-4 violation, and a timer keyed wrong (per item instead of per player) is a balance bypass (ASM-009). None of `L0-item`, `L0-once`, `L0-keep` or `L0-trap` share this shape.

## Inputs

| Input | Origin | Notes |
|---|---|---|
| "Activation succeeded" signal for the Web Sword ability | `L0-trap`, after cell placement completes | This component never decides success; it only reacts to it — decomposition plan: *"Success is decided by L0-trap; the cooldown is consumed by L0-cool"* |
| "Is this ability ready?" query, before placement | `L0-trap`, step 2 of ADR-006's forced ordering | Must answer before any world state is written |
| Held-item state per online player, each render tick | Bedrock stable equipment surface | Drives which players get an actionbar update |
| Translate keys for the countdown string | `L0-item`'s `.lang` catalogue | Consumed only, never authored here (C-9, ADR-009) |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **Cooldown record** (`L0-cool-ent1`) — per player, per ability-key ready-at time | This component, read on every check/render | Keyed by player + `abilityKey`, never by item stack (ASM-009, ADR-007) |
| `isReady(player, abilityKey)` query result | `L0-trap`, gate before cell placement | Pure read; never mutates state |
| `start(player, abilityKey)` mutation | Called by `L0-trap`, only after a confirmed successful activation | The only write path that arms the timer |
| Actionbar countdown text | The holding player's client | Localized rawtext, `L0-item` keys + seconds substitution |
| Ability-key registration seam (`L0-cool-ent1`) | Future weapons (deferred) | Web Sword registers one key now; the API accepts more without redesign |

## Explicitly not owned

- **Whether an activation succeeds** — reach validation, targeting and cell placement are `L0-trap`. This component answers "ready?" and starts the clock; it never evaluates reach or targets.
- **The `.lang` catalogue** — `L0-item` owns every translate key this component consumes, including the countdown string itself.
- **The general cross-item cooldown framework** referenced by §12 — it does not exist anywhere in the KV. This component ships a single-item implementation with the ability-key seam (ADR-007) and must not invent the framework.
- **Main-hand/off-hand priority arbitration** (§8) — cannot be tested or meaningfully implemented with one legendary item. Provisionally deferred in `concept-boundary` (Q-010); this component keeps only the ability-key indirection a future rule would need.

## Architecture in one paragraph

The cooldown is a small **per-player, per-ability-key service** (ADR-007), not sword-local state. A successful activation writes one **cooldown record** — this component's proposal is a player-scoped dynamic property keyed by ability id, so the record travels with the player and survives disconnect/reconnect without extra plumbing (`L0-cool-adr1`; recommended default for open question Q-009). A single recurring interval, scoped **only to players currently holding a tracked ability's item** (never all online players, never a world scan), recomputes remaining time each cadence tick and renders the actionbar or clears it (also `L0-cool-adr1`). `L0-trap` is the sole caller of the service's mutating and gating entry points; this component never listens for the use-event itself.

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | Dynamic properties and `onScreenDisplay.setActionBar` are both stable-surface; no Beta dependency |
| **C-3** server-authoritative | Remaining time is computed from the server's own record and tick clock, never trusted from a client |
| **C-4** no per-tick global scan | The **only** child permitted a recurring tick, and only because it is scoped to sword holders — not the world (R-cool-004) |
| **C-6** durable world state | Extended here to *durable per-player* state — the cooldown record must outlive logout, in line with Q-009's recommended answer |
| **C-7** no duplication / no-advantage paths | A cooldown that resets on reconnect is a logout-abuse path; persisting it closes that door |
| **C-9** localization is structural | The countdown string is a translate key with a `with` substitution, never a literal (R-cool-005) |

## Open items carried

- **CTR-004** (inherited, root-level, not re-filed) — the framework §12 assumes doesn't exist; this component resolves it locally via ADR-007's seam rather than waiting for it.
- **Q-009** (persistence across logout) — treated as **provisionally answered "persist"** for design purposes (`L0-cool-asm1`, `MUST_ASK`); confirm before implementation.
- **Q-010** (hand-priority scope) — treated as **provisionally deferred**; only the seam ships in v1 (see "Explicitly not owned" above).
- **ASM-009** (inherited) — cooldown keyed per player + ability; this component's entity model enforces it structurally (R-cool-003).

## Risk note

The two failure modes that matter most are silent: a record that resets on reconnect looks correct in every single-session test and only shows up as a logout-abuse exploit under adversarial play; a render loop that iterates all online players instead of sword-holders looks correct at one player and only shows up as a performance regression at server scale — exactly the shape C-4 warns about.
