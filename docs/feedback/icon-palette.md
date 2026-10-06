# Sculk Crossbow icon — palette provenance (SCLKUI-ICON-02-AA)

Follow-up to the rejected SCLKUI-ICON-01-AA report. Two of its four colour
citations did not check out. This report re-verifies all four with the exact
command each claim is checked by, output included. Shape is untouched —
`tests/sculk-crossbow-icon.test.mjs` draws the same silhouette; only the
palette comments and the test title changed.

## Verdict per colour

| key | hex | claim | status |
|---|---|---|---|
| `d` (outline) | `#1a262c` | `minecraft:sculk` → `scripts/render-structure.mjs:110` | **verified byte-exact** |
| `m` (limbs) | `#2a4a52` | `minecraft:sculk_sensor` → `scripts/render-structure.mjs:112` | **verified byte-exact** |
| `h` (stock) | `#00aaaa` | — | **no pack source — chosen for readability** |
| `w` (string) | `#55ffff` | — | **no pack source — chosen for readability** |

## Verification commands and output

### `d` — `#1a262c` = `[26, 38, 44]`

```
$ sed -n '110p' scripts/render-structure.mjs
  'minecraft:sculk': [26, 38, 44],
```

`[26, 38, 44]` = `#1a262c`. Exact match.

### `m` — `#2a4a52` = `[42, 74, 82]`

```
$ sed -n '112p' scripts/render-structure.mjs
  'minecraft:sculk_sensor': [42, 74, 82],
```

`[42, 74, 82]` = `#2a4a52`. Exact match.

### `h` — `#00aaaa`, previously cited as "§3 dark_aqua, en_US.lang:36"

The previous report's citation is false on two counts, both checked directly:

```
$ grep -n '§3' packs/resource/texts/en_US.lang packs/resource/texts/ru_RU.lang
(no output, exit code 1 — zero matches in either file)
```

`§3` occurs nowhere in either lang file — the cited line does not exist.

```
$ sed -n '36p' packs/resource/texts/en_US.lang
andrew.sculk_crossbow.first_craft=§e%s§r forged the legendary §b%s§r!
```

Line 36 holds `§e` and `§b`, not `§3`.

Separately: even a correct formatting-code citation would not be a *pack*
resource — `§3`/`§b` are Bedrock's built-in text colour codes, identical in
every behavior/resource pack and not sourced from this add-on's assets. A
search of the resource pack for any sculk-specific texture, particle or
entity colour data beyond `render-structure.mjs`'s own block-colour table
(used above for `d`/`m`) found none:

```
$ find packs/resource -iname "*.json" | xargs grep -l "color\|tint\|rgb"
packs/resource/particles/katana_petal.json
$ find packs/resource/textures -type f
packs/resource/textures/item_texture.json
packs/resource/textures/entity/ufo_beam_mid.png
packs/resource/textures/entity/ufo_beam_bright.png
packs/resource/textures/entity/ufo_beam_dim.png
packs/resource/textures/items/andrew_scythe_of_calamity.png
packs/resource/textures/items/andrew_web_sword.png
packs/resource/textures/items/andrew_test_item.png
packs/resource/textures/items/andrew_sculk_crossbow.png
packs/resource/textures/items/andrew_miners_pickaxe.png
packs/resource/textures/items/andrew_dragon_katana.png
packs/resource/textures/particle/katana_petal.png
```

Nothing sculk-related besides the already-used `render-structure.mjs` table.
`#00aaaa` is named plainly as **chosen, not sourced**: a brighter teal than
`d`/`m` so the stock reads against the dark outline/limbs at 16×16.

### `w` — `#55ffff`, previously cited as "§b aqua, ru_RU.lang:36 / en_US.lang:36"

The line reference is accurate this time:

```
$ sed -n '36p' packs/resource/texts/ru_RU.lang
andrew.sculk_crossbow.first_craft=§e%s§r выковал легендарный §b%s§r!
```

`§b` is indeed on line 36 of both lang files. But `§b` is Bedrock's standard
aqua *text formatting code* (used to highlight the item name in the
first-craft chat line), not a texture, particle or block colour belonging to
this pack's own sculk assets — the same objection as for `h` applies. Named
plainly as **chosen, not sourced**: the brightest colour in the palette, used
only for the string so it stands out as a hairline against the body.

## What changed in this task

- `tests/sculk-crossbow-icon.test.mjs`: palette comments rewritten so `h` and
  `w` no longer claim a source they don't have; the test title no longer says
  "in sculk colours" (it covered all four, two of which aren't).
- No RGB values changed. `d` and `m` were already byte-exact; `h` and `w`
  are kept at their existing values, now honestly labelled.
- No shape change: the drawing routine (`drawCrossbowGrid`) is untouched.
  Baseline opaque-pixel count before this task: 125 px (verified by decoding
  `andrew_sculk_crossbow.png` before re-running the generating test); same
  count and same coordinates after, see `tests/sculk-crossbow-icon.test.mjs`
  run output in the task's `run-check` artifact.
