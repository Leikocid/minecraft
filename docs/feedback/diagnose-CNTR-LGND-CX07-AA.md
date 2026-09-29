ИСХОД: 3 — Подчистка знания

# Diagnose CNTR-LGND-CX07-AA · CX-lgnd-07 (`L0-lgnd-cx07`)

The code ignores the 0.3.x cooldown key, and that behaviour was accepted by
`L0-adr-wpn2` (row `lgnd-cx07`, "(a) Accept"), which is already in the KV. The
harm cannot happen on any world that exists today. What remains is KV text that
still says the Web Sword keeps `andrew:ws_cooldown_until`: 7 lines across 5 nodes,
plus the `cx07` node itself, which is still `status: open`.

## 1. The claim, re-measured

| Claim in `cx07` | Command | Measured |
|---|---|---|
| 0.3.0 wrote `DP_COOLDOWN_UNTIL = "andrew:ws_cooldown_until"` | `git show 37a0403:src/websword/state.ts \| grep -n COOLDOWN_UNTIL` | line 30, true. Same in 0.3.2: `git show 2d57c52:…` line 30 |
| cited as `392253d^` | `git rev-parse --short 392253d^` | `2d57c52`, which is the **0.3.2** tree (manifest `[0,3,2]`), not 0.3.0 (`37a0403`). Same key |
| the framework uses `andrew:cd_web_sword` | `src/legendary/registry.ts:106-108`, `cooldown.ts:30-32` | true; pinned by `tests/legendary-registry.test.mjs:142` |
| nothing reads the old key | `grep -rn ws_cooldown_until src tests scripts packs` | 0 matches (exit 1) |
| worst case one cooldown ≤ 30 s | `COOLDOWN_TICKS` at 37a0403 / 2d57c52 `rules.ts:10` | 600 ticks = 30 000 ms, epoch-ms deadline (`Date.now()`) |
| other keys unchanged via `keysFor` | 0.3.0 `state.ts:17-27` vs `registry.ts:92-103`, test `:122-128` | 7/7 keys are byte-identical (`ws_origin, ws_owner, ws_id, ws_owner_name, ws_crafted, ws_crafted_by, ws_pending`) |
| the dead key stays forever | `grep -rn clearDynamicProperties src` | 0 matches; nothing deletes it |
| `ac01` asserts "HUD shows … cooling with ≤ 20 s" | `doc_get lgnd-ac01` (live KV) | **false now.** Live `ac01` says "The cooldown clause was dropped by the `wpn2` ruling on `cx07`". The git copy at `32f4aca` (`…/lgnd-ac01…md:24,30`) still has the old text |
| option (b) names `remainingMs` | `grep -n "export function" src/legendary/cooldown.ts` | exists, `cooldown.ts:30` |

**Build history.** The legacy key was written by 0.3.0 (`37a0403`, 09-22 05:04),
0.3.1 and 0.3.2 (`2d57c52`, 09-24 20:57). The first release that reads only
`cd_web_sword` is 0.4.0 (`dcb0bb4`, 09-24 23:58).

## 2. /diagnose blocks

```text
OBSERVED: This is a code measurement, not a field report; no player has reported a lost cooldown.
          0.3.0–0.3.2 store andrew:ws_cooldown_until (epoch ms). 0.4.0+ reads only
          andrew:cd_web_sword (registry.ts:106, cooldown.ts:30). No legacy read exists.
VERDICT:  decision-change, already made. KV ent3:27 / r006:31 promise "a cooling sword stays
          cooling". That expectation was withdrawn by L0-adr-wpn2 (accepted, v2, cx07 row "(a)
          Accept"), and live ac01 no longer has the clause. Reachability was investigated anyway.

REPRO:    node --test docs/feedback/diagnose-CNTR-LGND-CX07-AA.repro.mjs. A stub player saved by
          0.3.x (ws_cooldown_until = now+20 s) holds the sword: isReady=true, remainingTicks=0, HUD =
          andrew.legendary.ready. Deterministic.
          Positive control: the same deadline under cd_web_sword gives remainingTicks=400.
CAUSE:    392253d swapped the per-sword DP_COOLDOWN_UNTIL for cooldownKey(abilityKey) =
          `andrew:cd_${abilityKey}` (registry.ts:106) with no legacy read.
PROOF:    ai-kit run-check --expect-red on the repro (artifact path in the task_submit result).
          TAP: not ok 1 (the 0.3.x deadline is ignored), ok 2 (positive control).
RULED OUT:(1) A hidden legacy read: the stub goes through the real remainingMs/isReady/HUD and
          reads Ready, so none exists.
          (2) Live worlds carry 0.3.x saves: every BDS world was born after 0.4.0 (stat -f %SB:
          bds/andrew 09-26 18:09, bds/gametest 09-26 17:58, bds-qa/andrew 09-27 19:30,
          bds-ci/andrew 09-27 00:44, bds-ci/gametest 09-29 19:15). Until b372e74 (09-26 22:19),
          scripts/bds-lib.mjs:155 rmSync'd worlds/andrew on every bds:up and bds:check (37a0403,
          dcb0bb4 and b372e74^ all have the line).
          A plain grep of LevelDB for the key strings was discarded: its positive control
          (cd_web_sword) also returned 0 because LevelDB blocks are compressed.

RADIUS:   Fix (b) would be a legacy read inside remainingMs. Callers (grep remainingMs|remainingTicks|
          isReady( over src/): hud.ts:43, hands.ts:36 (resolveActivation, which gates every Use of
          every weapon), and gametest main.ts:84-85, 1516.
          It is not a restriction; it adds a read. CASES = 0 observable: no BDS world holds a 0.3.x
          save (wiped on every deploy until b372e74). The only beneficiary would be a world still on
          0.3.x today (iPad-local, not observable), upgraded < 30 s after a cast, saving ≤ 30 s once.
          That is exactly the loss wpn2 accepted. Not written.

GREEN:    n/a. No code change: the accepted behaviour stays, and the repro stays red by the wpn2
          ruling.
LIVE:     n/a. There is no world with a 0.3.x player save on any of the three BDS instances.
          iPad-local worlds cannot be observed from the Mac. DEMO-S2 records that no iPad run
          happened on 0.3.x, and the iPad plays on the LAN server.
```

## 3. Resolution text for `refine resolve L0-lgnd-cx07`

> Resolved by `L0-adr-wpn2` (accepted), option (a). Re-measured 2026-09-29:
> - 0.3.0–0.3.2 (`37a0403`…`2d57c52`) wrote `andrew:ws_cooldown_until` as epoch ms.
> - From 0.4.0 (`dcb0bb4`, 2026-09-24 23:58), `cooldownKey` reads only
>   `andrew:cd_<abilityKey>` (`registry.ts:106`); `grep ws_cooldown_until src tests scripts packs`
>   finds 0 matches.
> - A 0.3.x player cooling with 20 s left reads Ready after the upgrade (repro, red,
>   positive control green).
> - Loss is bounded by `COOLDOWN_TICKS` = 600 → one cooldown ≤ 30 000 ms, once per player.
> - The 7 other `ws_*` keys are byte-identical (`keysFor`, test `:122-128`).
> - No BDS world can hit it. Every world on the three instances was created on or after
>   2026-09-26 17:58, after 0.4.0. Until `b372e74` (2026-09-26 22:19), `bds:up` and `bds:check`
>   deleted the world on every run (`bds-lib.mjs:155`), so no 0.3.x player save survived.
>   Only an unobserved world still on 0.3.x today (e.g. iPad-local) could lose ≤ 30 s, once, and
>   only if it is upgraded within 30 s of a cast.
> - No code change: the legacy fallback (b) catches 0 observable cases.
> - `ac01` already carries the ruling. The nodes listed in §4 are to be brought in line.

## 4. Copies to fix (live KV, `.ai/context/analysis/`)

Primary nodes:

- `nodes/lgnd-ent3__concept-entity.md:24` — "Player dynamic property `andrew:<prefix>_cooldown_until` holds the epoch ms…" → "Player dynamic property `andrew:cd_<abilityKey>` holds the epoch ms… (`registry.ts` `cooldownKey`)".
- `nodes/lgnd-ent3__concept-entity.md:27` — "The Web Sword keeps `andrew:ws_cooldown_until`, so a sword cooling at upgrade time stays cooling." → "The 0.3.x key `andrew:ws_cooldown_until` is not read. A sword cooling at the 0.3.x→0.4.0 upgrade reads ready (≤ 30 s lost once, accepted by `L0-adr-wpn2`, `cx07`)."
- `nodes/lgnd-ad05__concept-architecture-decision.md:26` — "`andrew:<p>_cooldown_until`" → "`andrew:cd_<abilityKey>` (as built, `ad07` §3)".
- `nodes/lgnd-ad01__concept-architecture-decision.md:25` — "the derived names are byte-identical to the shipped ones" → "the derived item/world/pending names are byte-identical to the shipped ones. The cooldown key is not (`andrew:cd_web_sword` replaced `andrew:ws_cooldown_until`, `cx07`/`wpn2`)".
- `nodes/lgnd-r006__concept-rule.md:24` — remove "`ws_cooldown_until`" from the list of names derived from the `ws` prefix (7 names, not 8).
- `nodes/lgnd-r006__concept-rule.md:29` — "a small tick-era `ws_cooldown_until` → expired." → delete. No code reads that key at all, and 0.3.0 already wrote epoch ms.
- `nodes/lgnd-r006__concept-rule.md:31` — "…and a sword cooling at shutdown is still cooling." → "…A sword cooling at the upgrade reads ready (`wpn2` on `cx07`)." The same node's "never deletes or renames a key the shipped version wrote" needs the exception "except the cooldown key (`cx07`)".
- `nodes/xasm1__concept-assumption.md:30` — "`L0-lgnd-r006` already reads legacy tick-era `ws_cooldown_until` values as expired." → "Legacy `ws_cooldown_until` values are not read at all (`cx07`)."
- `nodes/lgnd-cx07__concept-contradiction.md` — frontmatter `status: open` / tag `status:open` → resolved by `L0-adr-wpn2`. Line 25's "`ac01` asserts '…≤ 20 s'" is no longer true of live `ac01`.

Roll-ups: these are generated ("Автогенерация") and regenerate from the nodes above. Do not hand-edit them:

- `project-knowledge/domain-model.md:107,110` (copy of ent3:24,27)
- `project-knowledge/business-rules.md:171,176,178` (copy of r006:24,29,31)
- `contradictions.md:155,158,166` and `risks.md:160,163,171` (copy of cx07)

Already correct, no change: `lgnd-ent1:41` (Player keys `andrew:cd_<abilityKey>`),
`lgnd-ad07:32`, `lgnd-ac01` (live), `adr-wpn2:25`.

Git copy lag, not KV: the committed `.ai/context/analysis/nodes/lgnd-ac01…md:24,30`
and `lgnd-ent1…md:42` at `32f4aca` still carry the pre-ruling text. The live KV is
already fixed, and the next analysis commit carries it.

Adjacent, same nodes, already superseded by `ad07` §2 (busy is a durable
`andrew:busy_<key>` deadline, `cooldown.ts:61-71`). Worth fixing in the same
edit, so the node is not half-fixed:

- `lgnd-ent3:29-33` ("In-memory `Set`…", "After a restart the set is empty") and `:38-40` (the `isReady` row includes `!isBusy`, but code `cooldown.ts:39-41` does not; `setBusy(p,k,on)`, but the code takes `durationMs`)
- `lgnd-ad05:27` ("Busy: an in-memory `Set`…")

## 5. Nothing created

No `task_create`, no `refine resolve`, no KV/doc writes. Outcome 3 produces no code
task: option (b) has zero effect on every world that exists (§2 RADIUS).
