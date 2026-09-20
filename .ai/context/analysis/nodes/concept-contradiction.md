---
type: "concept-contradiction"
node_id: "L0"
source_channel: "rollout"
title: "Contradictions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["contradiction"]
relates_to: ["L0"]
analysis_version: 1
priority: 120
size_chars: 4494
tags: ["contradiction","open","L0","target:L0","resolved"]
level: 0
closed_at: 2026-09-20
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0
---

# Contradictions

Two open contradictions between the project's two raw sources. Neither blocks analysis; both should be resolved by the owner before Stage 1 starts.

---

## CTR-001 — Version target is simultaneously fixed and unknown

- **Status:** `open`
- **Category:** source-vs-source / assumption-gap
- **Target node:** `L0`
- **Severity:** High — this is the project's core technical risk.

### The disagreement

| Source | Statement |
|---|---|
| `minerspickaxetestspec` (priority 120) | *"The behavior pack requests `@minecraft/server` 2.9.0 and `min_engine_version` 1.26.0."* Presented as a settled compatibility target for "current Bedrock 26.x". |
| `stage-0-infrastructure` (priority 110) | Lists under **Открытые вопросы**: *«Точная версия игры на iPad … — от неё зависят `min_engine_version` и версия BDS.»* |

One document states the version target as a fact; the other states that it is undetermined and depends on an unanswered question.

### Secondary inconsistency in the same area

`stage-0-infrastructure` says *«`@minecraft/server` 2.9.0, при необходимости 2.10.0 — текущий stable на npm»*, which both selects 2.9.0 **and** describes 2.10.0 as the current stable. The Stage 1 spec hard-codes 2.9.0 with no alternative. Which version the manifests should actually declare is therefore unresolved from either direction.

### Why it matters

The declared `min_engine_version` is what makes an `.mcaddon` import or fail. Building against a guessed target means the first real test of Stage 1 may fail for reasons that have nothing to do with the pickaxe — destroying the diagnostic value of the probe.

### Suggested resolution

Answer **Q-001** (read the version off the iPad), then treat the iPad's reported version as authoritative and amend the Stage 1 spec's compatibility-target paragraph to match. Note that the project's own policy (C-3) already prescribes this direction of adjustment: retarget the pack to the game, never loosen the API channel to fit the pack.

---

## CTR-002 — Stage 0 and Stage 1 both claim to be *the* compatibility probe

- **Status:** `open`
- **Category:** scope overlap
- **Target node:** `L0`
- **Severity:** Medium — wasted effort and a stale spec, not a technical failure.

### The disagreement

| Source | Claim |
|---|---|
| `minerspickaxetestspec` | Purpose: *"validate the core Minecraft Bedrock Add-On stack **on the user's installed version** before implementing the full PvP Add-On."* |
| `stage-0-infrastructure` | Stage 0's stated goal is *«доказать, что процесс разработки работает end-to-end»*, and its pass criteria already require: `.mcaddon` imports on the iPad without errors, the script executes, and a custom item is visible in Creative with RU and EN names. |

By the time Stage 0 closes, the add-on stack has **already** been validated on the installed version. Stage 1's pass criteria AC-S1-1 ("imports without dependency/manifest errors") and AC-S1-2 ("visible in Creative, obtainable with /give") are then re-tests of ground Stage 0 has covered.

### Probable cause

The Stage 1 spec appears to predate Stage 0: `stage-0-infrastructure` is dated 2026-09-20 and refers to `Miners_Pickaxe_Test_Spec` as an existing document, while inserting itself *in front* of it. The pickaxe spec's Purpose sentence was never updated to reflect that a prior stage had absorbed its pipeline-validation role.

### Aggravating factor — priority inversion

The stale document carries the **higher** KV priority (120 vs 110). Retrieval ordered by priority will surface the superseded framing and the unverified version target first. Any consumer of this KV should prefer `stage-0-infrastructure` where the two disagree.

### Suggested resolution

Rewrite the Stage 1 Purpose to its genuine residual scope — *validate custom item behavior: recipes, enchantment slots, mining speed and script-driven drop replacement* — and drop AC-S1-1/AC-S1-2 as already covered by AC-S0-4. Consider raising `stage-0-infrastructure`'s priority above the pickaxe spec so retrieval reflects document currency.

---

## Considered and **not** filed

- **"Infinite durability" vs "enchantable."** These may conflict in the Bedrock engine, but confirming that requires verifying engine semantics, which the available sources do not cover and this node cannot check. Per the contradictions guide, an unverified claim is an open question, not a filing — recorded as **ASM-004** with high `impact_if_wrong` and flagged for early empirical testing in Stage 1.
