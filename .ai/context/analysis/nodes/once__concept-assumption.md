---
type: "concept-assumption"
node_id: "L0-once"
source_channel: "rollout"
title: "Assumptions — One-per-World Craft Gate"
aliases: ["L0-once"]
part_of: ["L0-once"]
is_a: ["assumption"]
relates_to: ["L0-once"]
analysis_version: 2
level: 1
priority: 510
size_chars: 3976
tags: ["assumption","gap","web-sword","L0-once"]
---

# Assumptions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["assumption"]` · `relates_to: ["L0", "L0-keep"]` · `see_also: ["webswordspecv1ruen-part-1"]`

**Inherited from L0 and still owned here:** **ASM-011** (blocked craft degrades to detect-and-refund) and **ASM-012** (announcement reaches only players online at craft time). Neither is restated below; both remain `CAN_ASSUME` and are refined by R-005 and `L0-once-ebrd` respectively.

Three new assumptions arise at this depth.

---

## ASM-013 — Non-Creative crafting spends the budget, whatever the mode `MUST_ASK`

**Assumed.** "Survival craft" means *any craft that is not performed in Creative mode*. An Adventure-mode player crafting at a table spends the world's budget exactly as a Survival player does. Spectator cannot craft and is moot.

**Basis.** §3 names only two modes — *«В Survival»* and *«Creative и /give … НЕ расходуют»* — and never mentions Adventure. The spec's intent is clearly a Survival-vs-admin split, and Adventure is a play mode, not an admin mode, so it belongs on the Survival side.

**Impact if wrong.** Low severity but a real bypass in one direction: if Adventure crafts are wrongly exempted on a server that uses Adventure as its main mode (a common PvP-map configuration — and this add-on is for a **PvP** add-on per the spec preamble), the gate never closes and the weapon is unlimited. The reverse error (Adventure wrongly spends the budget on a map where it was meant to be free) is merely annoying. Given the PvP context, **the asymmetry favours the assumed default**, but the owner should confirm which mode their maps actually run in.

---

## ASM-014 — Craft completion raises exactly one server-side event per craft, including shift-click bulk crafts

**Assumed.** The stable `@minecraft/server` surface raises one craft-completion signal per craft of `andrew:web_sword`, carrying the crafting player, and a shift-click "craft all" cannot produce multiple swords under a single signal.

**Basis.** Not stated anywhere in the spec — this is engine behaviour the analysis cannot verify from the repository. The recipe consumes a Diamond Sword, so a bulk craft requires N diamond swords and is unusual but not impossible for a stocked player.

**Impact if wrong.** Direct C-7 duplication path, and the worst-flavoured one: a single shift-click yielding two or three Web Swords while setting the flag once. It would pass every §13 test, all of which craft singly. **Falsify early** — a GameTest that gives a simulated player 3× Diamond Sword + 12× Cobweb and shift-clicks the result is cheap and decisive. If bulk crafts do collapse into one signal, the blocked path must clamp the result to zero rather than "remove one".

---

## ASM-015 — A read-check-write inside one handler invocation is atomic

**Assumed.** The Bedrock script host runs a single event handler to completion before dispatching the next, so reading the world craft flag and writing it back within one uninterrupted synchronous handler body cannot be interleaved with another player's craft handler. This is the entire basis of R-004's race safety.

**Basis.** Standard single-threaded event-loop semantics, consistent with how the shipped `src/autosmelt.ts` handles block-break events. **Not verified against Microsoft's documentation by this analysis.**

**Impact if wrong.** If handlers can interleave — or if dynamic-property writes are asynchronous under the hood and a read can observe a stale value — then two simultaneous crafts both observe an unset flag and both succeed. That is §9's named bypass and a C-7 dup path, and it is *timing-dependent*, so it may pass the acceptance test by luck and fail in production. Mitigation if the assumption falls: an in-memory claim latch set before the property write and consulted by every handler in the same tick, which does not depend on storage semantics. Flag to `L0-qatg` that AC-ONCE-5 needs repeated runs, not a single pass.
