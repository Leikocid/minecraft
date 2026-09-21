---
type: "concept-client-question"
node_id: "L0-once"
source_channel: "rollout"
title: "Open questions — One-per-World Craft Gate"
aliases: ["L0-once"]
part_of: ["L0-once"]
is_a: ["client-question"]
relates_to: ["L0-once"]
analysis_version: 2
level: 1
priority: 510
size_chars: 3144
tags: ["client-question","open","web-sword","L0-once"]
---

# Open questions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["client-question"]` · `relates_to: ["L0", "L0-keep"]`

Refined, not resolved. Per the decomposition plan, children add implementation detail to their routed questions and hand them back; L0 re-aggregates.

---

## Q-008 (refined) — What happens to the ingredients on a blocked craft?

**Routed to this node at L0. Ties to CTR-003.**

§3 asks for the second craft to be blocked *«без потери ингредиентов, насколько это позволяет стабильный API»*. §13 tests only that it is blocked. Please rank:

1. **Refund required** — the 4× Cobweb and 1× Diamond Sword come back. If the stable API cannot do this cleanly, implementation stops and asks again.
2. **Refund preferred, consumption acceptable** — ship the best the API allows, always with a localized message explaining the loss.
3. **Consumption fine** — blocked is blocked; the message is optional.

**Why we need the answer:** as the spec stands, an implementation that eats a Diamond Sword on every blocked attempt passes §13 and §14 in full. The acceptance suite cannot tell options 1 and 3 apart, so the choice has to be stated. Whichever you pick becomes `L0-once-accp7` and should be added to §13.

**Our recommendation:** option 2, with the message mandatory.

---

## Q-014 (new) — If the world's only Web Sword is destroyed, can another be crafted?

**Ties to CTR-006.** §4 protects the sword from death, but lava, the void, `/clear` and item despawn are not mentioned. Since the craft flag is write-once, a server can reach a state where the budget is spent and no Web Sword exists, permanently.

1. **No — that is the risk.** Recommended; needs no new mechanism, just a sentence in §3.
2. **Yes, automatically.** This is a new requirement, not a clarification: it needs instance provenance (see CTR-005), a detection trigger, and its own test. It also re-opens a craft dup path.
3. **Operators can reset it manually.** A single op-only command that clears the flag, written to the content log. Cheap, auditable, no dup path.

---

## Q-015 (new) — Which game modes do your PvP maps actually run in?

**Ties to ASM-013.** §3 splits the world into "Survival" and "Creative / `/give`". Adventure mode is never mentioned, and players *can* craft at a table in Adventure. Since this is a PvP add-on and PvP maps commonly run in Adventure, the gap is not theoretical.

Our default: **Adventure crafts spend the budget** (it is a play mode, not an admin mode). Confirm, or tell us Adventure should be exempt.

**Blast radius if we guessed wrong:** on an Adventure-mode map, a wrongly-exempted gate never closes and the legendary weapon becomes unlimited.

---

## Not asked — resolved locally

- *World vs server scope of «на весь мир/сервер»* — already decided by ADR-005 (world-scoped).
- *Does a late-joining player see the announcement?* — assumed no (ASM-012); cosmetic, not worth the owner's attention unless they disagree.
- *Does a shift-click bulk craft yield multiple swords?* — an engine-behaviour question we will answer ourselves with a GameTest (ASM-014), not a question for the owner.
