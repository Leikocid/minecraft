ИСХОД: 3 — Подчистка знания

# CNTR-X25-AA · CX-L0-25 · Два оружия режут рельеф

Checked on `ed05050`. The code lines are from this worktree; the KV lines are from the root `.ai/context` (live, read-only) and `kv_search`/`doc_get`. No task was filed and nothing was written to the KV.

**Verdict.** The resolution xcx25 points to (`L0-sclk-r010`: one list in `src/terrain/keep.ts`, the Cannon unchanged) can be done as written. The code is ready: one file, three importers, the set-equality node test already exists. There is nothing to move today, because the crossbow has no code on any branch, so a separate move card would duplicate the sclk plan. But v7 knowledge carries the very split xcx25 warns about. `L0-xasm25` tells the crossbow planner that the "shared xasm6 list" keeps reinforced deepslate and portals. The xasm6 list, `pntr-r003`, the code and four tests say the opposite. On top of that, the gate in `sclk-ac22`/xcx25 names the ring, which the move cannot reach. That makes this a knowledge cleanup.

## 1 · The list and its consumers (code)

| What | file:line |
|---|---|
| `PENETRATOR_KEEP`, 35 ids: bedrock, end_portal_frame, end_portal, end_gateway, barrier, light_block + light_block_0…15, command_block ×3, structure_block, structure_void, jigsaw, allow, deny, border_block, invisible_bedrock, moving_block, piston_arm_collision, sticky_piston_arm_collision | `src/orbital/penetrator-keep.ts:9-34` |
| Deliberately **not** on it: obsidian, reinforced deepslate, ancient debris (hard, but Survival-breakable) | `penetrator-keep.ts:4-5` |
| Consumer 1: the cell classifier `classify` → `"keep"` | `src/orbital/penetrator-plan.ts:8`, `:137` |
| Consumer 2: `KEEPERS = [...PENETRATOR_KEEP, ...liquids]` → the band-fill filter and `knownKeeperIds` | `src/orbital/penetrator.ts:22`, `:64`, `:73`, `:382` |
| Consumer 3 (probe): ids the engine does not know, light-block readback | `src/gametest/penetrator.ts:32`, `:173-181` |
| Node bundle that names the file **by name** (a move without a re-export breaks it) | `tests/penetrator-plan.test.mjs:32` |
| Static test: README "## LMB penetrator" must have a "keep list" line with `L0-xasm6` | `tests/penetrator.test.mjs` (AC#10), `src/orbital/README.md:18`, `:80` |
| **Not** a consumer: the ring (0 references; it goes through `createExplosion`, by blast resistance) | `src/orbital/ring.ts:495`; `pntr-r003`: "the two effects must not share a block classifier" |
| `protectLegendariesIn` is already a single implementation in lgnd | `src/legendary/recovery.ts:679`; callers `penetrator.ts:314`, `ring.ts:477` |
| C-12 (unloaded chunk) has no shared code: each component handles it locally | `penetrator.ts:257`, `:451`, `:469`; `katana/plan.ts:160`; `websword/cube.ts` (catch in `classify`) |
| Neutral module `src/terrain/` | does not exist; `git log --all -- src/terrain 'src/crossbow*' 'src/sculk*'` is empty |

**A third list already exists — the Web Sword's** (`src/websword/cube.ts:28-54`, Q-013, "if in doubt, skip"). It disagrees with `PENETRATOR_KEEP`:
- it has `portal` and `reinforced_deepslate` (`:40`, `:44`), which the Cannon removes;
- it lacks `light_block_1…14`, `invisible_bedrock` and `piston_arm_collision`.

The meaning differs (cobweb over a cell, not air; containers skipped), and it is fixed by a decision, so the split between Web Sword and Cannon is deliberate. It is not a C-7 violation.

## 2 · Gate for the move, by name

The keep list on the engine is exercised by these scenarios (`src/gametest/penetrator.ts`):

| Scenario | line | What it holds |
|---|---|---|
| `pntr_column_overworld` | `:196` | placed bedrock at y=20 and floor bedrock stay; the stone under them is removed; `kept ≥ 10` |
| `pntr_nether_end_waterlogged` | `:288` | Nether floor bedrock; in the End, `end_portal_frame`, `barrier` and `light_block_7` stay, and the cells under them become air |
| `pntr_hard_blocks_no_drops` | `:386` | the reverse side: obsidian, crying obsidian, the Nether portal and its frame, reinforced deepslate, a spawner and containers are **removed** (the list has not grown) |
| `probe_pntr_holders` | `:145` | probe, not an assertion: which list ids the engine does not know; how `light_block` reads back |

Node gate: `tests/penetrator-plan.test.mjs:150` (set equality, i.e. the "set-equality test against the pre-move list" in ac22 already exists), `:176`; `tests/penetrator.test.mjs:324`, `:341`, `:719`, `:755`. Plus `tsc` and `npm run build`. The ring scenarios are outside the radius.

**Baseline measured on HEAD** (`.ai/verify/CNTR-X25-AA/3.json`, exit 0; private BDS `andrew-bds-x25`, 1.26.51.1): node 47/47, then 4/4 GameTests passed.
- `ac1 RESULT … kept 32 … errors 0; bedrock at y=20 minecraft:bedrock, y=19 minecraft:air, bottom minecraft:bedrock; wrong cells 0`
- `ac2 RESULT End …: frame minecraft:end_portal_frame, under it minecraft:air; barrier minecraft:barrier, under it minecraft:air; light block minecraft:light_block_7, under it minecraft:air`
- `ac3 RESULT … planned fixtures still standing 0 …; new item/xp entities … 0`, i.e. reinforced deepslate, the portal and the spawner were removed
- `keep RESULT PENETRATOR_KEEP ids unknown to the engine: []`; `light_block_7 placed reads back as minecraft:light_block_7 (kept)`

So the gate is green today. A move with a re-export must keep it exactly so; the `ac3` line is the one that catches the list "growing" under the crossbow.

## 3 · What to fix in the KV (nothing written)

1. **`L0-xasm25`, bullet "Deny-list blocks".** Replace "bedrock, portals, command and structure blocks, barriers, reinforced deepslate, …; the shared list from `L0-xasm6`" with the actual composition of `TERRAIN_KEEP`: bedrock, end portal, end portal frame, end gateway, barrier, light blocks, command/structure/jigsaw, allow/deny/border, technical piston blocks. Add a line saying the crater carves obsidian, reinforced deepslate, ancient debris and the Nether portal like stone (`xasm6`, `pntr-r003`). The spec §6 is silent; xasm25 is CAN_ASSUME; `r010` already chose "the list keeps its Orbital meaning", and the operator has accepted the Cannon (ORBC-IPAD-01-AA). So no decision changes, and the operator is not needed.
2. **`L0-sclk-ac22` and the xcx25 text.** The gate is the four `pntr_*` scenarios from §2 plus the node tests; remove "ring GameTests" (0 references; `pntr-r003` forbids sharing a classifier with the ring). Add an explicit assertion that reinforced deepslate is carved, to match the shared list, so nobody turns it into a per-weapon extension.
3. **xcx25 `governs_files`.** `src/legendary/recovery.ts` is not affected by the move (`protectLegendariesIn` is already shared). The C-12 point is not shared code: the crater clips the box itself (`adr-sctr` §2.1).
4. **`r010`/xcx25: name the Web Sword list as separate.** `websword/cube.ts:28` is a deliberately different list (Q-013), outside "no per-weapon copy". Otherwise a future planner will "unify" it and change the Web Sword's behaviour.

## 4 · Side defect (code, not KV) — said in words, not fixed here

The Web Sword turns placed light blocks of levels 1…14 into cobweb, although Q-013 protects the light block: `cube.ts:42-43` has only `light_block_0` and `light_block_15`, and the engine places `light_block_<N>` (measured: `light_block_7 placed reads back as minecraft:light_block_7`). Red: `.ai/verify/CNTR-X25-AA/2.red.json` (`docs/feedback/diagnose-CNTR-X25.ws-light.mjs`): 14 of 16 ids → `place`; 0 and 15 → `skip` is the control. The fix is the 16 levels in `PROTECTED_BLOCK_IDS` plus a test; it is outside this task's scope ("work only on this task"), so it is handed to the operator in words.

## Diagnose blocks

```text
OBSERVED: xcx25 (v7) — a design-time overlap; no runtime observation; the crossbow has no code on any branch. Observed:
          v7 xasm25 says the shared list keeps reinforced deepslate and portals. xasm6, pntr-r003, penetrator-keep.ts:4-5,
          tests penetrator-plan :176, penetrator :341 and the GameTest pntr_hard_blocks_no_drops say the opposite.
VERDICT: duplication = hypothesis (nothing to duplicate yet); the knowledge-vs-code divergence = a knowledge bug, the
         expectation is recorded (r010 "the list keeps its Orbital meaning").
CHECKS: contradiction: none (Q-013 is about the Web Sword; r010/xasm6/pntr-r003 agree) · duplicate: the move is already
        in r010/ac22 (sclk) · criteria writable: yes
UNFOLD: knowledge cleanup — four edits in §3; the move stays with the sclk plan
HUMAN: none
REPRO: reading xasm25 bullet 3 against penetrator-keep.ts:4-5 and pntr_hard_blocks_no_drops :408-424, :495
CAUSE: xasm25 attributes to the "xasm6 shared list" the composition of the Web Sword list (Q-013, cube.ts:40,44)
PROOF: .ai/verify/CNTR-X25-AA/3.json — the Cannon gate is green on HEAD (node 47/47 + 4/4 GameTests), ac3: reinforced
       deepslate and the portal removed; side defect red: .ai/verify/CNTR-X25-AA/2.red.json
RULED OUT: "the ring is a list consumer" — 0 references in ring.ts / gametest/ring.ts; "C-12 is shared code" — local
           handling in penetrator.ts:257/451/469, katana/plan.ts:160, cube.ts
RADIUS: 3 TS imports + 1 node bundle by file name + README static test (grep penetrator-keep|PENETRATOR_KEEP|KEEPERS
        over src/ tests/ scripts/); KV: xasm25, xcx25, r010, ac22, adr-sctr §3
GREEN/LIVE: not applicable — this task changes neither code nor KV; the gate baseline is measured on HEAD (§2)
```
