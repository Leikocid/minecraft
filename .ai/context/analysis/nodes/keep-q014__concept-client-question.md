---
type: "concept-client-question"
node_id: "L0-keep-q014"
source_channel: "rollout"
title: "Q-016 — In a PvP add-on, is the legendary sword genuinely un-lootable?"
aliases: ["L0-keep-q014"]
part_of: ["L0-keep"]
is_a: ["client-question"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2648
tags: ["client-question","open-question","pvp","design-intent","L0-keep"]
---

# Q-016 — In a PvP add-on, is the legendary sword genuinely un-lootable?

> **Renumbered at reduce (analysis_version 2).** Filed as "Q-014", a number `L0-once` and `L0-trap` also used for different questions. L0 assigned **Q-016**; see `concept-client-question` at `L0`.

**Links** — `part_of: ["L0-keep"]` · `is_a: ["client-question"]` · `relates_to: ["L0-keep-r001", "L0-keep-r003"]` · **Blocks:** `L0-keep` (scope confirmation, not implementation) · **Cost of a late answer:** medium — it changes what retention *means*, not how it is built.

## Why this is being asked

The spec's opening line scopes the whole project as a *«Minecraft Bedrock PvP Add-On»*. §4 then requires that the owner's Web Sword never drops on death and always returns to them.

Put together: **killing the sword's owner yields nothing.** The one-per-world legendary weapon cannot change hands by combat — only the original crafter can ever wield it, for the life of the world. A player who loses the craft race to a rival has no path to the item at all.

That may be exactly the intent — the weapon is a *reward for crafting first*, and making it unloseable protects that achievement. It is also a plausible oversight, since §4 reads like a convenience feature ("don't lose your stuff") while its actual effect in a PvP context is a permanent, non-transferable monopoly.

Nothing in the spec states a looting or transfer rule either way, so this analysis cannot settle it by reading. It is recorded as a question rather than a contradiction for that reason.

## Question

Is the intended behaviour that the Web Sword **can never be taken from its owner by another player**, for the entire life of the world?

If so, confirm it explicitly so it can be written into the boundary as a deliberate design property rather than a side effect.

If not, the owner should state which relaxation is wanted — for example:
- **(a)** retention protects against environmental death only, and PvP death drops the sword;
- **(b)** the sword is always retained, but can be traded/given voluntarily;
- **(c)** retention is as specified and the monopoly is intended (**no change**).

## Recommended answer

**(c) — confirm as intended.** It is the reading most consistent with *«один раз на весь мир/сервер»*: a single world-unique artifact whose owner is fixed by who crafted it first. Options (a) and (b) both require new mechanics the spec does not describe, and (a) in particular would add a death-cause distinction to `L0-keep-p001` that nothing else in the document anticipates.

**Note.** Under `L0-keep-r003`, admin/`/give` copies are *not* retained and therefore **are** lootable. So the world can already contain lootable Web Swords if an operator chooses to hand them out. That is a partial answer to the design tension, but only through operator action, not through gameplay.
