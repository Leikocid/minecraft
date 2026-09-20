---
title: Assumptions
type: analysis
generated_at: "2026-09-20T16:22:35.855Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0"]
priority: 120
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Assumptions (L0)

# Assumptions

Gaps filled with defaults during this analysis. Each is classified **MUST_ASK** (blocks work; do not proceed on the assumption) or **CAN_ASSUME** (safe default; revisit if contradicted).

---

## ASM-001 — Declared version targets match the installed iPad game — **MUST_ASK**

- **Assumed:** `min_engine_version 1.26.0` and `@minecraft/server 2.9.0` are correct for the iPad's actual build.
- **Basis:** Asserted by the Stage 1 spec ("current Bedrock 26.x").
- **Why it's an assumption:** Stage 0 lists the iPad's exact version as an *open question* and states that `min_engine_version` and the BDS version both depend on it. Nobody has read the number off the device.
- **Impact if wrong:** The `.mcaddon` fails to import, or imports and silently disables scripts. This is the **single highest-value unknown in the project** — it is the exact failure mode both stages exist to detect. Every hour spent building against a wrong target is wasted.
- **Action:** Answer Q-001 before writing manifests. This is a five-minute check on the device (Settings → version number at the bottom of the main menu).

---

## ASM-002 — Namespace / add-on name — **MUST_ASK (cheap now, expensive later)**

- **Assumed:** namespace `andrew`, per the source's own example *«например `andrew`»* and consistent with the working directory name.
- **Impact if wrong:** Item identifiers (`andrew:miners_pickaxe`), `.lang` keys, recipe IDs, manifest names and directory layout all carry the namespace. Renaming is trivial before the first build and increasingly painful afterwards — **item IDs are persisted inside saved worlds**, so a rename after any test world exists orphans the items in that world.
- **Action:** Settle before the first commit. Near-zero cost now.

---

## ASM-003 — TypeScript is the scripting language — **CAN_ASSUME**

- **Assumed:** TypeScript, per ADR-005.
- **Basis:** Proposed in the source, and already baked into pass criterion AC-S0-1.
- **Impact if wrong:** Build pipeline and AC-S0-1 need rework. Contained — this is a Stage 0 -local concern and the scripts involved are a few lines long.
- **Action:** Keep the build step thin so reversal stays cheap. Confirm via Q-003.

---

## ASM-004 — An item with no durability component can still be enchanted — **MUST_ASK / verify empirically**

- **Assumed:** The pickaxe can be infinitely durable (durability component omitted) *and* accept pickaxe enchantments, as the spec asserts in both Gameplay and Pass Criteria.
- **Why it's an assumption:** On Bedrock, enchantability is generally tied to an item having durability/enchantable components; an item with no durability may be rejected by the enchanting table and anvil. The spec asserts both properties without reconciling them. **This analysis cannot verify Bedrock engine semantics from the available sources**, so it is recorded as an assumption rather than filed as a contradiction.
- **Impact if wrong:** AC-S1-5 is **unsatisfiable as written**, and the entity design must change — either give the pickaxe a durability component plus an `unbreakable`-style behavior, or drop the enchantability requirement. Either way it is a spec change, not a bug fix.
- **Action:** Test early in Stage 1 — it is cheap to check and it invalidates a pass criterion if false. Do not leave it to final acceptance.

---

## ASM-005 — Auto-smelt is implemented in script, not via loot tables — **CAN_ASSUME**

- **Assumed:** Drop replacement is done in the Script API (intercepting block-break and substituting the drop), not by overriding vanilla loot tables.
- **Basis:** The spec calls it an "auto-smelt **prototype**" and the whole stage is a *Script API* probe; a loot-table implementation would prove nothing about scripting.
- **Impact if wrong:** Different interaction surface with Fortune and Silk Touch (both deferred), and different failure modes for the "non-listed blocks keep vanilla behavior" boundary.
- **Action:** Prefer the script implementation — it matches the stage's diagnostic purpose.

---

## ASM-006 — "Diamond-like mining speed" means matching the diamond tier, tuned later — **CAN_ASSUME**

- **Assumed:** Approximate diamond-tier speed values; exact per-block tag parity postponed.
- **Basis:** The spec explicitly defers *"Exact parity with every diamond-pickaxe mining tag … until the user confirms the pack loads and scripts execute."*
- **Impact if wrong:** Gameplay feel only. No pass criterion depends on it.

---

## ASM-007 — Stage 2 will reuse the Stage 0/1 toolchain and API surface — **CAN_ASSUME**

- **Assumed:** The PvP add-on will be built with the same stable `@minecraft/server` version, the same build pipeline, and the same three-machine loop.
- **Basis:** The entire rationale for Stages 0–1 is to de-risk Stage 2; the effort only pays off under this assumption.
- **Impact if wrong:** If the PvP add-on turns out to need beta-only APIs, the Stage 1 probe validated the wrong surface and ADR-002 would have to be revisited wholesale.
- **Action:** When Stage 2 requirements are gathered, **check the required capabilities against the 2.9.0 stable surface first**, before designing.

---

## ASM-008 — The Stage 0 placeholder item is disposable — **CAN_ASSUME**

- **Assumed:** The trivial Stage 0 item is scaffolding and will be removed or replaced once Stage 0 closes; it is not a product item.
- **Basis:** Described only as *«любой пустой предмет»* with no attributes beyond a name and icon.
- **Impact if wrong:** Negligible. Worst case a stray item ID lingers in the pack.






