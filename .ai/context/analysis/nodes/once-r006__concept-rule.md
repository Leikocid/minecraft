---
type: "concept-rule"
node_id: "L0-once-r006"
source_channel: "rollout"
aliases: ["L0-once-r006"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1639
tags: ["rule","localization","announcement","C-9","L0-once"]
---

**R-006 — Every message this component emits is a translate key, resolved by the Resource Pack.**

Source: §3 — *«отправить всем игрокам локализованное сообщение с названием оружия и именем создателя»* · §10 — *«Все пользовательские сообщения, включая first-craft announcement … должны иметь RU/EN варианты. Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт.»* · C-9, ADR-009.

**Prohibited:** literal strings in `sendMessage`, string concatenation to build a sentence, a script-side language dictionary, and inlining the weapon's name as text inside an otherwise-translated message.

**Required:** rawtext with `translate` keys plus `with` substitutions. The weapon name is a **nested** `translate` referencing the item's own name key, so it localizes alongside the sentence.

**Keys this component consumes** (owned and reconciled by `L0-item` — localization ownership is central, use is distributed):

| Key | Used by |
|---|---|
| `andrew.web_sword.first_craft` | `L0-once-pcft` step 6 |
| `andrew.web_sword.already_crafted` | `L0-once-pblk` step 4 |

Both require a `ru_RU.lang` **and** an `en_US.lang` entry, landed in the same change as the code that emits them (ADR-009's consequence). This component adds **no literals of its own** and does not edit the catalogue unilaterally; it declares its key list to `L0-item`.

**Audience.** The announcement goes to all players online at craft time. No replay for later joiners (ASM-012). The denial message goes to the blocked player only.

**Verified by:** `L0-once-accp8` (both locales render, no raw key text visible on screen).
