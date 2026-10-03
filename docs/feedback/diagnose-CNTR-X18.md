ИСХОД: 3 — Подчистка знания

# CNTR-X18-AA · CX-L0-18: the hopper is both an untouched container and a pullable iron block

The code does not follow the resolution recorded in the node, which is option (a): "container only". It classifies a hopper by its contents. A hopper holding anything is a container and stays; an empty hopper is a built block and is pulled (`src/ufo/iron.ts:141`).

The operator wrote that rule into the spec on 2026-10-02:
- commit `2441fb5`, UFO §5 Containers (last bullet) and AC-10;
- recorded as `decision-resolve-l0-lgnd-cx13`.

Code, spec and decision agree with each other. What is stale is the knowledge: `L0-xcx18` and 13 more KV nodes still state the v4 rule, "a hopper is never a pulled block". No code work is needed and no operator decision is pending.

## Intake

**OBSERVED.**
- **KV (the claim).**
  - `xcx18:42`: "Resolved at reduce v4 by `L0-magn-adhp` (option a)".
  - `magn-adhp:26–27`: "A placed hopper is in CONTAINER_BLOCKS only … removed from IRON_BLOCKS and is never a class 4 candidate".
- **Code today.** The hopper is on all three lists in `src/ufo/iron.ts`:
  - `:62`: in `IRON_ITEMS`, so a hopper *item* is iron.
  - `:79`: in `BLOCK_ITEMS` (class 4, gives `minecraft:hopper`). The comment at `:72–73` reads: "The hopper is here only for when it is empty: one with anything in it is a container (§5, L0-lgnd-cx13)".
  - `:97`: in `CONTAINER_BLOCKS` (class 2).
  - `:132`: `SCAN_TYPES` is the union of the lists, so every hopper is scanned.
  - `:140–141`: `blockRole` returns `hopperEmpty() ? "built" : "container"`. It checks the hopper before the container set (`:142`) and the built set (`:143`).
- **The caller.**
  - `src/ufo/magnet-select.ts:237` passes `isEmpty(inventory.container)`.
  - `:187–191`: `isEmpty` is true only when every slot is `undefined`. A missing inventory component counts as *not* empty, so that hopper is treated as a container (the safe side).
  - `:251–252` routes the hopper to `containers` or `built`.
- **The spec today** (KV raw):
  - `ufomagnetspecv1ruen-part-2.md:63`: «Воронка, в которой есть хоть что-то, считается контейнером: из неё вынимаются железные стопки, сама воронка остаётся на месте. Пустая воронка притягивается как железный блок.»
  - `ufomagnetspecv1ruen-part-4.md:43` (AC-10): "a hopper with contents keeps its place and only its iron stacks are taken".
- **The decision.** `analysis/decisions/decision-resolve-l0-lgnd-cx13.md:12`, decided 2026-10-02 with outcome `changed`. Its evidence is spec commit `2441fb5`, a `records-decision` by the operator.

**VERDICT.** The code is not at fault: it matches the current spec and the latest decision. The live divergence is between the code and the KV text. The (a) resolution of xcx18 was replaced on 2026-10-02 and the nodes were never rewritten, so this is a knowledge defect.

## Investigation

**REPRO** (the code path, not the node text).
- **Node tests.** Run as `ai-kit run-check --task CNTR-X18-AA --criterion 2 -- node --test --test-name-pattern=hopper tests/ufo-iron.test.mjs tests/ufo-select.test.mjs`. Result: 2 of 2 pass, artifact `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-X18-AA/2.json`.
  - `tests/ufo-iron.test.mjs:213–215`: `blockRole(HOPPER, empty)` is `built`; non-empty is `container`.
  - `tests/ufo-select.test.mjs:468–482`:
    - a full hopper stays and gives up only its ingot;
    - a hopper holding only a legendary stays (`:473`, `:479`);
    - an empty hopper turns into one `minecraft:hopper` item.
- **BDS GameTests** in `src/gametest/ufo-magnet-select.ts`, green on BDS 1.26.51.1:
  - `andrew:ufo_magnet_blocks` (`:461`). The empty hopper (`:474`) leaves air and exactly one `minecraft:hopper` item of class 4 (`:507–514`).
  - `andrew:ufo_magnet_containers` (`:355`). A hopper holding iron and dirt (`:363`):
    - keeps its block and its dirt (`:429–433`);
    - loses only the iron;
    - fails with "the non-empty hopper is gone" (`:438`) if the block disappears.
  - `andrew:ufo_magnet_legendaries` (`:653`). A hopper holding only the Orbital Cannon (`:665–670`) stays, with the Cannon still inside (`:689`).
- **Artifacts with `onTestPassed` for all three scenarios:**
  - `.ai/verify/MAGN-SCAN-01-AA/1.json` at `27f3a1a`;
  - `.ai/verify/MAGN-HOLD-01-AA/1.json` at `96e8dd7`;
  - `.ai/verify/SAUC-SHOOT-01-AA/2.json` and `3.json` at `27a2f01`.
- **These results still apply to the code today.** `27a2f01` is the last commit that touches `src/ufo` (`git log 27f3a1a..HEAD -- src/ufo`). `git diff --quiet 27a2f01 HEAD -- src/ufo src/gametest/ufo-magnet-select.ts src/legendary/registry.ts` shows no drift. I did not re-run BDS in this task.

**CAUSE.** The knowledge fell behind three changes:
1. **Reduce v4.** xcx18 was resolved as (a) through `magn-adhp`. `adr-ufnd` folded `lgnd-cx13` into the same reading ("never a pulled block, full or empty").
2. **2026-10-02, `2441fb5`.** Spec §5 gained the hopper rule, and `decision-resolve-l0-lgnd-cx13` closed with outcome `changed`. In `lgnd-cx13`'s own terms the new rule is option (b), "never select a hopper block that holds anything" (`lgnd-cx13:44`). In xcx18's terms it is (c) for an empty hopper and (a) otherwise.
3. **2026-10-03, `27f3a1a` (MAGN-SCAN-01-AA).** The code implemented the new rule and cites `L0-lgnd-cx13` (`iron.ts:73`).

Only `lgnd-cx13`'s frontmatter followed the decision (`closed_by_ref`, `:15–17`). Its body, `magn-adhp`, `adr-ufnd` and every node citing them still state the v4 rule. Nobody reopened xcx18.

**PROOF.** Three checks above, each by its own operation:
- `iron.ts:141` read by line;
- the node run-check artifact;
- the BDS artifacts at the current `src/ufo` code.

**RULED OUT.**
- *"The hopper entry in `BLOCK_ITEMS` is dead because the container check wins."* Killed: `blockRole:141` tests `HOPPER` before `CONTAINER_BLOCKS` (`:142`), and `ufo_magnet_blocks` pulls an empty hopper on BDS.
- *"BDS gives a hopper no inventory, so `isEmpty` is false and every hopper stays (in effect (a))."* Killed by the same scenario: the empty hopper's cell is air and exactly one hopper item appears.
- *"Pulling an empty hopper can still set a legendary loose" (the AC-13 risk in `xcx18:33`).*
  - A hopper holding only a legendary is not empty, so it is a container (`ufo_magnet_legendaries:689`, `ufo-select.test.mjs:479`).
  - The emptiness check (`magnet-select.ts:237`) and `setType(AIR)` (`:384`) run inside one synchronous `magnetOn` call (`:402–469`, with no `await` or `system.run`). No hopper tick can fill the hopper in between.
- *"Production classifies differently from the tests."* `src/ufo/magnet.ts:149` calls the same `magnetOn`, the function the scenarios call.

## Fix design

**RADIUS.**
- **Code: no change.** Reverting `iron.ts:141` to (a) would undo a recorded decision and the spec. It would fix zero cases.
- **An adjacent KV contract the code does not implement.** `lgnd-ad13:36` and `lgnd-r016:28` require `protectLegendariesIn` before a `HOLDER_TYPES` block becomes air. `grep -rn protectLegendariesIn src/ufo` finds 0 hits.
  - **CASES: 0.** The only holder block the magnet can turn into air is an empty hopper, so the call would protect nothing. Do not write it; reword the KV instead (rows 15–16 below).
  - **BYPASS:** not applicable.
- **A lapsed duty.** `magn-adhp:30` and `adr-ufnd:45–47` require C-16 deviation notes in `src/ufo/README` and the release notes. Neither exists: `ls src/ufo` shows no README, and `releases/` holds only `.mcaddon` files. Since `2441fb5`, both items are written into the spec and are no longer deviations, so the duty falls away with the cleanup.

## Duplicates: same address (`L0-magn-adhp` / `L0-xcx18` / "the hopper is never a pulled block")

- **Where they were found:**
  - `grep -rn -i -E "xcx18|magn-adhp|container only|never … block"` over the project root `.ai/context/analysis/`;
  - `grep -rln 'CX-L0-18\|xcx18'`, which lists 4 files: xcx18, adr-ufnd, magn, magn-adhp.
- **No other source repeats it.** The repo docs and `src/*/README.md` have no hopper rule (`grep -rn -i hopper README.md src/*/README.md`).
- **xcx18 duplicates `L0-lgnd-cx13` by address.** It is the same hopper block-versus-container conflict, raised from the `magn` side. Its resolution should point at the decision that closed `lgnd-cx13`.

Paths are relative to `.ai/context/analysis/`. Nothing was edited.

| # | file:line | now | replace with |
|---|---|---|---|
| 1 | `nodes/xcx18__concept-contradiction.md:42` | "Resolved at reduce v4 by `L0-magn-adhp` (option a), confirmed in `L0-adr-ufnd`." | "Resolved by the spec (§5 Containers, last bullet; AC-10; `2441fb5`) and `decision-resolve-l0-lgnd-cx13`: a hopper holding anything is a container and stays; an empty hopper is pulled as a block (option c for empty, a otherwise). As built: `src/ufo/iron.ts:141`." |
| 2 | `nodes/xcx18__concept-contradiction.md:40` | "**Autopilot default: (a).** …" | "**Autopilot default at v4: (a)**, superseded by the spec's hopper rule (see below)." |
| 3 | `nodes/magn-adhp__concept-architecture-decision.md:6`, `:16` | title "The hopper is a container only, never a pulled block" | "A hopper with anything in it is a container; an empty hopper is a pulled block" |
| 4 | `nodes/magn-adhp__concept-architecture-decision.md:25–27` | "option (a) … in CONTAINER_BLOCKS only … removed from IRON_BLOCKS and is never a class 4 candidate" | "Spec §5 / `decision-resolve-l0-lgnd-cx13`. The hopper is in both CONTAINER_BLOCKS and IRON_BLOCKS; `blockRole` picks by contents at magnet-on (`iron.ts:140–141`): any contents → class 2 source, empty → class 4." |
| 5 | `nodes/magn-adhp__concept-architecture-decision.md:30`, `:34`, `:36` | C-16 deviation note; "(c) … rejected"; "the hopper is excluded from the block-class tests" | delete `:30`; delete `:34` from Rejected; `:36` → "AC-10 covers the empty hopper as a block (`ufo_magnet_blocks`), AC-9 the non-empty one as a container (`ufo_magnet_containers`)." |
| 6 | `nodes/adr-ufnd__concept-architecture-decision.md:31` | "a hopper is a container only and **never** a pulled block" | "a hopper holding anything is a container; an empty one is a pulled block" |
| 7 | `nodes/adr-ufnd__concept-architecture-decision.md:37–38` | "**The hopper is never a pulled block.** … full and empty hoppers alike stay put" / "the magnet turns no `HOLDER_TYPES` block into air" | "**A hopper holding anything is never a pulled block; an empty one is** (spec §5; `lgnd-cx13` option b)" / "the magnet turns no `HOLDER_TYPES` block *with contents* into air" |
| 8 | `nodes/adr-ufnd__concept-architecture-decision.md:45–47`, `:51` | deviation notes "the hopper is a container, not a pulled block"; "If either is overturned, `lgnd-r016` §4 becomes live again" | delete §3 (both readings are spec since `2441fb5`); `:51` → "Both readings are in the spec (`2441fb5`)." |
| 9 | `nodes/magn-eirn__concept-entity.md:37` | "**The hopper is deliberately absent** (`L0-magn-adhp`)." | "- hopper, only when empty; one with anything in it is a container (`L0-magn-adhp`)." |
| 10 | `nodes/magn-gcls__concept-glossary-term.md:26` | "from IRON_BLOCKS (the hopper excluded)" | "from IRON_BLOCKS (an empty hopper included; one holding anything is a container)" |
| 11 | `nodes/magn-rblk__concept-rule.md:25` | "**The hopper** is never selected as a block (`L0-magn-adhp`)." | "**The hopper** is selected as a block only when empty (`L0-magn-adhp`); with anything in it, it is a container (`L0-magn-rcnt`)." |
| 12 | `nodes/magn-rcnt__concept-rule.md:19` | "**hopper** (`L0-magn-adhp`);" | "**hopper** holding anything; an empty one is a built block (`L0-magn-adhp`);" |
| 13 | `nodes/magn-rleg__concept-rule.md:32` | "dormant, because the hopper is never a pulled block (`L0-adr-ufnd`)" | "dormant, because the only holder block the magnet turns into air is an empty hopper (`L0-magn-adhp`)" |
| 14 | `nodes/lgnd-cx13__concept-contradiction.md:25`, `:49` | `resolved_by: ["L0-adr-ufnd", "L0-magn-adhp"]`; "never a pulled block, full or empty" | `resolved_by: ["decision-resolve-l0-lgnd-cx13"]`; "Resolved by `decision-resolve-l0-lgnd-cx13` (spec `2441fb5`): option (b). A hopper holding anything is never a pulled block, and an empty one is. AC 10 holds literally and r016 §4 is dormant." |
| 15 | `nodes/lgnd-r016__concept-rule.md:28` | "`L0-magn-adhp` takes the hopper out of the pulled-block list, so the magnet turns no `HOLDER_TYPES` block into air" | "the magnet pulls a hopper only when it is empty (`L0-magn-adhp`), so it turns no `HOLDER_TYPES` block with contents into air" |
| 16 | `nodes/lgnd-ad13__concept-architecture-decision.md:36` | "Before `magn` turns a block in `HOLDER_TYPES` into air (in practice the hopper), it calls `protectLegendariesIn` …" | "`magn` turns a `HOLDER_TYPES` block into air only when it is an empty hopper, checked in the same synchronous call (`iron.ts:141`, `magnet-select.ts:237`, `:384`); there is nothing to protect, so it makes no `protectLegendariesIn` call. A holder block added to the pulled list later needs that call first (r016 §4)." |
| 17 | `nodes/lgnd-ac21__concept-acceptance-criterion.md:35` | "A hopper is a container only and never a pulled block (`L0-magn-adhp`, `L0-adr-ufnd`)" | "A hopper holding anything is a container and never a pulled block (`decision-resolve-l0-lgnd-cx13`)" |
| 18 | `nodes/lgnd-ac21__concept-acceptance-criterion.md:40` | "once the hopper is never a block" | "once a hopper holding anything is never a block" |
| 19 | `scope.md:656`, `:661`; `project-knowledge/glossary.md:723`, `:728` | mirror rows 17–18 | do not hand-edit; regenerated from `lgnd-ac21` |
| 20 | `project-knowledge/business-rules.md:643` | mirrors row 15 | do not hand-edit; regenerated from `lgnd-r016` |

**These stay as they are.** All are still true under the new rule:
- `magn-a09:17`, `:28`: the AC-9 hopper holds dirt, so it stays.
- `magn__concept-component.md:49`: "`-adhp` (settles `L0-xcx18`)".
- `xcx18:36–38`: the options as listed.
- `lgnd-ad13:25`: "blocks, including the `hopper` block".

## Proof

**GREEN.** The node hopper tests pass 2 of 2 (`.ai/verify/CNTR-X18-AA/2.json`).

**LIVE.** The BDS 1.26.51.1 runs listed under REPRO were made against the `src/ufo` code that is in HEAD today. No fix was written, so there is no before/after pair.

Nothing was filed on the board and nothing was written to the KV.
