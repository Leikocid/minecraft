---
title: Glossary
type: project-knowledge
generated_at: "2026-09-20T16:22:35.841Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0"]
priority: 120
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Acceptance Criteria (L0)

# Acceptance Criteria

Both stages ship with explicit pass criteria. They are reproduced here verbatim in substance, with the verification surface (which machine can actually observe each one) made explicit — because no single machine can check them all (see constraint C-6).

---

## Stage 0 — infrastructure gate

Stage 1 must not begin until **all five** pass.

| ID | Criterion | Verified on |
|---|---|---|
| **AC-S0-1** | `npm run build` produces a `.mcaddon` **from a clean clone**; TypeScript compiles without errors against `@minecraft/server` types | Mac |
| **AC-S0-2** | Manifest JSON and item JSON pass validation | Mac |
| **AC-S0-3** | BDS in Docker starts **with the pack loaded**: no dependency/manifest errors in the log, and the script executes | Docker BDS |
| **AC-S0-4** | iPad: `.mcaddon` imports without errors; entering a world with the pack enabled shows the chat message; the item is visible in Creative with **both** RU and EN names | iPad |
| **AC-S0-5** | Project in git with a first commit | Mac |

**Current status: none met.** The repository has no commits and no `package.json`.

### Notes on Stage 0 criteria

- **AC-S0-1 says "from a clean clone"** — this is the criterion most easily faked by testing in a dirty working tree. It should be verified by an actual fresh `git clone` into a temp directory, not by `rm -rf node_modules`.
- **AC-S0-4 bundles three independent checks** (import succeeds, script fires, item renders localized). If it fails, note *which* of the three failed — they have different root causes and different fixes.
- **AC-S0-3 and AC-S0-4 must both run.** BDS proves the script executes but renders nothing; the iPad proves rendering but yields no usable log. Passing only one leaves half the pipeline unproven.

---

## Stage 1 — Miner's Pickaxe probe

| ID | Criterion | Verified on |
|---|---|---|
| **AC-S1-1** | The `.mcaddon` imports without dependency/manifest errors | iPad (+ BDS log) |
| **AC-S1-2** | The item is visible in Creative and obtainable with `/give` | iPad |
| **AC-S1-3** | The recipe crafts the item | iPad |
| **AC-S1-4** | Supported ores produce smelted drops **in Survival** | iPad, Survival world |
| **AC-S1-5** | The item accepts pickaxe enchantments and does not break | iPad |

### Notes on Stage 1 criteria

- **AC-S1-4 explicitly requires Survival.** Creative mode suppresses block drops, so a Creative test proves nothing about auto-smelt. A Survival world is a mandatory part of the test setup.
- **AC-S1-4 should be read against the full allow-list** in `concept-entity` E-1 — all seven block types, including the three deepslate variants and ancient debris, not just the first one that works. It should also be checked *negatively*: a non-listed block (e.g. stone, coal ore, diamond ore) must still drop its vanilla item.
- **AC-S1-5 couples two claims** — "accepts enchantments" and "does not break". The second is trivially satisfied by the missing durability component; the first may be *prevented* by that same omission. See ASM-004.
- **AC-S1-1 and AC-S1-2 duplicate AC-S0-4.** Both stages independently require clean import plus Creative visibility. See `concept-contradiction` CTR-002 — recommend trimming these from Stage 1 rather than re-running them.
- **No criterion covers mining speed.** "Diamond-like intended mining speed" is specified as gameplay but has no pass criterion, consistent with the spec deferring exact tag parity. Do not block Stage 1 on mining-speed feel.

---

## Missing criteria (gaps)

These are specified behaviors with **no corresponding pass criterion**:

| Behavior | Has criterion? |
|---|---|
| Creative **search** finds the item (S1-3 scope) | No — only "visible in Creative" is tested |
| Russian/English names on the *pickaxe* | No — localization is only tested at Stage 0 |
| Mining speed | No — deferred by design |
| Non-listed blocks keep vanilla behavior | No — the negative case is unspecified |

Recommend adding the negative auto-smelt case at minimum; a drop-replacement script that over-matches is the most likely functional defect in Stage 1 and nothing currently catches it.


- **node**: L0

