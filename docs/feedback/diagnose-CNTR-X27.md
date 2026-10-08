ИСХОД: 3 — Подчистка знания

# CNTR-X27-AA · CX-L0-27 — the shield against the Storm Blade beam

The contradiction rests on a premise the engine does not support. On BDS 1.26.51.1, a raised shield does **not** cancel the call `strm-rdmg` prescribes «regardless of facing». `applyDamage(D, {cause: entityAttack, damagingEntity: wielder})` behaves like a vanilla shield:
- it is cancelled only when the wielder is within 90° of where the holder looks;
- from the side or from behind it lands, with armour applied natively;
- a vanilla diamond-sword hit from the same spots splits the same way.

Only a call **with no `damagingEntity`** is blocked from every side. That is exactly the call `strm-pprb` P3 writes, so the probe as specified would have "confirmed" the false premise.

So the native call already is the spec's «до учёта брони и прочих стандартных защит» read literally, which is `xq8` option 2. Nothing has to be built around the shield, no C-16 deviation is needed, and option (b) is redundant. Nothing was filed and nothing was written to the KV.

Evidence: `ai-kit run-check` artifacts, code sha cf86767, exit 0, on the private instance `dist/bds-x27` (`andrew-bds-x27`, port 19476):
- facing: `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-X27-AA/2.json`, 49 s;
- causes and option (b): `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-X27-AA/3.json`, 81 s.

Each mode also ran once before, as exploration, with identical numbers (the 70 cause rows have the same md5). The P3 repeats are 3/3 identical.
- Probe: `diagnose-CNTR-X27.probe.ts`.
- Runner: `diagnose-CNTR-X27.repro.sh facing|causes`.
- Full probe lines: `diagnose-CNTR-X27.facing.txt` and `diagnose-CNTR-X27.causes.txt`. The artifacts keep only the stdout tail.

## Intake

- **OBSERVED.** The claim carries no run of its own. The only on-project measurement is X23 P2 (`.ai/verify/CNTR-X23-AA/2.json`, sha 9088879). For a sneaking shield-holder it records:
  - `entityAttack` + `damagingEntity`: false, 20→20 from the front; **20→10 from behind**;
  - `entityAttack` with no source: blocked front and back;
  - `projectile` + a source: throws.

  The spec quotes check out:
  - stormbladeelytratotemspecruen-part-1.md:41 §02 «10 HP … ДО учёта брони и прочих стандартных защит»;
  - part-2.md:57 §06 «активный — 10 HP до брони»;
  - part-2.md:73 §07 «10 HP before armor».

  The spec never says «shield». The chronicle holds no decision on `xq8`.
- **VERDICT.** A hypothesis, already contradicted by a recorded measurement for the sourced call. Measured here; nothing fixed.

## Set-up

- Holders are Survival SimulatedPlayers on the 7×7 platform with `minecraft:shield` in the off hand (`setEquipment` → true, a fresh shield every trial) and `isSneaking = true`.
- `naturalRegeneration` is off for the probe; the difficulty is Peaceful.
- Health is reset and effects and fire are cleared before every trial. Each trial waits 12 ticks, longer than the hurt window.
- Damage is health before the call minus health in the same tick, re-read at +1 (always equal).
- Armour is diamond on all four slots, with or without Protection IV on each piece (`addEnchantment`, reads back `+prot4`).

## P1 · Does the block depend on facing? (AC#2)

The holder stands still facing +z. Only the source moves to the angle shown.
- **script** = `applyDamage(10, {entityAttack, damagingEntity: source})`.
- **sword** = `source.attackEntity(holder)` with a diamond sword (8 HP).

| source at | script, 2 blocks | script, 8 blocks | sword, 2 blocks |
|---|---|---|---|
| no shield, 0° / 180° (controls) | 10 / 10 | 10 / 10 | 8 / 8 |
| shield 0° (in front) | **0**, `false`, wear +11 | **0**, `false`, wear +11 | **0**, wear +9 |
| 30° · 60° · 75° · 85° | 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 | 60°: 0 · 85°: 0 |
| 90° | **10** | **10** | — |
| 95° · 105° · 120° · 150° | 10 · 10 · 10 · 10 | 10 · 10 · 10 · 10 | 95°: 8 · 120°: 8 |
| shield 180° (behind) | **10**, `true`, wear 0 | **10** | **8** |
| 6 up, 6 in front / 6 up, 6 behind | — | 0 / 10 | — |
| 8 straight overhead | — | 10 | — |
| **no `damagingEntity`**, holder facing +z / −z | **0 / 0** (`false`, wear +11) | | |
| no `damagingEntity`, no shield | 10 | | |

The answer: **the block depends on facing.** It is the vanilla rule: blocked below 90° off the holder's view, landing at 90° and beyond. It is the same at 2 and 8 blocks. A source 6 blocks up follows its horizontal direction (in front blocked, behind lands), and one straight overhead lands. At every angle sampled for both, it matches a diamond-sword hit from the same spot. A blocked script hit wears the shield by D + 1 (11), as the blocked sword hit does (8 + 1 = 9). `applyDamage` returns `false` exactly when the shield blocks.

## P2 · Every cause: does it pass a raised shield, does armour reduce it? (AC#3)

`applyDamage(10, {cause})` on five holders in the same tick. The source is a SimulatedPlayer about 5 blocks away:
- the shield-front holder looks at the source (measured 0.01°);
- the shield-back holder looks away (180.00°).

Numbers are HP taken. A «no source» column appears only where it differs from «with source».

| cause | bare | shield, facing source | shield, back to source | no source: shield | diamond | diamond + Prot IV |
|---|---|---|---|---|---|---|
| entityAttack | 10 | **0** | 10 | **0 front and back** | 3.00 | 1.08 |
| blockExplosion | 10 | **0** | 10 | **0 front and back** | 3.00 | 1.08 |
| entityExplosion | 10 | **0** | 10 | **0 front and back** | 3.00 | 1.08 |
| fireworks | 10 | **0** | 10 | **0 front and back** | 3.00 | 1.08 |
| thorns | 10 | **0** | 10 | **0 front and back** | 3.00 | 1.08 |
| campfire, charging, contact, fire, lava, lightning, maceSmash, magma, none, piston, ramAttack, soulCampfire, temperature | 10 | 10 | 10 | 10 | 3.00 | 1.08 |
| anvil, fallingBlock, stalactite | 10 | 10 | 10 | 10 | 2.06 | 0.74 |
| drowning, fall, fireTick, flyIntoWall, freezing, magic, **override**, stalagmite, wither | 10 | 10 | 10 | 10 | 10.00 | 3.60 |
| selfDestruct, **sonicBoom**, starve | 10 | 10 | 10 | 10 | 10.00 | 10.00 |
| projectile | throws «Unsupported functionality: Cause 'projectile' is not valid.», with and without a source | | | | | |
| suffocation | 0 on every holder, `false`, no hurt event | | | | | |

The same table as shield × armour (35 causes):

| | armour + Protection as entityAttack (3.00 / 1.08) | armour, stronger (2.06 / 0.74) | Protection only (10 / 3.60) | nothing (10 / 10) |
|---|---|---|---|---|
| **blocked by a raised shield** (front with a source, every side without one) | entityAttack, blockExplosion, entityExplosion, fireworks, thorns | — | — | — |
| **passes a raised shield** | campfire, charging, contact, fire, lava, lightning, maceSmash, magma, none, piston, ramAttack, soulCampfire, temperature | anvil, fallingBlock, stalactite | drowning, fall, fireTick, flyIntoWall, freezing, magic, override, stalagmite, wither | selfDestruct, sonicBoom, starve |

Does not land: projectile (throws), suffocation.

Side findings:
- **`override` is not true damage.** Protection reduces it (10 → 3.60 on Prot IV); only armour points are ignored.
- `entityHurt.damage` reports the **post-armour** amount for script damage (entityAttack 10 → hurt 3.00 on diamond, 1.08 on Prot IV).

Not measured here:
- cause-specific enchantments (Fire, Blast, Projectile Protection);
- the Resistance and Fire Resistance effects;
- kill credit and death messages for the 13 «pass + armour» causes;
- mobs.

These matter only if somebody picks `xq8` option 3 through a passing cause.

## P3 · Option (b) on diamond + Protection IV

| D | native entityAttack + wielder, no shield | native, shield, back to the wielder | native, shield facing the wielder | (b) sonicBoom + Java 1.21 formula | (b) override + the same formula | sonicBoom + flat 4 %/point |
|---|---|---|---|---|---|---|
| 10 | **1.08** ×3 | **1.08** ×3 | 0 ×3 | **1.08** (front shield too) | 0.39 | 0.72 |
| 6 | 0.56 ×3 | 0.56 ×3 | 0 ×3 | 0.56 | 0.20 | 0.43 |

Diamond without the enchantment: native 3.00 / 1.56, the same formula 3.00 / 1.56.

The formula that reproduces the engine to two decimals is the Java 1.21 one:
- armour reduction: `dmg × (1 − clamp(armour − dmg / (2 + toughness/4), armour/5, 20) / 25)`;
- Protection: `× (1 − min(EPF, 20)/25)`;
- diamond: armour 20, toughness 8, EPF 16.

**Answer to question 3.** Option (b) works numerically with `sonicBoom` as the carrier: 1.08 of 10 against diamond + Protection IV, exactly the native number. It fails with `override`, because Protection is applied twice (0.39).

It is redundant, though. Option (b) is meant to apply only when the holder's back faces the wielder, and from behind the native call already lands with exactly that 1.08, with no armour table to maintain.

## Investigation blocks

- **REPRO.** `env ANDREW_BDS_DIR=../dist/bds-x27 docs/feedback/diagnose-CNTR-X27.repro.sh facing|causes`. Two runs each, identical.
- **CAUSE.** The claim is false for the sourced call. The engine's shield check is directional and keyed to the `damagingEntity` position, with the 90° boundary of the vanilla sword. «Regardless of facing» is true only for a source-less call. `strm-pprb:31` P3 prescribes exactly that call (`applyDamage(10, entityAttack)`, no source), which explains how the premise survived.
- **PROOF.** Artifacts 2.json and 3.json above. In-test controls:
  - unshielded hits land (10 / 10 / 8);
  - a sword hit from the front is blocked (0);
  - armour reduces entityAttack (1.08);
  - `isSneaking` reads back as set in every trial.
- **RULED OUT.**
  - *The shield was down when the holder faced away.* In P1 the holder never turns; only the source moves, and `isSneaking` is true throughout. The split flips at 90° and matches the sword control.
  - *Distance decides, not direction.* 2 and 8 blocks give the same split.
- **RADIUS.** Code: none. There is no Storm Blade code yet. The shipped shield facts (sculk sonicBoom; `sculk_hit_armour_shield` asserts the front block) are unaffected. Knowledge: the lines below, found by grepping root `.ai/context` for the claim's phrases and for `xcx27` / `xq8`.
- **GREEN / LIVE.** No fix was written. The measurement itself ran on the real engine.

## Ready resolution text (for `xcx27`, with the rollup copies)

> **Resolved by measurement (CNTR-X27, BDS 1.26.51.1, `.ai/verify/CNTR-X27-AA/2.json`, `3.json`).** The premise is false. `applyDamage(D, {cause: entityAttack, damagingEntity: wielder})`, the call `strm-rdmg` prescribes, is cancelled by a raised shield only when the wielder is within 90° of the holder's view:
> - 0–85° → 0 HP, `false`, shield wear D + 1;
> - 90–180° → D, armour applied;
> - the same at 2 and 8 blocks, and the same split as a vanilla diamond-sword hit.
>
> Only a call with no `damagingEntity` is blocked from every side. The native call is therefore the vanilla shield, a standard protection, which is §02 «до учёта брони и прочих стандартных защит» read literally and `xq8` option 2. From behind, diamond + Protection IV takes 1.08 of 10 (0.56 of 6), the same as without a shield. No deviation, no C-16 entry.
>
> (a) "block from every angle" and (c) are not platform limits but extra code (drop the source and lose kill credit, or a script facing check), and they would deviate from §02. (b) reproduces the native number (sonicBoom + the Java 1.21 armour formula: 1.08) but duplicates what the native call does. Closed.

## Knowledge cleanup (proposed, not applied)

Line numbers refer to the root `.ai/context/analysis/`.

1. `nodes/xcx27__concept-contradiction.md:28` (copies `contradictions.md:219`, `risks.md:226`): «cancels script `applyDamage` with cause `entityAttack` or `projectile` **entirely and regardless of facing** … would therefore take 0 HP» → «cancels `entityAttack` + `damagingEntity` only when the source is within 90° of the holder's view (as a vanilla sword hit); a source-less call is blocked from every side; cause `projectile` throws».
2. `nodes/xcx27__concept-contradiction.md:30` (copies `contradictions.md:221`, `risks.md:228`): «so it is not available to an armour-respecting weapon» → «13 causes pass the shield with armour applied exactly as entityAttack (CNTR-X27 P2); none is needed, since the native call is already directional».
3. `nodes/xcx27__concept-contradiction.md:32-37` (copies `contradictions.md:223-228`, `risks.md:230-235`): the options, the severity and «Default (CAN_ASSUME) is (a)» → the resolution text above; status resolved.
4. `nodes/adr-sbdm__concept-architecture-decision.md:51` (copy `project-knowledge/architecture.md:501`): «any `entityAttack` `applyDamage` is cancelled by a raised shield» → «a raised shield cancels `entityAttack` + wielder only from the front half (< 90°), like a sword hit, and `applyDamage` then returns `false`. Mode C's health write must be skipped on `false`: the write passes the shield (X23 P2)».
5. `nodes/strm-rdmg__concept-rule.md:40` (copy `project-knowledge/business-rules.md:1331`): «A raised shield cancels the call (platform). This is deviation (a) of `xcx27` until `xq8` is answered.» → «A raised shield facing the wielder (< 90°) cancels the call, `applyDamage` returns `false` and the shield wears D + 1, as for a vanilla hit; at ≥ 90° the call lands with armour. No deviation. On `false`, write nothing (window mode's write would pass the shield).»
6. `nodes/strm-ppas__concept-process.md:43`: «A raised shield on the target cancels the bonus (`xcx27`, default (a)).» → «A raised shield facing the wielder cancels the bonus by the same < 90° rule that blocks the melee; from behind both land.»
7. `nodes/strm-pprb__concept-process.md:31` P3: method «`applyDamage(10, entityAttack)`» → «`applyDamage(10, {entityAttack, damagingEntity: wielder})`, because a source-less call is blocked from every side»; the expectation «full block, xcx27 (a)» → «answered by CNTR-X27: blocked < 90°, lands ≥ 90°; the "drop the deviation" branch applies». Keep it as a build GameTest: front 0 and `false`, back D pre-armour.
8. `nodes/strm-pprb__concept-process.md:30` P2b: the pre/post-armour half is answered for script damage: `entityHurt.damage` is post-armour (10 → 3.00 diamond, 1.08 Prot IV). Event order is not measured here.
9. `nodes/xq8__concept-client-question.md:27` (copy `client-questions.md:34`): «(this is easiest on Bedrock and is the default we will build)» → «(needs extra code: drop the source, or check facing in script)».
10. `nodes/xq8__concept-client-question.md:28` (copy `client-questions.md:35`): «2. block it only when facing the wielder, as with a sword hit;» → add «(native on Bedrock; what §02 "прочих стандартных защит" reads as; the default we build)».
11. `nodes/xq8__concept-client-question.md:33` (copy `client-questions.md:40`): «`strm` builds option 1 and records it as a deviation» → «`strm` builds option 2 (native); no deviation».
12. `summary.md:89` and `nodes/concept-overview.md:83`: «`xcx27` with `xq8` (a shield vs the beam; default deviation is a full block)» → «`xcx27` resolved by measurement: the shield blocks the beam from the front only, as in vanilla; `xq8` default is option 2, with no deviation».
13. `nodes/concept-decomposition-plan.md:53`: «• A raised shield against the beam from behind (`xcx27`).» → «• Shield: answered (CNTR-X27). The build GameTest asserts front blocked and back 10 pre-armour.»

Duplicates of the same claim: items 1–5 and 9–12 each carry their rollup copies in parentheses. No other file states «regardless of facing» or «from any direction» for the shield.

## Said to the operator, not filed

- `docker compose up` for a fresh private instance hung on «Image … Pulling». A `timeout 45 docker pull` on the same image reports `Error getting credentials`, and `docker-credential-desktop get` hangs on this host (20:58–21:01). The neighbouring CNTR-X26-AA instance showed the same «Pulling» from 20:56 and was up by 21:12. My private compose file got `pull_policy: never`, because the image is local. The project's compose files do not have it, so the next fresh private instance can hang the same way.
