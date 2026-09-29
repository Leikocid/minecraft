---
type: "concept-assumption"
node_id: "cool-asm3"
source_channel: "rollout"
analysis_version: 1
title: "A-3 · \"Общие правила легендарных оружий\" = union of Web Sword + Scythe rules, applied to every legendary"
aliases: ["cool-asm3"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1140
tags: ["decided", "legendary", "title:Common legendary rules apply to all weapons"]
---
# A-3 · "Общие правила легендарных оружий" = union of Web Sword + Scythe rules, applied to every legendary

**Gap.** No standalone document defines the shared legendary rules. The Scythe spec references them (incl. void return and "не должно уничтожаться обычными способами"); the Web Sword spec re-states most of them but has no void/indestructibility rule.

**Assumption (decided).** The shared rule set = one Survival craft per world (persistent, race-safe, refund on blocked craft), first-craft global RU/EN announcement, Creative/`/give` exempt, keep on death + return to owner without dup, return to last owner on void fall / destruction (lava, fire, cactus, despawn), infinite durability, 30 s cooldown with Action Bar, main-hand priority. It applies retroactively to the Web Sword.

**Impact if wrong.** If void return / indestructibility is Scythe-only, the `lgnd` framework adds unneeded behaviour to Web Sword; implemented in `src/legendary/recovery.ts` (ed7558b); proven by `legendary_returns_from_void` / `legendary_survives_lava` on `andrew:web_sword`.
