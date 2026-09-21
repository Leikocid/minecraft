---
title: Intent
type: project-knowledge
generated_at: "2026-09-21T21:24:41.653Z"
source_channel: rollout
node_id: rollout-intent
aliases: ["rollout-intent","intent","project-knowledge/intent"]
is_a: ["rollout","intent"]
relates_to: ["L0"]
priority: 510
---

# Intent

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

_node: L0_

# Project Intent

**Links** — `title: Project Intent` · `aliases: ["L0-intent", "Intent"]` · `part_of: ["L0"]` · `is_a: ["intent"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "stage-0-infrastructure"]` · `supersedes: ["L0"]`

## Primary goal

Ship a **Minecraft Bedrock PvP Add-On** playable on the owner's iPad, built around a set of **legendary weapons** — custom items with unique, script-driven active abilities that go beyond vanilla combat.

The Web Sword is **weapon #1**. Its spec states the goal in one line: *«отдельная спецификация первого легендарного оружия для Minecraft Bedrock PvP Add-On»*.

## Goal hierarchy

| # | Goal | Status | Source |
|---|---|---|---|
| G-1 | Prove the build → deploy → verify loop works on the available hardware | **Achieved** (Stage 0) | stage-0 |
| G-2 | Prove custom items, recipes, enchantment slots and script-driven behaviour work on the *installed* game version | **Achieved** (Stage 1, v0.2.1) | pickaxe-spec |
| G-3 | Deliver the first legendary weapon as a self-contained, fully tested module | **Active** | websword §14 |
| G-4 | Repeat G-3 per weapon until the PvP add-on is complete | Future | websword §14 |
| G-5 | Ship the assembled PvP add-on | Future, unspecified | stage-0 |

G-3's completion condition is explicit and is the operative definition of "done" for this analysis cycle: *«После прохождения тестов Web Sword можно считать самостоятельным готовым модулем и переходить к следующему оружию.»*

## The intent behind the intent — why "standalone module"

The Web Sword spec is not merely a feature request; it is a **process template**. It deliberately scopes one weapon to independent development and testing *before* integration, so that each subsequent weapon can follow the same path. The project's real product is therefore twofold:

1. the weapons themselves, and
2. a **repeatable per-weapon pipeline** — spec → BP item + recipe → Script API behaviour → RU/EN strings → GameTest coverage → BDS load check → iPad visual confirmation.

Stage 1 built that pipeline's machinery (`npm run build`, `bds:check`, `bds:gametest`, selftest pack, validation suite). The Web Sword is its first production use. Design choices that make the second weapon cheaper are therefore *on*-intent, even where the spec only asks for the first — this is the justification for extracting shared cooldown and localization services rather than inlining them (see `concept-architecture-decision` ADR-007, ADR-009).

## Gameplay intent — what the Web Sword is *for*

A **trap weapon**, not a damage weapon. Its melee profile is deliberately unremarkable (Diamond Sword parity, §7: *«У обычного melee-удара нет дополнительного эффекта»*). All of its value sits in one ability: entombing a target position in a 3×3×3 Cobweb cube on a 30-second cycle — area denial and escape prevention in PvP.

Three design commitments follow from that and should govern every implementation trade-off:

- **The cobweb is real and it persists.** *«Созданная паутина является настоящими обычными cobweb blocks и остаётся в мире, пока игроки не уберут её обычным способом.»* The ability permanently alters shared world state. It is not a timed effect, and the spec asks for no cleanup.
- **Scarcity is the balance mechanism.** One successful survival craft per world, forever (§3), combined with death retention (§4) so the single instance cannot be farmed or lost. The 30-second cooldown is the secondary limiter.
- **Fairness is enforced server-side.** *«Способность должна вычисляться серверной логикой, чтобы все игроки видели одинаковый результат»* (§9). Two players must see identical world state; no client may be authoritative.

## Non-goals

- **Not** a general-purpose building or terraforming tool — the block-replacement rules exist to make a trap, and destroying player property is explicitly guarded against (§6).
- **Not** a damage-tuning exercise — vanilla Diamond Sword numbers, unchanged.
- **Not** a showcase for new Bedrock APIs — the project prefers stable APIs and treats Preview/Beta as a failure mode (§11), a policy inherited unbroken from Stage 0.

## Success criteria at project level

Web Sword is done when all twelve §13 acceptance tests pass **in a single-player world and in a two-player multiplayer test**, the pack imports with no content or dependency errors on Bedrock 1.26.51, there is **no known duplication path via craft, death or reconnect**, and nothing depends on Experiments or Preview (§14).
