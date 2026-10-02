---
type: "concept-component"
node_id: "L0-magn"
source_channel: "rollout"
analysis_version: 5
title: "L0-magn · UFO magnet effect"
aliases: ["L0-magn"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 3771
tags: ["is_a:component", "ufo", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-lgnd", "relates_to:L0-adr-ufpc", "relates_to:L0-adr-ufom", "relates_to:L0-adr-ufnd", "see_also:ufomagnetspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-2", "see_also:ufomagnetspecv1ruen-part-3", "see_also:ufomagnetspecv1ruen-part-4"]
level: 1
---
# L0-magn · UFO magnet effect

**Status.** Not implemented. This is step 4 of the Stage 6 order, after `lgnd` v4, `ufoc` and `sauc`. It can be built against a stub `ufoc` that implements `L0-adr-ufpc`. Probes U1–U11 are on branch `probe/ufo-magnet` (`src/gametest/probe-ufo.ts`, BDS 1.26.51.1).

## Responsibility
For 60 s, everything made of iron in the magnet zone is pulled under the hovering saucer and held there. When the magnet goes off, everything is released at once. The work splits into:
- classifying iron;
- one zone scan;
- selecting at most 10 non-player elements;
- turning blocks and container stacks into items;
- moving players and elements each tick;
- releasing them.

## Inputs (the phase contract, `L0-adr-ufpc`)
- `onPhase("magnet", {centre, hoverY, saucerPos, eventId})` starts the magnet: scan, select, extract.
- `magnetStep(tick)` is called by the `ufoc` interval after `saucerStep` in the same tick. `saucerPosition()` is read only inside it, so it is already this tick's position.
- `onPhase("release")` triggers the simultaneous release. A shoot-down (`sauc`), `/andrew:ufo stop` and an abort go through `requestMagnetOff(reason)`, which latches: the release runs at the start of the next interval tick (`L0-magn-prel`).
- `lgnd`: `isLegendaryStack(stack)` is the "never pulled" predicate (`L0-lgnd-ad13`). Until `lgnd` v4 ships, the interim is `defForStack || defForToken` (`L0-magn-rleg`). Holder watching and death retention stay with `lgnd` (`lgnd-r*`); they are not restated here.

## Outputs / world effects
- Iron item entities, extracted stacks, mobs, minecarts and block items move through teleports to ring slots (r 5, 3 blocks below the saucer).
- Players are pulled through `applyKnockback` to a point 6 blocks below the saucer.
- Selected blocks become air, plus exactly one item each. Dependants resting on them pop as in vanilla (`L0-adr-ufnd`).
- On release, everything falls with vanilla physics and vanilla fall damage.

## Zone
- A cylinder of r 50 around the centre, from centre − 20 up to `hoverY`.
- Only loaded chunks count (C-12′).

## Artifacts
- **Processes:** `L0-magn-pscn` (magnet-on scan and selection), `-pext` (extraction and block → item), `-phld` (per-tick hold), `-prel` (release).
- **Entities:** `-eirn` (iron classification lists), `-eelm` (magnet element).
- **Rules:** `-rlim` (limit and priority), `-rexm` (12-block drop exemption), `-rply` (player pull), `-rcnt` (containers), `-rblk` (blocks/door/ore), `-rrng` (ring away from players), `-rrel` (release and fall), `-rleg` (legendary exclusion), `-rdup` (no-dup ordering).
- **ADRs:** `-adhp` (settles `L0-xcx18`), `-adar` (armour through tag selectors), `-adsc` (scan over loaded chunks), `-adex` (drop exemption through `entitySpawn`).
- **Contradiction:** `-cxdp` (AC-10 "nothing else drops" vs vanilla pops of dependants; resolved by `L0-adr-ufnd`).
- **Assumptions:** `-aslh` (legendary holders skipped), `-asfl` (flight speed), `-asrg` (ring margin), `-asit` (block → item), `-asbd` (horse armour, hand iron).
- **Glossary:** `-gelm`, `-gzon`, `-gring`, `-gexm`, `-gcls`, `-gtag`, `-glat`.
- **ACs:**
  - `bds` channel: UFO 4–14 → `-a04` … `-a14`, plus `-atps` (cost measured).
  - `ipad` channel: `-aipd`, one manual criterion for the smooth lift, the visible cloud and the visible fall. It is never closed by a GameTest and is reopened after every epic merge (`L0-xcx19`).

## Boundaries
- No saucer and no beam rendering (`sauc`).
- No schedule (`ufoc`).
- No change to `orbc`.
- All code lives in `src/ufo/magnet*.ts`, driven by the single UFO interval through `magnetStep` (`L0-adr-ufom`, C-5d). It creates no timers of its own. The one event subscription it holds is the drop exemption's `entitySpawn` listener, during the magnet only.
