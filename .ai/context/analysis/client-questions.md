---
title: Client Questions
type: analysis
generated_at: "2026-09-24T19:42:02.858Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0-xq1"]
priority: 520
---

# Client Questions (MUST_ASK)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Заполните секцию **Answer** по каждому вопросу — аналитик использует ответы на следующей итерации.

## Q-L0-1 · Should \

### Question

---
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx3", "L0-lgnd-cx01", "L0-lgnd-p005", "L0-webs", "L0-scyt"]
---
# Q-L0-1 · Should "Ready / Готово" stay on the Action Bar while a legendary weapon is held, for both weapons?

**Context.** Right now, when the Web Sword's cooldown ends, the bar shows «Готово» once and then goes quiet. The Scythe spec asks for «Готово» to stay visible the whole time the Scythe is held. Both weapons share one Action Bar display.

**Options.**
- **(a)** Both weapons show Ready continuously while held. This is consistent, but the Web Sword changes from 0.3.0.
- **(b)** Only the Scythe does. The Web Sword stays as it is. *This is the current default.*
- **(c)** Neither does. The Scythe then drops the continuous Ready from its spec.

**Blocking?** No. Autopilot runs on (b) through a per-weapon `readyMode`. Switching later to (a) or (c) changes one setting per weapon.

**Why it is promoted to L0.** The answer affects both weapons and the shared HUD. It is not a question about one component.

**Source node:** L0-xq1

### Answer

_..._

---

