---
title: Client Questions
type: analysis
generated_at: "2026-10-11T18:49:56.598Z"
source_channel: rollout
node_id: rollout-client-questions
aliases: ["rollout-client-questions","client-questions"]
is_a: ["rollout","client-questions"]
relates_to: ["L0-xq10","L0-xq7","L0-xq8","L0-xq9"]
priority: 630
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

