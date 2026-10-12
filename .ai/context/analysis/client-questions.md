---
title: Client Questions
type: analysis
generated_at: "2026-10-12T18:21:49.822Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0-xq10","L0-xq11","L0-xq12","L0-xq7","L0-xq8","L0-xq9"]
priority: 650
---

# Client Questions (MUST_ASK)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Заполните секцию **Answer** по каждому вопросу — аналитик использует ответы на следующей итерации.

## Q-L0-10 · Real or visual lightning?

### Question

---
title: "Q-L0-10 · Should the trident's lightning be a real bolt (fire, pig → piglin) or a visual one?"
aliases: ["L0-xq10", "Trident lightning question"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx29", "L0-adr-twlt", "L0-trdt"]
see_also: ["abovewatertridentspecv1ruen-part-1"]
---
# Q-L0-10 · Real or visual lightning?

**To Andrey:** each trident hit adds +2 damage and "one lightning". On this server a *real* Minecraft lightning bolt always does these things, even when we cancel its damage:
- sets the ground on fire;
- turns pigs into zombified piglins and villagers into witches;
- charges creepers.

Which do you want?
1. **A visual lightning**, the same flash and thunder as the Storm Blade. No fire and no conversions, exactly +2 damage. This is the default we build.
2. **A real lightning bolt**, with its fire and conversions, still only +2 damage to the target (its own hit cancelled). Like Channeling in a thunderstorm, but every hit, everywhere.

**Why it matters:** with option 2, players can burn their own bases and convert villagers in melee. Until you answer, option 1 ships.

**Source node:** L0-xq10

### Answer

_..._

---

## Q-L0-11 · Enchanting table: which alternative do you approve?

### Question

---
title: "Q-L0-11 · Enchanting table: which alternative, if any, do you approve? (+ the bow's arming gesture)"
aliases: ["L0-xq11", "Enchanting alternative approval"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-ench", "L0-xcx32", "L0-xcx33", "L0-adr-enrl", "L0-xasm38", "L0-ench-cx01", "L0-uwbw"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
---
# Q-L0-11 · Enchanting table: which alternative do you approve?

**For Andrey.** Send this after the `ench` probe's verdict, attached to it.

1. **The enchanting table (blocking for §4's build).** Stable Bedrock does not let an add-on change what the vanilla table *offers* (`xcx32`). The spec says to ask before building any alternative. Pick one:
   - **(a) Re-roll after enchanting.** The table looks vanilla. When you enchant, our rules (20 % rare, no curses, the 70/40/20 levels) replace the result. *Cost:* the hint on the table can name a different enchantment from the one you get. *Anvils:* **[fill in from the probe verdict, Q4]** — either "anvils and books are untouched" (only if the probe proves a signal that tells a table result from an anvil result), or "it may also re-roll some anvil results, for example a book applied for 1–3 levels" (`L0-ench-cx01`).
   - **(b) Our own enchanting station.** This is a new block or menu that shows our offers honestly. *Cost:* it is a new item and recipe, and the vanilla table stays vanilla.
   - **(c) Nothing.** We report it as not possible on stable Bedrock and ship only the tested rules engine, unused.

   The default if there is no answer is **(c)**, plus the report.
2. **The bow's ability (non-blocking).** The spec does not say how to switch the charge on. Our default is **to hold sneak and start drawing**; a normal draw shoots as usual. Is that right?

**Why we ask.** The spec forbids a silent substitute (C-38) and names no gesture (`xcx33`).

**Source node:** L0-xq11

### Answer

_..._

---

## Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips

### Question

---
title: "Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips"
aliases: ["L0-xq12", "Pearl Rod questions"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-xasm43", "L0-xasm42", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4"]
---
# Q-L0-12 · Pearl Rod: the ingredient, the display name, and cross-dimension trips

**To Andrey.** None of these blocks the build. Each one ships with the default shown.

1. **The ingredient.** The spec says: «Название "эндер перо" в речи интерпретировано как эндер-жемчуг; если подразумевался другой предмет, уточнить перед выпуском» ("ender feather" in speech was read as Ender Pearl; confirm before release if something else was meant). **Is it the Ender Pearl?** *Default: yes. Ender Pearl directly above a Fishing Rod, every other cell empty.*
2. **The name.** The rod is a real vanilla fishing rod renamed by the server, so its name is one fixed string and does not follow the iPad's language. **Which should it show: «Перовый сокровятель», "Pearl Rod", or both?** *Default: «Перовый сокровятель» as the name, with "Pearl Rod" on the lore line.*
3. **Other dimensions.** If the probe shows the server can reliably preload and teleport across dimensions, should a rod bound in the Nether take you there from the Overworld? *Default: yes when the probe passes. Otherwise the rod refuses with a message.*
4. **Riders.** If you are riding a horse or boat when you use the rod, should the trip fail, or should you travel and leave the mount behind? *Default: you are dismounted and travel alone, as with `/tp`.*

**Why we ask.** Items 1 and 2 are visible on the iPad and hard to change after players have crafted rods. Items 3 and 4 decide what "safe" means for §7.

**Source node:** L0-xq12

### Answer

_..._

---

## Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)

### Question

---
title: "Q-L0-7 · The Sculk Crossbow defaults the operator should confirm"
aliases: ["L0-xq7", "Sculk Crossbow confirmation sheet"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xcx23", "L0-adr-scbs"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# Q-L0-7 · Sculk Crossbow: confirm the defaults (non-blocking)

The build proceeds on these defaults. A "no" changes only the item named.

1. **Damage** is 10 HP (5 hearts) per bolt, the same at every difficulty, through any armour or shield (`xasm23`).
2. **The crater drops nothing.** Water is not removed. Bedrock, portals and similar stay. Chests in the crater spill. Structures get no protection (`xasm25`).
3. **The patch under a target in the air**: only if there is ground at most 6 blocks below. Boats, minecarts and the UFO take no damage but still get a patch (`xasm24`).
4. **Arrows only, no fireworks.** Tipped-arrow effects are dropped (`xasm27`).
5. **The crossbow is pulled by the UFO magnet**, like every legendary since 1.6.0 (`xasm26`).
6. **Void return** goes to the last holder, falling back to the crafter for a stack nobody has held since the change (`xasm26`; built 2026-10-05).
7. **Feel:** the custom item does hold a loaded bolt — with `charge_on_draw` it loads at `max_draw_duration` and fires on the next press, like a crossbow. Quick Charge has no native effect, so shortening the draw is script work (`adr-scbs`). Hold to load, press to fire, Quick Charge by script — is that acceptable?

**Source node:** L0-xq7

### Answer

_..._

---

## Q-L0-8 · Should a shield stop the beam?

### Question

---
title: "Q-L0-8 · Should a shield stop the Storm Blade's beam?"
aliases: ["L0-xq8", "Storm Blade shield question"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx27", "L0-strm"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# Q-L0-8 · Should a shield stop the beam?

**To Andrey:** a player holding a raised shield is hit by the Storm Blade's 10-block line. Should they:
1. block it completely, from any direction (needs extra code: drop the source, or check facing in script);
2. block it only when facing the wielder, as with a sword hit (native on Bedrock; what §02 "прочих стандартных защит" reads as; the default we build);
3. never block it? Armour still reduces it.

The same question applies to the passive +6 HP. Their shield is usually down when they are being meleed, so it rarely matters there.

**Non-blocking.** `strm` builds option 2 (native); no deviation.

**Source node:** L0-xq8

### Answer

_..._

---

## Q-L0-9 · Throw or dash: which gesture?

### Question

---
title: "Q-L0-9 · How should the player choose between throwing and dashing?"
aliases: ["L0-xq9", "Trident throw/dash question"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx28", "L0-adr-twrp", "L0-trdt"]
see_also: ["abovewatertridentspecv1ruen-part-1"]
---
# Q-L0-9 · Throw or dash: which gesture?

**To Andrey:** a vanilla trident with Riptide can't be thrown. Its release always dashes. Your trident has to do both, with no extra button. On the iPad, which gesture should do what?
1. **Crouched (sneak) + release = dash; standing release = throw.** This is the default we build.
2. In the air or in water = dash; on the ground = throw. You couldn't throw while swimming or jumping.
3. A short hold = throw, a long hold = dash.
4. Something else?

**Why it matters:** this is the one input the whole weapon hangs on. The answer changes only `src/trident/` input handling. Until then, option 1 ships and is noted on the acceptance sheet.

**Source node:** L0-xq9

### Answer

_..._

---

