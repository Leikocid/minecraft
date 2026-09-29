---
type: "concept-contradiction"
node_id: "L0-xcx9"
source_channel: "rollout"
analysis_version: 3
title: "CX-L0-09 · Vanilla /give copies in Survival claim the world's craft"
aliases: ["L0-xcx9"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0","L0-lgnd","L0-orbc"]
see_also: ["orbitalcannonspecv1ruen-part-1","orbitalcannonspecv1ruen-part-4"]
priority: 540
size_chars: 1340
tags: ["title:CX-L0-09 · Vanilla /give copies in Survival claim the world's craft","alias:L0-xcx9","is_a:contradiction","relates_to:L0","relates_to:L0-lgnd","relates_to:L0-orbc","see_also:orbitalcannonspecv1ruen-part-1","see_also:orbitalcannonspecv1ruen-part-4","category:source-vs-code","severity:high","status:open","target:L0-lgnd","resolved"]
level: 1
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx9
---

# CX-L0-09 · Vanilla /give copies in Survival claim the world's craft

**Spec (Orbital §4, AC-2).** Copies from Creative and `/give` are allowed and **do not consume or change** the Survival unique-craft flag.

**Code (`src/legendary/craftgate.ts` + `rules.ts:41`).** The gate reacts to *any* unmarked legendary that appears in a player's inventory. `craftDecision` ignores the stack only when the player is in Creative or Spectator, or the stack is marked. A vanilla `/give @p andrew:orbital_cannon` (or `andrew:web_sword`) to a **Survival** player produces an unmarked stack, so the gate returns `claim`. The world's single craft is then spent on a test copy, and a later real craft gets refunded. Only the custom `/andrew:<weapon> give` produces a correctly marked admin copy.

**Impact.** AC-2 fails as built, for all three weapons.

**The gate cannot tell a craft from a `/give`.** Stable 2.10.0 has no craft event; that is why the gate is after-the-fact.

**Candidate fixes for the `lgnd` delta:**
- Only claim when the stack appeared in the crafting-output flow. Heuristic: the event's `beforeItemStack` was empty and the slot is the cursor or inventory slot fed by crafting. This needs a probe.
- Or restrict `/give` of legendaries through a `beforeEvents` command hook, and document `/andrew:<weapon> give` as the supported path.
