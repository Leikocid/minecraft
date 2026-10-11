---
title: Contradictions
type: analysis
generated_at: "2026-10-11T18:51:33.860Z"
source_channel: rollout
node_id: rollout-contradictions
aliases: ["rollout-contradictions","contradictions"]
is_a: ["rollout","contradictions"]
relates_to: ["L0-xcx28","L0-xcx29"]
priority: 630
---

# Contradictions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### CX-L0-28 · Throw vs dash on the same input (L0-xcx28)

---
title: "CX-L0-28 · Throw and dash share one input with no separate button"
aliases: ["L0-xcx28", "Trident throw vs dash"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twrp", "L0-xq9"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# CX-L0-28 · Throw vs dash on the same input

**Statement A (trident §02, dash):** a Riptide-III-like dash "works anywhere, including dry air". "No separate active button."

**Statement B (trident §02, throw):** "Throwing uses vanilla-like trajectory". The re-throw lock and the 10 b/s return assume the trident is thrown in ordinary play, wherever the player is.

**Why they collide.** A vanilla trident has exactly one Use gesture: hold to charge, release. With Riptide, release *always* dashes, and the trident can never be thrown in water or rain. That is why Riptide and Loyalty are mutually exclusive in vanilla. The spec makes the dash work everywhere but keeps the throw, and gives no second input to choose between them. As written, every release would have to do both, or one would never happen.

**Category:** spec-internal ambiguity. It blocks the `trdt` input design, but not the rest of the node.

**Default, unless Andrey answers `xq9` otherwise:** a **sneaking release dashes, and a plain release throws** (`L0-adr-twrp`).
- Sneaking is the one modifier that is readable server-side on stable and works on iPad touch.
- It is the same signal the shield already uses (`isSneaking`).

Rejected alternatives:
- **Dash when airborne or in water, throw on the ground.** Players could not throw while swimming, and the choice is implicit.
- **Charge length chooses** (short = throw, long = dash). It cannot be read reliably on touch.

**Closes when:** Andrey answers `xq9`, or the default ships with the input written into the README and the iPad sheet as a reported limitation.






### CX-L0-29 · Real lightning vs "spectacle never deals damage" (L0-xcx29)

---
title: "CX-L0-29 · 'Summon exactly one lightning strike' vs C-30 and the exact +2 HP"
aliases: ["L0-xcx29", "Trident lightning"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twlt", "L0-adr-sblt", "L0-xq10", "L0-strm"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2", "stormbladeelytratotemspecruen-part-1"]
---
# CX-L0-29 · Real lightning vs "spectacle never deals damage"

**Statement A (trident §02):**
- Every successful hit "summons exactly one lightning strike" and "deals +2 HP".
- "Prevent recursive lightning-triggered damage."

The wording is Channeling's: a real bolt.

**Statement B (C-30, written at v8 from the Storm Blade spec and phrased project-wide):** any weapon's lightning causes no damage, fire, knockback, mob conversion or block change. If vanilla `lightning_bolt` cannot meet that on stable, it is not spawned (`L0-adr-sblt`).

**Evidence that they collide on BDS 1.26.51.1** (measured during the Storm Blade work, project memory):
- A vanilla `lightning_bolt` converts pigs and villagers and places fire, **even with every lightning and fire hurt cancelled**.
- The bolt's own hit is a second damage event. Unless it is cancelled, the hit is no longer "base + 2".

So "one real lightning" and "exactly +2, no recursion" cannot both hold with the vanilla entity. The fire and conversions also break C-30 as written.

**Category:** a source-vs-constraint conflict. C-30 was generalised from one spec, so it is now amended to C-30′ (the client may opt in).

**Default, unless `xq10` says otherwise:** `L0-adr-twlt`.
- The strike is the Storm Blade's visual (`src/storm/visuals.ts`): particles plus thunder sound, one per hit.
- The +2 is delivered by script.
- Ship notes and the iPad sheet report that no `lightning_bolt` entity is spawned and why.

**Closes when:** Andrey answers `xq10`, or the default ships with the reported limitation.






