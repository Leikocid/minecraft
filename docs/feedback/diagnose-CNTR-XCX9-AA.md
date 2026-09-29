ИСХОД: 2 — Работа над кодом

# CNTR-XCX9-AA · CX-L0-09 — vanilla `/give` in Survival claims the world's craft

The defect is live for both shipped weapons, the Web Sword and the Scythe. It was reproduced on BDS 1.26.51.1 in two runs, 5 of 5 cases red in each. One part of the claim is false: the Orbital Cannon has no code, so it is "two weapons now, the third inherits on registration", not "all three". The fix design already exists in the KV (AD-lgnd-08, status `proposed`), and no task on the board implements it.

## Intake

**OBSERVED.** Three specs forbid the claim: Web Sword §3 («Creative и /give … НЕ расходуют право»), Scythe §1 and Orbital §4. So does decision `legendary-rules` (2026-09-24: «освобождение креатива и /give»). The code claims any unmarked stack that reaches a Survival or Adventure inventory:
- `src/legendary/craftgate.ts:40` filters events.
- `craftgate.ts:114` scans the inventory.
- `rules.ts:41` `craftDecision` exempts only Creative, Spectator and marked stacks (`:42–47`).

Decision Q-008 (2026-09-21) recorded this gap as a "known limitation" («/give в survival неотличим от крафта»). No later decision or code removed it.

**VERDICT.** Bug: the as-built behaviour diverges from three specs and a later decision.

## Investigation

**Numbers from the claim, re-checked**

| Claim | Measured | Command |
|---|---|---|
| `rules.ts:41` is `craftDecision` | true | `cat -n src/legendary/rules.ts` → line 41 `export function craftDecision` |
| exempt only Creative/Spectator/marked | true | rules.ts:42–47 |
| "for all three weapons" | **false**: 2 weapons | `LEGENDARIES = [WEB_SWORD, SCYTHE_OF_CALAMITY]` (registry.ts:56). `grep -rli orbital src packs tests scripts` → 0 files. Recipes: miners_pickaxe, scythe_of_calamity, web_sword |
| "2.10.0 has no craft event" | true | `@minecraft/server` 2.10.0 index.d.ts has 3 "craft" words, all in doc comments of other members. `WorldBeforeEvents` has 14 signals, `SystemBeforeEvents` has 2 (startup, shutdown). No craft, command or chatSend hook |
| "only `/andrew:<weapon> give` marks a copy" | true | `commands.ts:100–110` `giveAdminCopy` → origin `admin`. Two commands: `/andrew:websword`, `/andrew:scythe` |
| "a later real craft gets refunded" | true | measured, see REPRO `give_then_craft` |
| candidate fix (b) "a `beforeEvents` command hook" | **does not exist** in 2.10.0 | same index.d.ts listing |

**REPRO.** `src/gametest/probe-give.ts`, driven by `docs/feedback/diagnose-CNTR-XCX9-AA.repro.sh` on a private BDS instance (`ANDREW_BDS_DIR=bds-xcx9`), code_sha 78f243e.
- Runs: 2026-09-29 20:12Z (`.ai/verify/CNTR-XCX9-AA/2.json`) and 20:13Z (`2.red.json`, `--expect-red`).
- The two runs agree line for line:

```
give_websword        mode=Survival give_success=1 flag=true held=1 marks=craft refund=0
give_scythe          mode=Survival give_success=1 flag=true held=1 marks=craft refund=0
give_then_craft      tester[flag=true held=1 marks=craft] crafter[flag=true held=0 refund=web x4,diamond_sword x1]
give_after_craft     give_success=1 flag=true held=0 marks=- refund=web x4,diamond_sword x1
creative_copy_pickup flag=true held=1 marks=craft refund=0
```

- Each `/give` also broadcast `"<name> forged the legendary …"`. The log shows `[andrew] andrew:web_sword first craft by xcx9_give_websword`, and the same for the Scythe.

**CAUSE.** The engine fires `playerInventoryItemChange` for a vanilla `/give` just as for a craft. The gate has no other signal: 2.10.0 has no craft event. It therefore treats every unmarked `def.itemId` as a craft. Stacks from `/give`, Creative copies, pickups and script `addItem` all carry no mark (Q-006), so each one claims the flag. After the flag is set, each such stack is refunded.

**PROOF.** Two BDS runs with the production gate module (`registerCraftGate` from `src/legendary/craftgate.ts`) turned 5 of 5 non-craft deliveries into a claim or a refund.

There is also a harm the claim does not name (`give_after_craft`). Once the real craft exists, every vanilla `/give` of a legendary to a Survival player is confiscated and swapped for the ingredients: 4 cobweb + a diamond sword, or 2 golden apples + 2 obsidian + a diamond hoe. `/give` needs op, so this is not a player-facing exploit.

**RULED OUT**
- *"`/give` does not raise the inventory event, so only crafts reach the gate."* Killed: `give_success=1`, then the claim within ≤40 ticks.
- *"It is a SimulatedPlayer artefact."* The GameTest pack arms the same production module. The release pack's only difference is the player binding, and for a real `Player` it is defined (craftgate.ts:52–57). A human client was not run: **not measured**.
- *"Testers use Creative, so the exemption covers it."* That holds only when the receiver is in Creative. The spec exempts `/give` copies as such, and all probes ran with `mode=Survival`.
- *"The production world is already affected."* `docker logs andrew-bds` since container start (2026-09-27T17:53Z) has 0 lines of `first craft by|craft blocked for`. Nothing is recorded there. Anything older than the container start is **not measured**.
- *Other sources:* no loot table ships a legendary (`grep` over packs, src/structures).

## Fix design

**RADIUS.** Everything that reads "an unmarked `itemId` in a Survival inventory = a craft". Found by grep for `getMark|findMarked|isItemOf|fakeCraft|craftDecision`:
- `craftgate.ts:40, :114` — the only consumer of the rule.
- GameTests that fake a craft through `addItem` of an unmarked sword: `fakeCraft`, 4 calls in `websword_first_claim`, `websword_second_refund` and `websword_creative_ignored`. They would have to insert the token instead. That is harness wiring, not an assertion.
- `giveMarkedScythe` (main.ts:1118–1135) is a harness workaround for this same gate. It becomes unnecessary but stays harmless.
- `retention.ts` and `recovery.ts` act only on marked stacks, so they are unchanged. `/give` copies stay unmarked and are not retained, which matches Q-006 and Q-016.
- Abilities (`websword/trap.ts`, `scythe/*`, `legendary/hands.ts`) never read a mark, so `/give` copies keep their ability.
- `tests/web-sword-rules.test.mjs` (`craftDecision`) is unchanged: the function stays, only its input set narrows to tokens.

**CASES.** The fix takes away the claim by a non-craft stack. It catches 0 legitimate cases: every real craft still claims, through the token. The 3 GameTests above use the removed path as a craft stand-in and move to the token.

**BYPASS.** `/andrew:<weapon> give` does not satisfy the spec: it covers neither vanilla `/give` nor Creative copies. The other two routes are closed:
- A command hook does not exist in 2.10.0.
- The `beforeItemStack` heuristic cannot tell `/give` from a craft: both fill an empty slot. That comes from AD-lgnd-08's reasoning and was **not measured** here.

## Proof

**GREEN.** Not applicable: this run delivers no fix. The red check is committed, and it goes green when all 5 `PASS` lines print.

**LIVE.** Not measured on a human client or the iPad.

## Setup for the fix (lgnd v3 delta, AD-lgnd-08)

**Observation and mechanism:** see above. Reachability is proven by `.ai/verify/CNTR-XCX9-AA/2.red.json`.

**Work**
- Each shipped weapon's recipe outputs a hidden token, `andrew:<item>_crafted`. The token has `menu_category: none`, the weapon's icon, `max_stack_size 1`, and a lang name in en_US and ru_RU (C-8).
- The gate watches tokens only:
  - `claim`: swap the token in place for a marked weapon.
  - `refund`: swap it for the ingredients.
  - Creative or Spectator: swap it for an unmarked weapon.
- A plain `def.itemId` is never gated.

**Acceptance criteria**
1. [e2e] `diagnose-CNTR-XCX9-AA.repro.sh` passes 5 of 5 on BDS. The `give_then_craft` stand-in inserts the token.
2. [e2e] `websword_first_claim`, `websword_second_refund` and `websword_creative_ignored` are green with the token as the craft stand-in, and their assertions are unchanged. Add one Scythe claim test.
3. [build] `npm run build` + `validate` pass. Both token items exist with en_US and ru_RU names, and each weapon recipe's `result` is its token.
4. [e2e] Probe ASM-lgnd-13 on BDS: `playerInventoryItemChange` fires for a token delivered by a real recipe craft. If a SimulatedPlayer cannot craft, the criterion is `manual` on the iPad.
5. [manual, ipad] The crafting-table preview shows the weapon's icon and name, and the token never stays visible after the next tick (AC-lgnd-15).

## Resolution text (for `refine resolve L0-xcx9`)

> Confirmed as a defect by measurement, BDS 1.26.51.1, 2026-09-29, two runs, `.ai/verify/CNTR-XCX9-AA/2.red.json`, code 78f243e.
> - A vanilla `/give` of `andrew:web_sword` or `andrew:scythe_of_calamity` to a Survival player sets the craft flag, marks the copy `origin: craft` and broadcasts the first-craft message.
> - A later real craft is refunded (4 web + 1 diamond sword).
> - A `/give` after the craft is confiscated and swapped for the ingredients.
> - An unmarked copy picked up from the ground claims too.
>
> Scope: two weapons, not three. `LEGENDARIES` holds 2 defs (registry.ts:56), and the Orbital Cannon has no code (0 files). It inherits the defect when it is registered with `craftGate: true`. A command before-hook does not exist in 2.10.0, so the claim's candidate (b) is void.
>
> Fix: AD-lgnd-08 (craft token), implemented in the lgnd delta. Q-008's clause «/give в survival неотличим от крафта» is superseded by decision legendary-rules (2026-09-24) and Web Sword §3 / Scythe §1 / Orbital §4.

## Duplicates (root `.ai/context/analysis/`, not edited)

- `nodes/xcx9__concept-contradiction.md:23` — "AC-2 fails as built, for all three weapons." → "AC-2 fails as built for the Web Sword and the Scythe (measured). The Orbital Cannon has no code yet and inherits the gate on registration."
- `nodes/xcx9__concept-contradiction.md:29` — candidate "restrict `/give` … through a `beforeEvents` command hook" → delete. 2.10.0 has no such hook. AD-lgnd-08 (b) already rejects it.
- `nodes/xcx9__concept-contradiction.md:28` — the `beforeItemStack` heuristic → "rejected by AD-lgnd-08 (a); the chosen fix is the craft token (AD-lgnd-08)".
- `risks.md:478`, `contradictions.md:462` — the same "for all three weapons" sentence. These are rollups of the node and regenerate from it.
- `nodes/lgnd-ad08__concept-architecture-decision.md:23` — "This affects all three weapons." → "This affects both shipped weapons (measured, CNTR-XCX9-AA), and the Cannon once registered." Line 43, "The recipe JSON of all three weapons changes", is a target state and stays.
- `decisions.md:134` and `decisions/decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut.md:10,16` — the clause «/give в survival неотличим от крафта (для тестов — креатив или /andrew:websword give)» → mark it superseded by `decision-legendary-rules-…` (2026-09-24) and AD-lgnd-08.
- Target-state lines that are correct once AD-lgnd-08 lands, but false as built today. Tag them `v3-delta`/`proposed`, or leave them unchanged:
  - `nodes/lgnd__concept-component.md:40`, `project-knowledge/architecture.md:45`, `project-knowledge/domain-model.md:436` — "Plain `andrew:<weapon>` stacks … never claim or refund".
  - `nodes/lgnd-gl09__concept-glossary-term.md:20` and `project-knowledge/glossary.md:591`.
  - `nodes/lgnd-r014__concept-rule.md:24` and `project-knowledge/business-rules.md:360`.
  - `nodes/concept-constraint.md:29` and `project-knowledge/business-rules.md:30` (C-18).
  - `nodes/scyt-ac11__concept-acceptance-criterion.md:27` — "`/give` and Creative copies never set the flag". This is the Scythe AC and it fails as built (`give_scythe`).
