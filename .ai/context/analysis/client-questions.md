---
title: Client Questions
type: analysis
generated_at: "2026-09-26T08:34:28.655Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0-xq3","L0-xq4"]
priority: 530
---

# Client Questions (MUST_ASK)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Заполните секцию **Answer** по каждому вопросу — аналитик использует ответы на следующей итерации.

## Q-L0-3 · When a legendary weapon is lost (Void, lava, despawn), who gets it back: the crafter or the last person who held it?

### Question

# Q-L0-3 · When a legendary weapon is lost (Void, lava, despawn), who gets it back: the crafter or the last person who held it?

**Links:** `is_a: ["client-question"]` · `relates_to: ["L0-lgnd", "L0-webs", "L0-scyt", "L0-lgnd-cx09", "L0-adr-wpn2"]`

**Context.** Both weapon specs say it "returns to the last owner" («возвращается последнему владельцу»). Today the game gives it back to **whoever crafted it**. Example: you craft the Web Sword and give it to a friend. The friend drops it into the Void. The sword comes back to you, not to the friend.

**Options.**
- **(a)** Back to the crafter (current behaviour).
- **(b)** Back to the last player who had it in their inventory.

**Blocking?** No. Autopilot keeps (a) until you answer (`L0-adr-wpn2`). Switching to (b) is a small change in the shared framework, and it affects both weapons the same way.

**Why at L0.** It is shared behaviour for every legendary weapon, not a question about one of them.

**Source node:** L0-xq3

### Answer

_..._

---

## Q-L0-4 · The spec says a Windmill always appears near spawn. What if the world starts on a tiny island or in the middle of the ocean?

### Question

# Q-L0-4 · The spec says a Windmill always appears near spawn. What if the world starts on a tiny island or in the middle of the ocean?

**Links:** `is_a: ["client-question"]` · `relates_to: ["L0-wind", "L0-strf", "L0-airs", "L0-wind-cx01", "L0-adr-spwn"]`

**Context.** The spec asks for a guaranteed Windmill near spawn, built on dry land, and it must never damage other structures. On some seeds there is no suitable dry spot near spawn. The spec does not say what to do then.

**Options.**
- **(a)** No spawn Windmill in that world, and the server log says why. *This is the current default.*
- **(b)** Build it anyway on the "least wet" spot, filling shallow water (up to about 3 blocks deep) as part of preparing the site.
- **(c)** Search further than 500 blocks. This means a longer wait when the world is first created.

**Blocking?** No. Normal seeds are not affected, and the tests use normal seeds.

**Why at L0.** The answer changes a constraint-level rule (the one-time spawn search, `L0-adr-spwn`), and on the Windmill it also changes the linked Airship.

**Source node:** L0-xq4

### Answer

_..._

---

