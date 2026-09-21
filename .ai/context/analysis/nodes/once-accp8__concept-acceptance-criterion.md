---
type: "concept-acceptance-criterion"
node_id: "L0-once-accp8"
source_channel: "rollout"
aliases: ["L0-once-accp8"]
part_of: ["L0-once"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1569
tags: ["acceptance-criterion","localization","C-9","ipad","L0-once"]
---

**AC-ONCE-8 — Both messages render correctly in RU and EN.**

Maps to §10 (*«Все пользовательские сообщения, включая first-craft announcement … должны иметь RU/EN варианты»*) and C-9.

**GIVEN** a client with locale `ru_RU` and a client with locale `en_US`,
**WHEN** the first survival craft occurs, and separately when a second craft is blocked,
**THEN** the RU client sees «Паутинный меч» inside a Russian sentence naming the crafter,
**AND** the EN client sees "Web Sword" inside an English sentence naming the crafter,
**AND** **no raw translate key** (e.g. `andrew.web_sword.first_craft`) appears on either screen,
**AND** the weapon name is localized *inside* the message, not left as English text in a Russian sentence.

**Static half — automatable.** Assert that `packs/resource/texts/ru_RU.lang` and `en_US.lang` both contain `andrew.web_sword.first_craft` and `andrew.web_sword.already_crafted`, and that the script source contains no literal user-facing string in `sendMessage`. This is a lint-style check and belongs in the existing suite.

**Visual half — iPad only.** Per C-11, "does it look right?" cannot be answered by BDS logs. The RU/EN rendering pass runs on the iPad by switching device language. `L0-qatg` owns scheduling it.

**Nested-translate trap.** The most likely failure is a correct-looking message with the weapon name inlined as a literal — it passes a log grep and fails the iPad pass. Assert the nesting explicitly.

**Owned by:** `L0-once` · **Rules:** R-006 · **Depends on:** `L0-item` (catalogue owner) · **Rolls up to:** `L0-qatg`
