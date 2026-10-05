#!/usr/bin/env bash
# CNTR-X24-AA probe: measures the L0-xcx24 claims on HEAD, then what three
# def shapes do to defs #1–#4 (tsc + the whole unit suite + a hands/HUD probe).
#   base — HEAD as is
#   A    — abilityKey?/cooldownTicks? (optional flat fields)
#   B    — ability?: { key, cooldownTicks, hudKeys? }, call sites untouched
#   C    — L0-lgnd-ad15: Active | Passive union + hasAbility in hud.ts and hands.ts
# Runs on a scratch `git archive HEAD` copy; the checkout is never edited.
# Exits non-zero when any measurement disagrees with the report.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
mkdir "$scratch/pristine"
git -C "$root" archive HEAD | tar -x -C "$scratch/pristine"

cat > "$scratch/edit.cjs" <<'EOF'
const fs = require("fs");
const [variant, dir] = process.argv.slice(2);
const rd = (f) => fs.readFileSync(`${dir}/${f}`, "utf8");
const wr = (f, s, was) => { if (s === was) throw new Error(`${variant}: no edit landed in ${f}`); fs.writeFileSync(`${dir}/${f}`, s); };
const R = "src/legendary/registry.ts";
let s = rd(R); const r0 = s;
if (variant === "A") {
  s = s.replace("  abilityKey: string;\n", "  abilityKey?: string;\n").replace("  cooldownTicks: number;\n", "  cooldownTicks?: number;\n");
  wr(R, s, r0);
} else if (variant === "B") {
  s = s.replace("  abilityKey: string;\n", "").replace("  cooldownTicks: number;\n", "")
    .replace("  hudKeys?: { ready: string; cooldown: string };\n", "  ability?: { key: string; cooldownTicks: number; hudKeys?: { ready: string; cooldown: string } };\n");
  for (const key of ["web_sword", "scythe_of_calamity", "orbital_cannon", "dragon_katana"]) {
    s = s.replace(new RegExp(`  abilityKey: "${key}",\\n([\\s\\S]*?)  cooldownTicks: 600,\\n([\\s\\S]*?  command: "[^"]+",\\n)(?:  hudKeys: (\\{[^}]*\\}),\\n)?\\};`),
      (_, mid, tail, hud) => `${mid}${tail}  ability: { key: "${key}", cooldownTicks: 600${hud ? `, hudKeys: ${hud}` : ""} },\n};`);
  }
  if (/abilityKey: "|cooldownTicks: 600,\n/.test(s)) throw new Error("B: a def kept a flat field");
  wr(R, s, r0);
} else if (variant === "C") {
  s = s.replace("export interface LegendaryDef {", "interface LegendaryBase {")
    .replace("  /** Namespace of the player's cooldown and busy timers — see cooldownKey(). */\n  abilityKey: string;\n", "")
    .replace("  cooldownTicks: number;\n", "")
    .replace(/  \/\*\*\n   \* The weapon's own HUD lang keys[\s\S]*?hudKeys\?: \{ ready: string; cooldown: string \};\n\}/, (m) =>
      "}\n\nexport interface ActiveLegendaryDef extends LegendaryBase {\n  abilityKey: string;\n  cooldownTicks: number;\n" + m +
      "\n\nexport interface PassiveLegendaryDef extends LegendaryBase {\n  abilityKey?: never;\n  cooldownTicks?: never;\n  hudKeys?: never;\n}\n\n" +
      "export type LegendaryDef = ActiveLegendaryDef | PassiveLegendaryDef;\n\n" +
      "export function hasAbility(def: LegendaryDef): def is ActiveLegendaryDef {\n  return def.abilityKey !== undefined;\n}")
    .replace(/: LegendaryDef = \{/g, ": ActiveLegendaryDef = {")
    .replace("export function defForAbility(abilityKey: string): LegendaryDef | undefined {\n  return LEGENDARIES.find(",
      "export function defForAbility(abilityKey: string): ActiveLegendaryDef | undefined {\n  return LEGENDARIES.filter(hasAbility).find(");
  wr(R, s, r0);
  const H = "src/legendary/hands.ts"; let h = rd(H); const h0 = h;
  h = h.replace('import { type LegendaryDef, defForStack } from "./registry";', 'import { type LegendaryDef, defForStack, hasAbility } from "./registry";')
    .replace("    if (isReady(player, def.abilityKey)", "    if (hasAbility(def) && isReady(player, def.abilityKey)");
  wr(H, h, h0);
  const U = "src/legendary/hud.ts"; let u = rd(U); const u0 = u;
  u = u.replace('import { heldLegendaries } from "./hands";', 'import { heldLegendaries } from "./hands";\nimport { hasAbility } from "./registry";')
    .replace("    if (seen.has(def.abilityKey)) {", "    if (!hasAbility(def) || seen.has(def.abilityKey)) {");
  wr(U, u, u0);
}
EOF

cat > "$scratch/probe.mjs" <<'EOF'
import { build } from 'esbuild';
const projectRoot = process.argv[2];
const stub = { name: 'mc', setup(b) {
  b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'x', namespace: 'mc' }));
  b.onLoad({ filter: /.*/, namespace: 'mc' }, () => ({ loader: 'js', contents:
    'export const world={getDynamicProperty(){}};export const system={runInterval(){}};' +
    'export const EntityComponentTypes={Equippable:"minecraft:equippable"};export const EquipmentSlot={Mainhand:"Mainhand",Offhand:"Offhand"};' }));
} };
const out = await build({ stdin: { resolveDir: projectRoot, loader: 'ts', contents:
  ["registry", "hands", "cooldown"].map((m) => `export * from './src/legendary/${m}.ts';`).join('\n') +
  "\nexport { hudMessage } from './src/legendary/hud.ts';" },
  bundle: true, format: 'esm', platform: 'neutral', write: false, plugins: [stub] });
const lg = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
Date.now = () => 1_000_000;
const stack = (typeId) => ({ typeId, getDynamicProperty: () => undefined });
const player = (main, off) => { const p = new Map(); const hands = { Mainhand: main, Offhand: off };
  return { props: p, getDynamicProperty: (k) => p.get(k), setDynamicProperty: (k, v) => (v === undefined ? p.delete(k) : p.set(k, v)),
    getComponent: (id) => (id === 'minecraft:equippable' ? { getEquipment: (s) => hands[s] } : undefined) }; };
// Def #5 as the crossbow spec describes it: every common field, no ability field.
const XBOW = { itemId: 'andrew:sculk_crossbow', keyPrefix: 'sk', nameKey: 'item.andrew:sculk_crossbow', craftGate: true,
  craftTokenId: 'andrew:sculk_crossbow_crafted', refund: [], textPrefix: 'andrew.crossbow', command: 'andrew:crossbow' };
lg.LEGENDARIES.push(XBOW);
const x = stack(XBOW.itemId), k = stack(lg.DRAGON_KATANA.itemId), c = stack(lg.ORBITAL_CANNON.itemId);
const hit = (p) => { const h = lg.resolveActivation(p); return h ? `${h.slot}:${h.def.itemId}` : 'none'; };
const hud = (p) => { const m = lg.hudMessage(p); return m ? m.rawtext.filter((r) => r.translate).map((r) => r.translate).join('+') : 'none'; };
console.log(`PROBE hud_xbow_alone=${hud(player(x))}`);
console.log(`PROBE hud_xbow_main_katana_off=${hud(player(x, k))}`);
console.log(`PROBE use_xbow_main_katana_off=${hit(player(x, k))}`);
console.log(`PROBE use_xbow_main_cannon_off=${hit(player(x, c))}`);
const kc = player(k, x); lg.startCooldown(kc, lg.DRAGON_KATANA.abilityKey);
console.log(`PROBE use_katana_main_cooling_xbow_off=${hit(kc)}`);
const u = player(); lg.startCooldown(u, 'no_such_ability');
console.log(`PROBE unknown_key_cooldown_ticks=${u.props.get(lg.cooldownKey('no_such_ability')) / 50 - 1_000_000 / 50}`);
console.log(`PROBE has_ability_export=${typeof lg.hasAbility}`);
console.log(`PROBE keys=${['WEB_SWORD', 'SCYTHE_OF_CALAMITY', 'ORBITAL_CANNON', 'DRAGON_KATANA'].map((d) => lg.cooldownKey(lg[d].abilityKey)).join(',')}`);
EOF

fails=0
expect() { # name actual wanted
  if [ "$2" = "$3" ]; then echo "  ok   $1 = $2"; else echo "  FAIL $1 = $2 (want $3)"; fails=$((fails + 1)); fi
}

for v in base A B C; do
  dir="$scratch/$v"
  cp -R "$scratch/pristine" "$dir"
  ln -s "$root/node_modules" "$dir/node_modules"
  [ "$v" = base ] || node "$scratch/edit.cjs" "$v" "$dir"
  echo "=== variant $v"
  (cd "$dir" && "$root/node_modules/.bin/tsc" --noEmit > "$scratch/$v.tsc" 2>&1) || true
  grep -c "error TS" "$scratch/$v.tsc" > "$scratch/$v.tscn" || true
  echo "tsc errors: $(cat "$scratch/$v.tscn")"
  grep "error TS" "$scratch/$v.tsc" | sed -E 's/\(.*//' | sort | uniq -c | sort -rn | sed 's/^/  /' || true
  (cd "$dir" && node --test 'tests/**/*.test.mjs' > "$scratch/$v.test" 2>&1) || true
  sed -nE 's/^ℹ pass ([0-9]+)$/\1/p' "$scratch/$v.test" > "$scratch/$v.pass"
  sed -nE 's/^ℹ fail ([0-9]+)$/\1/p' "$scratch/$v.test" > "$scratch/$v.fail"
  grep -E "^ℹ (tests|pass|fail|skipped) " "$scratch/$v.test" | sed 's/^/  /'
  awk '/^✖ failing tests:/{f=1;next} f && /^✖ /' "$scratch/$v.test" | sed 's/^/  failed: /' || true
  cp "$scratch/probe.mjs" "$dir/xcx24-probe.mjs"
  node "$dir/xcx24-probe.mjs" "$dir" | tee "$scratch/$v.probe"
done

p() { sed -nE "s/^PROBE $2=(.*)$/\1/p" "$scratch/$1.probe"; }
cd_undefined_hits=$(grep -c "andrew:cd_undefined" "$scratch/B.test" || true)

echo "=== checks"
expect "base tsc errors" "$(cat "$scratch/base.tscn")" 0
expect "base unit failures" "$(cat "$scratch/base.fail")" 0
expect "base HUD, crossbow alone" "$(p base hud_xbow_alone)" "andrew.legendary.ready"
expect "base HUD, crossbow + katana" "$(p base hud_xbow_main_katana_off)" "andrew.legendary.ready+andrew.katana.hud_ready"
expect "base Use, crossbow main + katana off" "$(p base use_xbow_main_katana_off)" "Mainhand:andrew:sculk_crossbow"
expect "base Use, crossbow main + cannon off" "$(p base use_xbow_main_cannon_off)" "Mainhand:andrew:sculk_crossbow"
expect "base unknown-key cooldown ticks" "$(p base unknown_key_cooldown_ticks)" 600
expect "A tsc errors" "$(cat "$scratch/A.tscn")" 79
expect "A unit failures" "$(cat "$scratch/A.fail")" 0
expect "B tsc errors" "$(cat "$scratch/B.tscn")" 43
expect "B unit failures" "$(cat "$scratch/B.fail")" 16
expect "B keys of defs #1-#4" "$(p B keys)" "andrew:cd_undefined,andrew:cd_undefined,andrew:cd_undefined,andrew:cd_undefined"
[ "$cd_undefined_hits" -gt 0 ] && echo "  ok   B suite reports andrew:cd_undefined ($cd_undefined_hits lines)" || { echo "  FAIL B suite never shows andrew:cd_undefined"; fails=$((fails + 1)); }
expect "C tsc errors" "$(cat "$scratch/C.tscn")" 0
expect "C unit failures" "$(cat "$scratch/C.fail")" 0
expect "C unit passes = base" "$(cat "$scratch/C.pass")" "$(cat "$scratch/base.pass")"
expect "C keys of defs #1-#4" "$(p C keys)" "$(p base keys)"
expect "C HUD, crossbow alone" "$(p C hud_xbow_alone)" none
expect "C HUD, crossbow + katana" "$(p C hud_xbow_main_katana_off)" "andrew.katana.hud_ready"
expect "C Use, crossbow main + katana off" "$(p C use_xbow_main_katana_off)" "Offhand:andrew:dragon_katana"
expect "C Use, crossbow main + cannon off" "$(p C use_xbow_main_cannon_off)" "Offhand:andrew:orbital_cannon"
expect "C Use, katana main cooling + crossbow off" "$(p C use_katana_main_cooling_xbow_off)" none
echo "=== $fails disagreement(s)"
exit "$fails"
