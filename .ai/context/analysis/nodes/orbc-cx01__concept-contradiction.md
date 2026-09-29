---
type: "concept-contradiction"
node_id: "L0-orbc-cx01"
source_channel: "rollout"
analysis_version: 3
title: "CX-orbc-01 · Spec HUD wording \"Orbital Cannon — Ready / 27s\" vs the shared keys \"%s: Ready / %s: %s s\""
aliases: ["L0-orbc-cx01"]
is_a: ["contradiction"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1436
tags: ["is_a:contradiction", "category:source-vs-code", "severity:low", "status:resolved", "target:L0-lgnd", "relates_to:L0-orbc-r012", "relates_to:L0-lgnd", "hud", "lang", "resolved"]
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: L0-adr-oded
level: 2
---
# CX-orbc-01 · Spec HUD wording "Orbital Cannon — Ready / 27s" vs the shared keys "%s: Ready / %s: %s s"

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-orbc-r012", "L0-lgnd"]`

**Target:** `L0-lgnd`, which owns `hud.ts` and the `andrew.legendary.*` keys. **Category:** source vs code. **Severity:** low. **Status:** resolved by `L0-adr-oded` (reduce, v3).

- **Spec (Orbital §7, §13):**
  - `Орбитальная пушка — Готово` / `Orbital Cannon — Ready`;
  - `Орбитальная пушка — 27с` / `Orbital Cannon — 27s`.

  The separator is an em dash, and there is no space before `s`/`с`.
- **Code** (`packs/resource/texts/*.lang`, checked on 2026-09-29):
  - `andrew.legendary.ready=%s: Ready` / `%s: Готово`;
  - `andrew.legendary.cooldown=%s: %s s` / `%s: %s с`.

  These are shared by all legendaries through `hud.ts` `hudMessage`.
- **Conflict:** the Cannon's HUD will not match the spec's literal strings. Changing the shared keys also changes the Web Sword and Scythe HUDs, which were accepted as they are.

**Options.**
- (a) Change the shared keys to `%s — Ready` and `%s — %sс`/`%ss` for all weapons. This is consistent, and it touches accepted weapons.
- (b) Add optional per-weapon HUD keys (`andrew.orbital.ready`/`cooldown`), with `hud.ts` preferring them when they are defined.
- (c) Accept the shared format as a documented deviation.

**Autopilot default:** (b). It gives the spec wording exactly and leaves other weapons unchanged.
