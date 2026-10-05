# Diagnose CNTR-LGND-CX15-AA · CX-lgnd-15

ИСХОД: 1 — Закрыть за недостатком улик

The claim was right when it was written, and it is already settled. `sc` is the Scythe's prefix: it is in the registry today and in every shipped bundle since 0.4.0. A def #5 with `sc` would share all nine of the Scythe's keys and its gen ledger.

Nothing today says the crossbow gets `sc`:
- `L0-adr-sckp` gives it `sk`.
- The plan row, `xasm26` and every `sclk`/`lgnd` node were reconciled to `sk`.
- No crossbow code exists.
- The registry uniqueness test refuses `sc` and accepts `sk`, as measured below.

There is no divergence left in code or KV, and nothing for the operator to decide.

Probe: `docs/feedback/diagnose-CNTR-LGND-CX15.probe.sh` (modes `search`, `keys`, `dup <prefix>`). `dup` edits `registry.ts` for the run only and restores it. Nothing was committed to `src/`. KV line numbers come from the root's `.ai/context` (read-only). The worktree copy (`73a9c41`, 2026-10-04) has no v7 nodes.

| Check | Artifact | Exit |
|---|---|---|
| `bash docs/feedback/diagnose-CNTR-LGND-CX15.probe.sh dup sc` | `.ai/verify/CNTR-LGND-CX15-AA/2.red.json` | 1, expect-red |
| `… probe.sh keys && … probe.sh dup sk` | `.ai/verify/CNTR-LGND-CX15-AA/2.json` | 0 |
| `… probe.sh search` | `.ai/verify/CNTR-LGND-CX15-AA/3.json` | 0 |

## Phase blocks

OBSERVED: `L0-lgnd-cx15` (resolved by `L0-adr-sckp`) says the v7 plan row (`lgnd`, item 3) and `L0-xasm26` gave def #5 `keyPrefix "sc"`, which the Scythe holds. Today `registry.ts:55` gives the Scythe `"sc"`. The plan row (`concept-decomposition-plan.md:52`) and `xasm26:27` say `"sk"`. No def #5 exists in `src/`.
VERDICT: hypothesis about a build that does not exist, from a plan line that no longer says it. It was investigated anyway, because it concerns live world state. Nothing diverges.
CHECKS: contradiction: none (the finding agrees with `L0-adr-sckp`) · duplicate: the node is already resolved by `L0-adr-sckp`; no crossbow task is on the board · criteria writable: yes, but nothing is left to do.
UNFOLD: nothing. HUMAN: none.
REPRO: `probe.sh dup sc` → `✖ item ids, prefixes and ability keys are unique across the registry`, `AssertionError: duplicate keyPrefix`, exit 1. Deterministic (3 runs: 2 plain, 1 under run-check).
CAUSE: every persistent key is derived from `keyPrefix` alone:
- `keysFor` (`src/legendary/registry.ts:166-179`) and `genLedgerKey` (`:182-184`) build the keys;
- these readers use nothing else: `isCrafted`/`setCrafted`/`resetCrafted` (`src/legendary/state.ts:98-113`), pending (`:117`, `:121`), owed (`:131`, `:135`) and the gen ledger (`:72`, `:82`).

A shared prefix therefore means a shared craft flag, shared ledgers, and a `reset` that clears both weapons' flag. Measured by `probe.sh keys`: with `sc` the crossbow shares 9/9 Scythe keys plus the gen ledger; with `sk` it shares 0/9 and clashes with no shipped def.
PROOF: `.ai/verify/CNTR-LGND-CX15-AA/2.red.json`.
RULED OUT:
- "Any 5th def fails the uniqueness test." The `sk` control fails the same 8 fixture tests (no recipe, lang or four-weapon tables) and passes the uniqueness test. The failing sets differ in exactly that test and its parent suite `registry` (10 vs 8 failures).
- "The KV still gives the crossbow `sc`." A grep of the root KV finds every crossbow prefix statement says `sk` (list below).
- "The Scythe moved off `sc`." `registry.ts:55` says `sc`. So do the bundles 0.4.0–1.1.0, and `tests/scythe-item.test.mjs:335` pins it.
RADIUS: no fix is proposed. The things that depend on the prefix are the 11 `keysFor`/`genLedgerKey` calls in `src/legendary/state.ts`, two gametest reads, and the future def #5 task, which `lgnd-ac25:20` already pins to `andrew:sk_crafted`. Found by `git grep -nE "keysFor\(|genLedgerKey\("` over `src`, and by grepping the KV for `sc`/`sk`/`keyPrefix`.
GREEN: not applicable, because there is no fix. The control `dup sk` is green (exit 0); the uniqueness test runs and passes (`✔ item ids, prefixes…`).
LIVE: no world file was read. That a world which crafted the Scythe holds `andrew:sc_*` follows from the shipped bundles writing those keys through `keysFor`. Which worlds actually crafted it was not measured.

## Prefix occupancy (criterion 2)

| Prefix | Holder | Where |
|---|---|---|
| `ws` | Web Sword | `src/legendary/registry.ts:39`; pinned at `tests/legendary-registry.test.mjs:107` |
| `sc` | Scythe of Calamity | `src/legendary/registry.ts:55`; pinned at `tests/scythe-item.test.mjs:335` |
| `oc` | Orbital Cannon | `src/legendary/registry.ts:72`; pinned at `tests/orbital-item.test.mjs:228-233` |
| `dk` | Dragon Katana | `src/legendary/registry.ts:89`; pinned at `tests/legendary-registry.test.mjs:128` |
| `tl` | test-only `OTHER`, not in `LEGENDARIES` | `tests/legendary-registry.test.mjs:77` |
| `sk` | nobody | no def, no `andrew:sk_`, `sk_*` or `"sk"` in any tracked file outside `.ai` |

- **Shipped.** `releases/andrew-0.4.0` … `andrew-1.1.0.mcaddon` each carry `SCYTHE_OF_CALAMITY` with `keyPrefix: "sc"` in `behavior/scripts/main.js` (`:71` in 0.4.0, `:83` in 1.1.0). 0.1.0–0.3.2 carry neither prefix.
- **Since when.** The Scythe's prefix arrived in `8a8d500` (SC-ITEM-01-AA, 2026-09-24) and first shipped in stage-3 build 0.4.0 (`dcb0bb4`). The claim's "since v3" means that stage.
- **Uniqueness guard.** `tests/legendary-registry.test.mjs:118-123` checks `itemId`, `keyPrefix`, `abilityKey`, `command`, `craftTokenId` and `textPrefix` over `LEGENDARIES`. Measured red for `sc` and green for `sk` (artifacts above).

## Copies, found by search (criterion 3)

Code and tests: no literal `andrew:sc_` exists outside `.ai`. Every Scythe key is derived:
- `src/gametest/ufo-magnet-select.ts:675`, `:690`: `genLedgerKey(SCYTHE_OF_CALAMITY, …)` → `andrew:sc_gen:<id>`;
- `src/legendary/state.ts:32, 47, 72, 82, 99, 103, 110, 117, 121, 131, 135`: generic per-def derivation;
- no `andrew:sk_` exists anywhere outside `.ai`.

KV, root `.ai/context/analysis/`. Copies of the claim, in the resolved contradiction record and its rollups:
- `nodes/lgnd-cx15__concept-contradiction.md:6, 16, 20, 29`
- `risks.md:151, 155, 164`
- `contradictions.md:146, 150, 159`

KV statements that give the crossbow its prefix. All say `sk`:
- `nodes/concept-decomposition-plan.md:52` (annotated "the plan first said `sc` … corrected at reduce");
- `nodes/xasm26__concept-assumption.md:27`, the same as `assumptions.md:562`;
- `nodes/adr-sckp__concept-architecture-decision.md:27, 29, 33`, the same as `project-knowledge/architecture.md:282, 284, 288`;
- `nodes/sclk-p006__concept-process.md:28`, `nodes/sclk-ent1__concept-entity.md:36`;
- `nodes/sclk-ac01…:20`, `sclk-ac02…:17`, `sclk-ac03…:17` (flag `sk`);
- `nodes/lgnd-as18__concept-assumption.md:23`, `nodes/lgnd-ent1__concept-entity.md:51`;
- `nodes/lgnd-ad16__concept-architecture-decision.md:23, 32`;
- `nodes/lgnd-ac25__concept-acceptance-criterion.md:20, 21, 24`, the same as `scope.md:571, 572, 575` and `project-knowledge/glossary.md:569, 570, 573`;
- `summary.md:38, 60`, the same as `nodes/concept-overview.md:32, 54`.

KV statements that give the Scythe `sc`, all correct:
- `nodes/lgnd-as02__concept-assumption.md:15`, `nodes/lgnd-ent1__concept-entity.md:48`;
- `nodes/scyt-ent1__concept-entity.md:37`, `nodes/scyt-p004__concept-process.md:23`;
- `nodes/lgnd-ac18__concept-acceptance-criterion.md:29`, the same as `project-knowledge/glossary.md:640` and `scope.md:573`.

No KV statement gives the crossbow `sc`.

One lagging label: `lgnd-ent1:51` reads "`sk` (proposed, `as18`)", but `L0-adr-sckp` is accepted. The value is right and no reader is misdirected, so it is not a cleanup item.

## Nothing created

No `task_create`, no `refine`/`resolve`, and no edit under `.ai/context`. The `dup` probe's `registry.ts` edit is restored by the script, which checks `git diff --quiet` after every run.
