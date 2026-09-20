---
title: Business Rules
type: project-knowledge
generated_at: "2026-09-20T16:22:35.847Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0"]
priority: 120
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Constraints (L0)

# Constraints

## C-1 — Platform: Bedrock Edition only

Minecraft **Bedrock Edition**. Java Edition is excluded outright because the target play device is an iPad. This is a root constraint: it fixes the add-on format (`.mcaddon`, behavior pack + resource pack + JSON manifests), the scripting surface (`@minecraft/server`), and the fact that no macOS client exists.

## C-2 — Stable Script API only (policy)

Only the **stable** `@minecraft/server` API may be used: **2.9.0**, or 2.10.0 if required (described in Stage 0 as the current stable on npm). **Beta/Preview APIs must not be enabled.**

This is a *policy* constraint, not merely a technical preference — it exists because the whole point of Stage 1 is to probe compatibility with the retail game. Preview APIs would require a Preview client and would hide exactly the failure the probe is designed to find.

## C-3 — Retargeting discipline (policy)

> *"If the installed game reports a dependency or format error, use the exact error text to retarget the pack rather than enabling Preview/Beta APIs by default."*

The prescribed failure response is **read the error, change the declared versions to match**. The forbidden response is **loosen the API channel until the error disappears**. Any troubleshooting that reaches for `"beta"` module versions, Preview builds, or experimental toggles violates this constraint and must be escalated instead.

## C-4 — Version targets (currently unverified)

| Setting | Declared value | Confidence |
|---|---|---|
| `@minecraft/server` | 2.9.0 (2.10.0 permitted) | Declared in both sources |
| `min_engine_version` | 1.26.0 | Declared in Stage 1 spec only |
| Compatibility target | "current Bedrock 26.x" | Declared in Stage 1 spec only |

Stage 0 states that the true values **depend on an unanswered question** — the exact version reported by the iPad. Until Q-001 is answered, these values are targets, not facts. See `concept-contradiction` CTR-001.

## C-5 — Hardware and architecture

- **Mac mini, Apple M4 Pro (arm64).** Build, static analysis, packaging.
- **BDS Docker image is `linux/amd64`** and therefore runs **under Rosetta emulation**. Expect slower startup and the class of bugs specific to emulated x86 workloads; a platform flag will be required when pulling/running the image.
- **iPad** runs retail Bedrock from the App Store — the version there is whatever the App Store shipped and cannot be freely chosen. The iPad's version constrains the project, not the other way round.
- **No macOS Bedrock client exists.** There is no way to shorten the loop by testing the client on the Mac.

## C-6 — Verification split (structural)

No single machine can verify a build. Behavior-pack loading, manifest/dependency errors and script execution are only diagnosable from the **Docker BDS log**. Resource-pack rendering, item icons, Creative inventory placement and RU/EN localization are only observable on the **iPad GUI**. Any acceptance procedure must touch both.

## C-7 — Build reproducibility

`npm run build` must produce `dist/<name>.mcaddon` **from a clean clone**, with TypeScript compiling without errors against the `@minecraft/server` types. Manifest and item JSON must pass validation. This rules out manual packaging steps, uncommitted local files, and machine-specific paths.

## C-8 — Localization is mandatory, both stages

Every custom item must carry **both Russian and English** names — the trivial Stage 0 item as well as Кирка шахтёра / Miner's Pickaxe. Localization is not a finishing touch here; it is one of the things being *tested* (it proves the resource pack's `.lang` files are being read).

## C-9 — Survival-observable behavior

The auto-smelt acceptance criterion is explicitly *"Supported ores produce smelted drops **in Survival**"*. Creative-mode verification is insufficient for drop behavior, since Creative suppresses normal block drops. The test procedure must include a Survival world.

## C-10 — Language and tooling (proposed, not settled)

TypeScript is **proposed** as the scripting language, with plain JavaScript as the open alternative (Q-003). Until resolved, avoid build-pipeline work that is expensive to reverse in either direction.

## C-11 — Staging gate (process)

*«Прототип из `Miners_Pickaxe_Test_Spec` начинается только после закрытия этого этапа.»* Stage 1 work must not begin until every Stage 0 pass criterion is met. This is a sequencing constraint with teeth: starting the pickaxe early would reintroduce exactly the ambiguity (pipeline failure vs. content failure) that Stage 0 exists to eliminate.




- **node**: L0

