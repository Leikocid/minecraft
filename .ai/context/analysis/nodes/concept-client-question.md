---
type: "concept-client-question"
node_id: "L0"
source_channel: "rollout"
title: "Client Questions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["client-question"]
relates_to: ["L0"]
analysis_version: 1
priority: 120
size_chars: 3991
tags: ["client-question","open-question","blocker","L0"]
level: 0
---

# Client Questions

Four questions are listed verbatim in `stage-0-infrastructure` under *«Открытые вопросы»*; a fifth is raised by this analysis. Ordered by urgency.

---

## Q-001 — What exact Minecraft version is installed on the iPad? — **BLOCKER**

- **Source:** *«Точная версия игры на iPad (Настройки → номер версии внизу главного меню) — от неё зависят `min_engine_version` и версия BDS.»*
- **Blocks:** Writing the manifests (Stage 0, AC-S0-2/3/4) and choosing the BDS Docker image tag.
- **Why it's first:** Everything downstream — `min_engine_version`, the `@minecraft/server` version, and the server image that is supposed to validate them — hangs off this one number. It is also the cheapest question to answer: it is printed at the bottom of the iPad's main menu.
- **Related:** CTR-001, ASM-001.
- **Cannot be assumed.** The Stage 1 spec's guess (1.26.0) is exactly what needs checking.

---

## Q-002 — What are the add-on name, namespace and package name? — **BLOCKER (cheap now, costly later)**

- **Source:** *«Имя аддона / namespace (например `andrew`), название пакета.»*
- **Blocks:** The first commit. Namespace appears in item IDs, `.lang` keys, recipe IDs, manifest names and directory structure.
- **Why it's urgent despite being trivial:** Item identifiers are **persisted inside saved worlds**. Renaming before the first build costs nothing; renaming after any test world has been created orphans items in that world.
- **Proposed default:** `andrew` (the source's own example, matching the project directory).
- **Related:** ASM-002.

---

## Q-003 — TypeScript or plain JavaScript for scripts?

- **Source:** *«TypeScript (предлагается) или чистый JavaScript.»*
- **Blocks:** The shape of `npm run build`, and the wording of pass criterion AC-S0-1 — which currently *already assumes* TypeScript.
- **Analysis recommendation:** **TypeScript.** The project's entire purpose is API-version compatibility; compile-time checking against versioned `@minecraft/server` typings catches version mismatches on the Mac, before the three-hop build→Docker→iPad loop is spent discovering them. That is a large payoff for a thin build step.
- **Related:** ADR-005, ASM-003, C-10.

---

## Q-004 — Is a Windows PC needed as a fallback?

- **Source:** *«Нужен ли Windows-ПК как запасной вариант — по умолчанию нет.»*
- **Default given:** No.
- **Analysis note:** No requirement in either document needs Windows. The one scenario worth keeping in mind is if Rosetta-emulated amd64 BDS proves unstable on the M4 Pro — then a native x86 host becomes attractive. Recommend deferring until ADR-003's rig is actually proven or disproven; do not buy or configure anything up front.
- **Safe to assume "no" for now.**

---

## Q-005 — Can an item with no durability component be enchanted on Bedrock? *(raised by this analysis)*

- **Not in the source documents.** Arises from the Stage 1 spec asserting both *"Infinite durability (prototype omits a durability component)"* and *"Enchantable using the pickaxe enchantment slot"*, with pass criterion AC-S1-5 requiring both.
- **Why it matters:** If the engine ties enchantability to durability, AC-S1-5 is unsatisfiable as written and the item design must change — either add a durability component with unbreakable-style behavior, or drop the enchantability requirement.
- **How to resolve:** Empirically, early in Stage 1 — it is a cheap test and it invalidates a pass criterion if the answer is no. This is an engine-behavior question the owner or a Bedrock reference can settle; it is not answerable from the current sources.
- **Related:** ASM-004.

---

## Summary

| ID | Question | Urgency | Assumable? |
|---|---|---|---|
| Q-001 | iPad game version | Blocker | No |
| Q-002 | Name / namespace | Blocker (cheap) | Yes, `andrew` — but settle before first commit |
| Q-003 | TypeScript vs JS | High | Yes, TypeScript |
| Q-004 | Windows fallback | Low | Yes, no |
| Q-005 | Enchantable without durability | High | No — test it |
