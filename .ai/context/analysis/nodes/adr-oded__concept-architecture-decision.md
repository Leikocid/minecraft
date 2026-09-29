---
type: "concept-architecture-decision"
node_id: "L0-adr-oded"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-oded · Two small Orbital rulings that cross the `lgnd`/`orbc` boundary"
aliases: ["L0-adr-oded"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-lgnd", "L0-pntr", "L0-ring", "L0-orbc-cx01", "L0-orbc-cx03", "L0-orbc-r012", "L0-orbc-r007", "L0-orbc-r008"]
see_also: ["L0-orbc-ac10", "L0-orbc-ac04", "L0-orbc-ac05"]
priority: 540
size_chars: 2183
tags: ["status:accepted", "v3-reduce", "resolves:L0-orbc-cx01", "resolves:L0-orbc-cx03", "relates_to:L0-orbc", "relates_to:L0-lgnd", "relates_to:L0-pntr", "relates_to:L0-ring"]
level: 2
---
# ADR-L0-oded · Two small Orbital rulings that cross the `lgnd`/`orbc` boundary

**Status:** accepted (reduce, v3). **Resolves:** `L0-orbc-cx01`, `L0-orbc-cx03`.

## 1. HUD wording (`orbc-cx01`)
**The disagreement between siblings.**
- The `lgnd` component says the Cannon renders through the shared `andrew.legendary.ready/cooldown` keys "as 'Orbital Cannon — Ready' / '— 27s'".
- `orbc` read the lang files (2026-09-29): the shared keys render `%s: Ready` / `%s: %s s`. So the `lgnd` claim does not match what `orbc` read.

**Ruling:** option (b).
- `hud.ts` (`lgnd`) looks up optional per-weapon keys `andrew.<prefix>.ready` / `andrew.<prefix>.cooldown` first, then falls back to the shared keys.
- `orbc` ships `andrew.orbital.ready=%s — Ready` and `andrew.orbital.cooldown=%s — %ss` (RU `%s — Готово`, `%s — %sс`).
- The Web Sword and Scythe HUDs, which were accepted, stay as they are.
- The lookup is a `lgnd` change (step 4 of its v3 task). The strings are an `orbc` deliverable, checked by `orbc-ac10`.

## 2. Nether roof (`orbc-cx03`)
**Ruling:** option (a), literal.
- Spawn height is +10, clamped to `heightRange.max − 1`. A charge spawned inside a solid block detonates at once (§8, AC-4/AC-5).
- For Nether targets at Y ≥ 113:
  - **RMB** goes off in the bedrock roof;
  - **LMB** still cores down through the target, since bedrock is kept under `xasm6`.
- `pntr` and `ring` receive the roof cell as their `point`, with no special case. That matches the charge contract (`orbc-r014`).
- This goes on the client deviation list with a C-16 note in `src/orbital/`. It is re-opened only if the client says Nether-roof PvP matters.

**Why not (b).** It would change the charge contract for one dimension. The reduce plan routes every change to charge behaviour through L0, and nothing in `pntr`/`ring` needs it.
