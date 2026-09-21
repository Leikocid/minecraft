---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
title: "Constraints"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["constraint"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 6201
tags: ["constraint","nfr","policy","compatibility","web-sword","L0"]
---

# Constraints

**Links** — `title: Constraints` · `aliases: ["L0-constraint", "Constraints"]` · `part_of: ["L0"]` · `is_a: ["constraint"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-2", "stage-0-infrastructure"]` · `governs_files: ["packs/behavior/manifest.json", "packs/resource/manifest.json", "package.json"]` · `supersedes: ["L0"]`

## C-1 — Stable API only (governing policy)

*«Предпочтение: stable Bedrock APIs. Не использовать Preview/Beta API, если механика реализуема стабильным способом.»* (§11) · *«Нет обязательной зависимости от Experiments/Preview.»* (§14)

Inherited unbroken from Stage 0. This is the project's strongest policy and it **binds design, not just dependencies**: if a mechanic is only expressible via a Beta API, the mechanic changes — the channel does not. `@minecraft/server` **2.10.0**; `min_engine_version` **[1, 26, 50]**; target game **Bedrock 1.26.51**.

The `@minecraft/server-gametest` dependency (`1.0.0-beta.…`) is a **devDependency used by `packs/gametest`** and must never become a runtime dependency of `packs/behavior`. Any change that makes the shipped behavior pack require it violates §14.

## C-2 — Retarget the pack to the game, never the reverse

Stage 1's rule, still governing: *"If the installed game reports a dependency or format error, use the exact error text to retarget the pack rather than enabling Preview/Beta APIs by default."* Version failures are diagnosed from log text, not worked around by loosening the channel.

## C-3 — Server-authoritative execution

*«Способность должна вычисляться серверной логикой, чтобы все игроки видели одинаковый результат.»* (§9) · *«Targeting и размещение 3×3×3 должны выполняться серверно.»* (§11)

No client-side prediction, no per-client divergence. Two clients observing the same activation must see the same 27 cells resolve identically. This forbids any design where block placement is derived from client-supplied state that the server does not re-validate.

## C-4 — No per-tick global world scan (performance)

*«Не делать постоянный глобальный скан мира каждый tick.»* (§11)

The only explicit performance requirement in the spec, and it is phrased as a prohibition. Ability logic must be **event-driven** (activation events, death events, craft events), not polling. Cooldown display is the one place a recurring tick is defensible, and it must be scoped to players actually holding the sword — not to the world.

## C-5 — Dedicated-multiplayer safety

*«Любая реализация должна быть безопасной для dedicated multiplayer server.»* (§11)

Concretely: concurrent crafts by two players must not both succeed (§9); concurrent activations must each resolve independently (§9); no global mutable state may assume a single player. The Docker BDS rig is the test surface for this, not the single-player world.

## C-6 — Durable world-level state

*«Persistent one-per-world state хранить в устойчивом world-level состоянии, доступном после рестартов.»* (§11) · *«Флаг успешного крафта должен сохраняться после выхода игроков, сохранения мира и рестарта сервера.»* (§3)

State must survive three distinct events — player logout, world save, server restart — and §13 makes restart survival an explicit acceptance test. Per-player or in-memory state does not satisfy this.

## C-7 — No duplication paths (security/integrity invariant)

*«Нет известных способов дюпа через крафт, смерть или reconnect.»* (§14) · *«Реализация обязана предотвращать появление дополнительной копии при смерти, disconnect/reconnect и рестарте.»* (§4) · *«Смерть во время cooldown не должна создавать копию меча или сбрасывать persistent one-per-world flag.»* (§12)

This is stated as an absolute. It is the single most demanding non-functional requirement in the spec and it constrains `L0-once` and `L0-keep` jointly — a fix on one side can open a hole on the other.

## C-8 — Non-destructive world mutation

*«Не удалять и не заменять сущности… Не заменять контейнеры и функциональные блоки с важным содержимым/данными… Не заменять bedrock и другие явно защищённые/неразрушаемые специальные блоки.»* (§6)

The ability writes to shared world state that other players own. The default posture is **deny**: a cell whose safety cannot be established must be skipped, not filled. Note that the spec names only *examples* of protected blocks — the closed list is an assumption (see ASM-007).

## C-9 — Localization is structural, not cosmetic

*«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт.»* (§10)

Stated as a prohibition on implementation technique. Scripts must emit translate keys (rawtext), never literal strings — and this covers **runtime messages**, not only the item name: the first-craft announcement and the cooldown readout are both explicitly in scope. Existing catalogues: `packs/resource/texts/ru_RU.lang`, `en_US.lang`.

## C-10 — Preserve the delivered platform

Stages 0 and 1 are shipped at v0.2.1. The Web Sword extends the same BP/RP. `andrew:miners_pickaxe`, the auto-smelt behaviour, the build/validate pipeline and the 7 existing test suites must continue to pass. Version bumps go through `npm run version:set` (the established one-command path), which keeps `package.json` and all four manifests in step.

## C-11 — Three-hop verification loop (environmental)

No Bedrock client exists for macOS. Verification is necessarily split: **Docker BDS** answers *"did it load and run?"* (greppable logs, GameTest, multiplayer), **iPad** answers *"does it look right?"* (Creative visibility, icon, RU/EN rendering, actionbar). Neither can substitute for the other. §14's two-player requirement strains this environment — see ASM-010.

## C-12 — Effort envelope (planning constraint)

§15 budgets **2–5 h** to a first working prototype and **4–10 h** to a properly tested standalone module, *conditional on the AI agent being able to launch Bedrock and read runtime/content logs quickly*. That precondition is satisfied (`bds:check`, `bds:gametest`). The estimate explicitly attributes most of the cost to one-per-world persistence, death-retention/anti-dup and multiplayer edge cases — the same three areas C-6 and C-7 govern.
