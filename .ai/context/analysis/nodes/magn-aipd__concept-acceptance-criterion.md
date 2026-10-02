---
type: "concept-acceptance-criterion"
node_id: "L0-magn-aipd"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-aipd"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1166
tags: ["is_a:acceptance-criterion", "channel:ipad", "manual", "ufo-dod-ipad", "ufo-ac-4", "ufo-ac-7", "ufo-ac-14", "resolves:L0-xcx19", "relates_to:L0-magn-a04", "relates_to:L0-magn-a07", "relates_to:L0-magn-a14", "relates_to:L0-sauc-ac06", "see_also:ufomagnetspecv1ruen-part-4"]
level: 2
---
**UFO DoD, iPad eye check for the magnet (ipad, manual).** This is the iPad half of AC-4, AC-7 and AC-14, lifted out of those GameTest criteria (`L0-xcx19`). It is written like `L0-sauc-ac06`.

- **GIVEN** the production world on the iPad, with a second player (or a held sim player on QA) and some iron in the zone: ground items, a chest stack and a golem,
- **WHEN** a person triggers `/andrew:ufo come` and watches the whole magnet phase and the release,
- **THEN** that person confirms on the iPad, with screenshots or a short recording attached to the task:
  1. **Lift (AC-4).** A player holding iron rises smoothly under the saucer, with no visible stutter or rubber-banding while held.
  2. **Cloud (AC-14).** The pulled iron is visible as a cloud circling under the saucer for the whole hold, and items visibly fly in from the ground, including any that rise through stone.
  3. **Fall (AC-7, AC-14).** On release the player and every element visibly fall at once.

**Closing rule.**
- No GameTest can close this criterion. A passing `bds` run of `a04`, `a07` or `a14` is not evidence for it.
- It is reopened after every epic merge that touches `src/ufo/`.
