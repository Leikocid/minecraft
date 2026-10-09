// Storm Blade passive decision (spec §02; L0-strm-ppas steps 1–2, C-32): the 30 % share, independence between
// rolls, what never rolls, and the acceptance window of docs/feedback/probe-storm.md P6. The module runs with no
// engine: any runtime @minecraft import stays external and fails the load below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES_TS = join(projectRoot, 'src', 'storm', 'passive-rules.ts');
const PASSIVE_TS = join(projectRoot, 'src', 'storm', 'passive.ts');

const bundle = await build({
  entryPoints: [RULES_TS],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const bundleText = bundle.outputFiles[0].text;
const rules = await import('data:text/javascript;base64,' + Buffer.from(bundleText, 'utf-8').toString('base64'));
const { PASSIVE_CHANCE, decidePassive } = rules;

const BLADE = 'andrew:storm_blade';
/** P6: N ≥ 3 656 for every error under 0.1 %, taken as 3 700; accepted share in [27.5 %; 32.5 %]. */
const N = 3700;
const LO = 0.275;
const HI = 0.325;

/** mulberry32: a seeded uniform [0, 1) source, so every statistical assertion below is reproducible. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bladeHit(over = {}) {
  return {
    cause: 'entityAttack',
    byPlayer: true,
    cancelled: false,
    scripted: false,
    mainHand: BLADE,
    living: () => true,
    stale: () => false,
    ...over,
  };
}

/** `decide` over `n` eligible hits: the share of procs. */
function share(n, rng, decide = (r) => decidePassive(bladeHit(), r)) {
  let k = 0;
  for (let i = 0; i < n; i++) if (decide(rng).kind === 'proc') k++;
  return k / n;
}

test('the chance is the spec\'s 30 %, and the roll is strictly below it', () => {
  assert.equal(PASSIVE_CHANCE, 0.3);
  assert.deepEqual(decidePassive(bladeHit(), () => 0), { kind: 'proc', roll: 0 });
  assert.equal(decidePassive(bladeHit(), () => 0.2999999).kind, 'proc');
  assert.equal(decidePassive(bladeHit(), () => 0.3).kind, 'miss');
  assert.equal(decidePassive(bladeHit(), () => 0.9999999).kind, 'miss');
});

test('an eligible hit draws exactly one number; a skipped one draws none', () => {
  const cases = [
    [{}, undefined],
    [{ cause: 'projectile' }, 'cause'],
    [{ byPlayer: false }, 'not-player'],
    [{ cancelled: true }, 'cancelled'],
    [{ scripted: true }, 'scripted'],
    [{ mainHand: 'minecraft:diamond_sword' }, 'not-blade'],
    [{ mainHand: undefined }, 'not-blade'],
    [{ mainHand: 'andrew:storm_blade_crafted' }, 'not-blade'],
    [{ living: () => false }, 'not-living'],
    [{ stale: () => true }, 'stale'],
  ];
  for (const [over, why] of cases) {
    let calls = 0;
    const d = decidePassive(bladeHit(over), () => {
      calls++;
      return 0;
    });
    if (why === undefined) {
      assert.equal(d.kind, 'proc');
      assert.equal(calls, 1, 'one roll per eligible hit');
    } else {
      assert.deepEqual(d, { kind: 'skip', why }, JSON.stringify(over));
      assert.equal(calls, 0, `a ${why} skip must not consume a roll`);
    }
  }
});

test('the costly reads are asked only after the cheap checks pass', () => {
  let livingAsked = 0;
  let staleAsked = 0;
  const hit = (over) =>
    bladeHit({
      living: () => (livingAsked++, true),
      stale: () => (staleAsked++, false),
      ...over,
    });
  decidePassive(hit({ mainHand: 'minecraft:diamond_sword' }), () => 0);
  decidePassive(hit({ scripted: true }), () => 0);
  assert.equal(livingAsked + staleAsked, 0);
  decidePassive(hit({ living: () => false }), () => 0);
  assert.equal(staleAsked, 0);
});

test('the pack\'s own scripted damage never rolls the passive (the active\'s 10, a Scythe hit)', () => {
  let calls = 0;
  const d = decidePassive(bladeHit({ scripted: true }), () => (calls++, 0));
  assert.deepEqual(d, { kind: 'skip', why: 'scripted' });
  assert.equal(calls, 0);
});

test(`P6 window: N=${N}, share in [${LO}; ${HI}] — a 30 % roll passes, 25 % and 35 % do not`, () => {
  const trials = 1000;
  const inside = (scale) => {
    let ok = 0;
    let sum = 0;
    for (let t = 0; t < trials; t++) {
      const r = seeded(0x5eed0000 + t);
      const p = share(N, () => r() * scale);
      sum += p;
      if (p >= LO && p <= HI) ok++;
    }
    return { ok, mean: sum / trials };
  };
  const at30 = inside(1);
  // Exact binomial (p6-sample-size.mjs): 99.91 % of 30 % samples inside, 0.025 % of 25 %, 0.068 % of 35 %.
  assert.ok(at30.ok >= 995, `30 %: ${at30.ok}/${trials} samples inside`);
  assert.ok(Math.abs(at30.mean - 0.3) < 0.001, `30 %: mean share ${at30.mean}`);
  const at25 = inside(0.3 / 0.25);
  const at35 = inside(0.3 / 0.35);
  assert.ok(Math.abs(at25.mean - 0.25) < 0.001 && Math.abs(at35.mean - 0.35) < 0.001, 'the controls really are 25 % and 35 %');
  assert.ok(at25.ok <= 5, `NEGATIVE CONTROL 25 %: ${at25.ok}/${trials} samples inside the window`);
  assert.ok(at35.ok <= 5, `NEGATIVE CONTROL 35 %: ${at35.ok}/${trials} samples inside the window`);
});

test('Math.random itself: 10^6 rolls give 30 % to within 0.3 points', () => {
  const p = share(1_000_000, Math.random);
  // σ = 0.00046: the band is 6.5 σ wide on each side.
  assert.ok(Math.abs(p - 0.3) < 0.003, `share ${p}`);
});

/** P(proc | previous proc) and P(proc | previous miss) over one sequence. */
function conditional(n, rng, decide) {
  let prev;
  const after = { proc: [0, 0], miss: [0, 0] };
  for (let i = 0; i < n; i++) {
    const kind = decide(rng).kind;
    if (prev !== undefined) {
      after[prev][1]++;
      if (kind === 'proc') after[prev][0]++;
    }
    prev = kind;
  }
  return { afterProc: after.proc[0] / after.proc[1], afterMiss: after.miss[0] / after.miss[1] };
}

test('independence: a roll does not depend on the rolls before it', () => {
  // Deterministic: whatever came before, the same number gives the same outcome.
  const procs = Array.from({ length: 50 }, () => decidePassive(bladeHit(), () => 0.01).kind);
  assert.ok(procs.every((k) => k === 'proc'));
  assert.equal(decidePassive(bladeHit(), () => 0.5).kind, 'miss', 'no streak bonus after 50 procs');
  const misses = Array.from({ length: 50 }, () => decidePassive(bladeHit(), () => 0.9).kind);
  assert.ok(misses.every((k) => k === 'miss'));
  assert.equal(decidePassive(bladeHit(), () => 0.31).kind, 'miss', 'no pity proc after 50 misses');
  assert.equal(decidePassive(bladeHit(), () => 0.29).kind, 'proc');

  // Statistical: after a proc and after a miss the share is the same 30 % (σ ≈ 0.0008 on each).
  const c = conditional(1_000_000, seeded(42), (r) => decidePassive(bladeHit(), r));
  assert.ok(Math.abs(c.afterProc - 0.3) < 0.003, `after a proc ${c.afterProc}`);
  assert.ok(Math.abs(c.afterMiss - 0.3) < 0.003, `after a miss ${c.afterMiss}`);
});

test('NEGATIVE CONTROL: the independence check catches a pity roll that keeps state', () => {
  let misses = 0;
  const pity = (r) => {
    const d = decidePassive(bladeHit(), r);
    if (d.kind === 'proc' || misses >= 3) {
      misses = 0;
      return { kind: 'proc', roll: d.kind === 'skip' ? 0 : d.roll };
    }
    misses++;
    return d;
  };
  const c = conditional(1_000_000, seeded(42), pity);
  assert.ok(Math.abs(c.afterProc - c.afterMiss) > 0.01, `pity: after a proc ${c.afterProc}, after a miss ${c.afterMiss}`);
});

// The strike's ids, column and single interval are visuals.ts's, held by tests/storm-active.test.mjs.
test('the strike: one per proc, the active\'s own from visuals.ts, flashing at the target\'s feet (L0-strm-rvis)', () => {
  const code = readFileSync(PASSIVE_TS, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.match(code, /import \{ playStrikes \} from "\.\/visuals"/);
  assert.match(code, /PASSIVE_STRIKE_DELAYS: readonly number\[\] = \[0\]/, 'one strike per proc');
  assert.match(code, /playStrikes\(dimension, at, at, PASSIVE_STRIKE_DELAYS\)/, 'the column and the flash both at the feet');
  assert.match(code, /let strikeVisual: StrikeVisual = drawStrike;/, 'the release pack draws through visuals.ts by default');
  assert.doesNotMatch(code, /\bspawnParticle\s*\(|\bplaySound\s*\(|\brunInterval\s*\(/, 'passive.ts draws or schedules on its own');
});

test('static: passive.ts deals no damage of its own and never touches the cooldown', () => {
  const src = readFileSync(PASSIVE_TS, 'utf-8');
  const code = src
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  assert.match(code, /raiseHit\(event, PASSIVE_DAMAGE\)/, 'the bonus goes through the helper');
  for (const banned of [/applyDamage/, /afterArmour/, /setCurrentValue/, /\.damage\s*[+\-*]?=(?!=)/, /lightning_bolt/]) {
    assert.doesNotMatch(code, banned, `passive.ts must not contain ${banned}`);
  }
  for (const banned of [/legendary\/cooldown/, /cooldownKey|busyKey|startCooldown|clearCooldown|setBusy/, /setDynamicProperty/]) {
    assert.doesNotMatch(code, banned, `passive.ts must not reach the cooldown: ${banned}`);
  }
});

/** Product sources, gametest excluded, with comment lines dropped. */
function productCode(dir = join(projectRoot, 'src')) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'gametest') out.push(...productCode(path));
    } else if (entry.name.endsWith('.ts')) {
      const code = readFileSync(path, 'utf-8')
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join('\n');
      out.push({ path: path.slice(projectRoot.length + 1), code });
    }
  }
  return out;
}

test('static: every scripted entityAttack goes through applyScriptedDamage, so the passive can tell it from a swing', () => {
  const direct = productCode().filter(
    ({ path, code }) => path !== join('src', 'legendary', 'scripted-damage.ts') && /\.applyDamage\(/.test(code) && /EntityDamageCause\.entityAttack/.test(code)
  );
  assert.deepEqual(
    direct.map((f) => f.path),
    [],
    'these files call applyDamage with cause entityAttack directly: the passive would roll on their hits'
  );
  const users = productCode().filter(({ code }) => /applyScriptedDamage\(/.test(code)).map((f) => f.path);
  for (const want of [join('src', 'storm', 'damage.ts'), join('src', 'scythe', 'volley.ts')]) assert.ok(users.includes(want), `${want} marks its hits`);
});
