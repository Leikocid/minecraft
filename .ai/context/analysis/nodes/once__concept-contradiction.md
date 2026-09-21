---
type: "concept-contradiction"
node_id: "L0-once"
source_channel: "rollout"
title: "Contradictions — One-per-World Craft Gate"
aliases: ["L0-once"]
part_of: ["L0-once"]
is_a: ["contradiction"]
relates_to: ["L0-once"]
analysis_version: 2
level: 1
priority: 510
size_chars: 5268
tags: ["contradiction","open","target:L0-once","assumption-gap","web-sword","L0-once","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-once
---

# Contradictions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["contradiction"]` · `relates_to: ["L0", "L0-keep"]` · `see_also: ["webswordspecv1ruen-part-1"]`

**Inherited and unchanged: CTR-003** (*"without losing ingredients" is required, hedged, and untested*) is targeted at this node and remains **open**. This deep-dive refines it into `L0-once-accp7`, written in two mutually exclusive forms pending the owner's ranking. It is **not** self-resolved here, per the decomposition plan's escalation rule.

One new contradiction is raised.

---

## CTR-006 — The craft budget is irreversibly spent, but the sword it bought is destructible

- **Status:** `open` · **Category:** assumption-gap / source-internal · **Target node:** `L0-once` · **Severity:** Medium · **Raised by:** `L0-once` deep-dive

### The disagreement

| Where | Statement |
|---|---|
| §3 | *«конкретный Web Sword можно успешно скрафтить только один раз на весь мир/сервер»* — the budget is spent once, with no stated recovery |
| §4 | *«Web Sword владельца не должен выпадать при смерти … предмет должен вернуться тому же владельцу»* — the spec protects the sword against **exactly one** loss vector |
| §13 / §14 | *«второй survival-крафт в том же мире заблокирован»* · *«Нет известных способов дюпа через крафт…»* — both absolute |

§4 carefully protects the sword from death, and §12 extends that to disconnect and restart. The spec therefore *does* care that the world's one sword should not be lost. But death is not the only way an item leaves a Bedrock world: **lava, the void, `/clear`, despawn of a dropped stack after 5 minutes, and a killed item entity** all destroy it, and none is mentioned anywhere.

Combine that silence with R-001's write-once flag and you get a reachable terminal state: **a world whose craft budget is spent and which contains zero Web Swords, with no in-game path to another one.** The legendary weapon is permanently absent from a server that is still running.

### Why this is a real conflict, not a gap

The spec is not merely silent — it takes a position that is inconsistent with its own silence. It invests specific mechanism (§4, §12, ADR-008, and the High-severity CTR-005) in guaranteeing the sword survives death, which only makes sense if the sword's continued existence matters. Yet the budget mechanism it pairs that with makes the sword's existence *unrecoverable* by any means the spec provides. Either the sword's existence matters — in which case dropping it in lava is a gap of the same kind §4 closes — or it does not, in which case §4's elaborate retention machinery is disproportionate.

An implementer must pick a side, and both sides break something stated:

- **Flag stays set on destruction** (the assumed default, encoded in R-001 and `L0-once-accp6`) → §14 holds, C-7 holds, but a server can be permanently deprived of the weapon by one careless lava bucket.
- **Flag clears when no survival sword exists** → requires continuously knowing whether the sword exists, which means either instance tracking (CTR-005's unresolved provenance marker) or a world scan (forbidden by R-007 and C-4), and re-opens a craft dup path: destroy, re-craft, repeat.

### Interaction with CTR-005

These two are the same underlying omission viewed from opposite components. CTR-005 (`L0-keep`, High) says anti-dup and admin copies cannot both hold **without instance provenance**. CTR-006 says budget-recovery cannot be decided **without instance provenance** either. If the owner grants the provenance marker CTR-005 asks for, a bounded answer to CTR-006 becomes available; if they refuse it, CTR-006's only safe answer is the assumed default.

### Suggested resolution

Ask the owner one question: *"If the world's only survival-crafted Web Sword is destroyed — lava, void, `/clear` — should the world be able to craft another?"*

- **"No, that's the risk"** → confirm R-001 as written, add a line to §3 saying so explicitly, and close this. Recommended default; it is the only answer that needs no new mechanism.
- **"Yes"** → this is a new requirement, not a clarification. It needs the provenance marker from CTR-005, an explicit recovery trigger (operator command is far safer than automatic detection), and its own §13 test. Do **not** implement automatic re-opening.
- **"Operators can reset it manually"** → a middle path worth offering. A single operator-only command that clears the flag, logged to the content log. Cheap, auditable, and no dup path since it requires operator intent.

### Considered and **not** filed

- ***«на весь мир/сервер»* conflating world and server scope.** ADR-005 already decided world-scope and explicitly reasoned about it (*"copying the world copies the spent budget"*). Re-raising a resolved decision is out of bounds.
- **Announcement has no replay for late joiners.** The spec says *«всем игрокам»* without qualification, but this is a gap with an obvious default, not two statements disagreeing. Already ASM-012.
- **Adventure-mode crafting.** Unstated, not contradicted. Filed as ASM-013 with `MUST_ASK`.
- **Shift-click bulk crafting yielding multiple swords.** An unverified engine-behaviour claim this node cannot check — an open question, not a filing. Recorded as ASM-014.
