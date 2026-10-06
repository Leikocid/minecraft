// The Sculk Crossbow in hand: an attachable whose string and limbs follow the draw, and which
// shows a bolt on the stock from the end of a full draw until the press that fires it.
// Both states are read from the two queries SCLKUI-PROBE-01 measured live on this item
// (docs/feedback/probe-crossbow-look.md, Q3). No query tells "loaded" for this id, so the
// loaded state is the shape of the use session; src/gametest/sculk-look.ts checks that shape
// against the engine's own answer on BDS, session kind by session kind.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rp = join(root, 'packs', 'resource');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf-8'));

const item = readJson(join(root, 'packs', 'behavior', 'items', 'sculk_crossbow.json'))['minecraft:item'];
const attachable = readJson(join(rp, 'attachables', 'sculk_crossbow.json'))['minecraft:attachable'].description;
const geometry = readJson(join(rp, 'models', 'entity', 'sculk_crossbow.geo.json'))['minecraft:geometry'][0];
const animations = readJson(join(rp, 'animations', 'sculk_crossbow.animation.json')).animations;
const controller = readJson(join(rp, 'render_controllers', 'sculk_crossbow.render_controllers.json')).render_controllers[attachable.render_controllers[0]];
const DRAW = animations[attachable.animations.draw];
const HOLD_FIRST_PERSON = animations[attachable.animations.hold_first_person];
const DRAW_TICKS = Math.round(item.components['minecraft:shooter'].max_draw_duration * 20);

// ------------------------------------------------------------------ Molang subset

function tokenize(src) {
  const re = /\s*(\d+(?:\.\d+)?|'[^']*'|[A-Za-z_][\w.]*|&&|\|\||==|!=|<=|>=|[-+*/!?:(),<>;=])/y;
  const out = [];
  let m;
  while (re.lastIndex < src.length && (m = re.exec(src))) out.push(m[1]);
  assert.equal(re.lastIndex >= src.trimEnd().length, true, `cannot tokenize Molang: ${src}`);
  return out;
}

const COMPARE = new Set(['<', '>', '<=', '>=', '==', '!=']);
const ARITHMETIC = new Set(['+', '-', '*', '/', 'u-']);

function parse(src) {
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i];
  const take = (want) => {
    const tok = t[i++];
    if (want !== undefined) assert.equal(tok, want, `expected ${want} in ${src}`);
    return tok;
  };
  const ternary = () => {
    const cond = or();
    if (peek() !== '?') return cond;
    take('?');
    const a = ternary();
    take(':');
    return { op: '?:', cond, a, b: ternary() };
  };
  const chain = (next, ops) => () => {
    let left = next();
    while (ops.includes(peek())) left = { op: take(), a: left, b: next() };
    return left;
  };
  const unary = () => (peek() === '!' || peek() === '-' ? { op: `u${take()}`, a: unary() } : primary());
  const mul = chain(unary, ['*', '/']);
  const add = chain(mul, ['+', '-']);
  const cmp = () => {
    const left = add();
    return COMPARE.has(peek()) ? { op: take(), a: left, b: add() } : left;
  };
  const and = chain(cmp, ['&&']);
  const or = chain(and, ['||']);
  function primary() {
    const tok = take();
    if (tok === '(') {
      const inner = ternary();
      take(')');
      return { ...inner, paren: true };
    }
    if (/^\d/.test(tok)) return { op: 'num', value: Number(tok) };
    if (tok.startsWith("'")) return { op: 'str', value: tok.slice(1, -1) };
    if (peek() === '(') {
      take('(');
      const args = [];
      while (peek() !== ')') {
        args.push(ternary());
        if (peek() === ',') take(',');
      }
      take(')');
      return { op: 'call', name: tok, args };
    }
    return { op: 'id', name: tok };
  }
  // `v.name = expr;` statements, as initialize and pre_animation carry them.
  let target;
  if (t[1] === '=' && /^(v|variable)\./.test(t[0])) {
    target = t[0].replace(/^variable\./, 'v.');
    i = 2;
  }
  const ast = ternary();
  if (peek() === ';') take(';');
  assert.equal(i, t.length, `trailing tokens in ${src}`);
  return { target, ast };
}

const SCOPES = { q: 'q', query: 'q', v: 'v', variable: 'v', c: 'c', context: 'c' };
const MATH = { 'math.clamp': (x, lo, hi) => Math.min(Math.max(x, lo), hi), 'math.min': Math.min, 'math.max': Math.max, 'math.abs': Math.abs };

function evaluate(node, env) {
  const ev = (n) => evaluate(n, env);
  switch (node.op) {
    case 'num':
    case 'str':
      return node.value;
    case 'id': {
      const [scope, ...rest] = node.name.split('.');
      const bag = env[SCOPES[scope]];
      const key = rest.join('.');
      assert.ok(bag && key in bag, `unknown Molang name ${node.name}`);
      return bag[key];
    }
    case 'call':
      assert.ok(node.name in MATH, `unknown Molang function ${node.name}`);
      return MATH[node.name](...node.args.map(ev));
    case '?:':
      return ev(node.cond) ? ev(node.a) : ev(node.b);
    case 'u!':
      return ev(node.a) ? 0 : 1;
    case 'u-':
      return -ev(node.a);
    case '&&':
      return ev(node.a) && ev(node.b) ? 1 : 0;
    case '||':
      return ev(node.a) || ev(node.b) ? 1 : 0;
    case '/': {
      const d = ev(node.b);
      return d === 0 ? 0 : ev(node.a) / d;
    }
    default: {
      const [a, b] = [ev(node.a), ev(node.b)];
      const f = { '*': a * b, '+': a + b, '-': a - b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b, '==': a === b, '!=': a !== b }[node.op];
      assert.notEqual(f, undefined, `unknown Molang operator ${node.op}`);
      return typeof f === 'boolean' ? Number(f) : f;
    }
  }
}

function walk(node, visit) {
  visit(node);
  for (const k of ['a', 'b', 'cond']) if (node[k]) walk(node[k], visit);
  for (const arg of node.args ?? []) walk(arg, visit);
}

const visibility = controller.part_visibility ?? [];

/** Every Molang string of the attachable, its animations and its render controller. */
function molangStrings() {
  const out = [...attachable.scripts.initialize, ...attachable.scripts.pre_animation];
  for (const entry of attachable.scripts.animate) if (typeof entry === 'object') out.push(...Object.values(entry));
  for (const anim of [DRAW, HOLD_FIRST_PERSON])
    for (const channels of Object.values(anim.bones)) for (const values of Object.values(channels)) for (const v of [values].flat()) if (typeof v === 'string') out.push(v);
  for (const entry of visibility) for (const v of Object.values(entry)) if (typeof v === 'string') out.push(v);
  return out;
}

const initialize = attachable.scripts.initialize.map(parse);
const preAnimation = attachable.scripts.pre_animation.map(parse);
const boltShown = parse(visibility.find((entry) => 'bolt' in entry)?.bolt ?? '0').ast;

/**
 * One attachable instance: its variables live from frame to frame, as the client keeps them.
 * `frame()` answers what one rendered frame shows for what the client's queries read.
 */
function hand() {
  const v = {};
  for (const { target, ast } of initialize) v[target.slice(2)] = evaluate(ast, { q: {}, v, c: {} });
  return {
    v,
    frame(mhud, mhmd = 25) {
      const env = { q: { main_hand_item_use_duration: mhud, main_hand_item_max_duration: mhmd }, v, c: {} };
      for (const { target, ast } of preAnimation) v[target.slice(2)] = evaluate(ast, env);
      return { draw: v.draw, bolt: Boolean(evaluate(boltShown, env)) };
    },
  };
}

// ------------------------------------------------------------------ measured use sessions

// main_hand_item_use_duration counts the remaining ticks of the use session and reads 0 once it
// has ended; main_hand_item_max_duration is 25 throughout (probe-crossbow-look.md Q3 and its
// Quick Charge addendum). A session opens at its start ud and loses one a tick; a release at +k
// leaves ud = start − k, the last value the client reads before 0.
const opened = (start, until, endUd = 0) => Array.from({ length: until }, (_, t) => start - t).concat(endUd > 0 ? [endUd] : []);
const idle = (ticks) => Array(ticks).fill(0);

// src/gametest/sculk-look.ts pins these on BDS 1.26.51.1: every kind of session a player can make
// on the product crossbow, and the engine's own answer — an arrow spent at the load and a shot on
// the next tap. `ticks` is the session as the attachable reads it.
const SESSIONS = [
  { name: 'full_draw', ticks: opened(25, 25), loaded: true }, // start(ud=25) complete@+25, arrow spent, tap SHOT
  { name: 'release_at_1', ticks: opened(25, 1, 24), loaded: false }, // release@+1(ud=24): the tap of an empty crossbow
  { name: 'release_at_12', ticks: opened(25, 12, 13), loaded: false },
  { name: 'release_at_23', ticks: opened(25, 23, 2), loaded: false },
  { name: 'quick_charge_1', ticks: opened(20, 20), loaded: false }, // start(ud=20) complete@+20, never loads (README deviation 5)
  { name: 'quick_charge_3', ticks: opened(10, 10), loaded: false },
  { name: 'no_arrows_creative', ticks: opened(25, 25), loaded: true },
  { name: 'creative_with_arrows', ticks: opened(25, 25), loaded: true },
];
// The same shapes as a loaded draw, with the engine answering "empty": what the look cannot tell
// (README, the loaded state's deviations 1 and 2).
const BLIND = [
  { name: 'release_at_24', ticks: opened(25, 24, 1), loaded: false }, // release@+24(ud=1)
  { name: 'no_arrows_survival', ticks: opened(25, 25), loaded: false }, // start(ud=25) complete@+25, nothing spent, tap nothing
];

/** Feed ticks to a hand at `fps` frames per game tick; returns the frame shown on each tick's last frame. */
function play(h, ticks, fps) {
  const out = [];
  for (const mhud of ticks) {
    let shown;
    for (let f = 0; f < fps; f++) shown = h.frame(mhud);
    out.push(shown);
  }
  return out;
}

const FRAME_RATES = [1, 3];

test('the attachable belongs to the Sculk Crossbow and draws with its own geometry and icon', () => {
  assert.equal(attachable.identifier, item.description.identifier);
  assert.equal(attachable.geometry.default, geometry.description.identifier);
  assert.equal(attachable.textures.default, `textures/items/${item.components['minecraft:icon']}`);
  assert.deepEqual(attachable.render_controllers, ['controller.render.andrew.sculk_crossbow']);
});

test('both states read only the two queries the probe measured live, and no clock or counter', () => {
  const names = new Set();
  for (const src of molangStrings()) walk(parse(src).ast, (n) => n.op === 'id' && names.add(n.name.replace(/^query\./, 'q.').replace(/^variable\./, 'v.').replace(/^context\./, 'c.')));
  assert.deepEqual([...names].filter((n) => n.startsWith('q.')).sort(), ['q.main_hand_item_max_duration', 'q.main_hand_item_use_duration']);
  assert.deepEqual([...names].filter((n) => n.startsWith('c.')), ['c.is_first_person']);
  // A counter advances a variable from its own value; here a variable only ever holds its value.
  for (const { target, ast } of preAnimation)
    walk(ast, (n) => {
      if (!ARITHMETIC.has(n.op)) return;
      walk(n, (m) => assert.ok(!(m.op === 'id' && m.name === target), `${target} is computed from itself: a counter`));
    });
  // No timeline of its own: an expression per bone, no keyframes, no length, no anim_time.
  for (const anim of [DRAW, HOLD_FIRST_PERSON]) {
    assert.equal(anim.animation_length, undefined);
    for (const channels of Object.values(anim.bones)) for (const values of Object.values(channels)) assert.ok(Array.isArray(values), 'a keyframe object would be a timer of its own');
  }
  for (const [bone, channels] of Object.entries(DRAW.bones)) assert.match(channels.position[2], /^v\.draw \* \d+(\.\d+)?$/, `${bone} must move by v.draw alone`);
});

test('every comparison is parenthesised: the client binds && tighter than ==', () => {
  for (const src of molangStrings()) {
    const { ast } = parse(src);
    walk(ast, (n) => {
      if (COMPARE.has(n.op) && n !== ast) assert.ok(n.paren, `unparenthesised ${n.op} in ${src}`);
    });
  }
});

test('the loaded state is the third state of the same model: same attachable, geometry and controller', () => {
  assert.ok(geometry.bones.some((b) => b.name === 'bolt' && b.parent === 'crossbow'), 'the bolt is a bone of the crossbow geometry');
  assert.deepEqual(visibility, [{ '*': true }, { bolt: 'v.loaded' }]);
  assert.equal(DRAW.bones.bolt, undefined, 'the bolt does not slide with the draw');
  assert.equal(Object.keys(attachable.animations).length, 2, 'no animation of its own');
});

test('at rest: the string is home and there is no bolt', () => {
  const h = hand();
  for (const shown of play(h, idle(40), 3)) assert.deepEqual(shown, { draw: 0, bolt: false });
});

test('the pull rises over the draw; a full draw ends loaded, and the loaded look holds until the next press', async (t) => {
  for (const fps of FRAME_RATES) {
    await t.test(`${fps} frame(s) a tick`, () => {
      const h = hand();
      const shown = play(h, [...idle(3), ...opened(25, 25), ...idle(200)], fps);
      const draw = shown.slice(3, 28);
      for (let tick = 1; tick < 25; tick++) assert.ok(draw[tick].draw > draw[tick - 1].draw, `+${tick}: the pull only grows while the session runs`);
      assert.ok(draw.every((s) => !s.bolt), 'no bolt while drawing');
      assert.ok(draw[24].draw > 0.9, `the last tick of the session is drawn nearly full, got ${draw[24].draw}`);
      for (const [i, s] of shown.slice(28).entries()) assert.deepEqual(s, { draw: 1, bolt: true }, `+${25 + i}: loaded: string on the latch, bolt on the stock`);
    });
  }
  assert.equal(DRAW_TICKS, 25, 'without enchantment the session ends with max_draw_duration');
});

test('the press that fires takes the loaded look off in the tick of the shot', async (t) => {
  // start@+0 (ud=25) with bolt@+0, release@+1 (ud=24): the tap of a loaded crossbow (probe Q3, sculk-look).
  for (const fps of FRAME_RATES) {
    await t.test(`${fps} frame(s) a tick`, () => {
      const h = hand();
      play(h, [...opened(25, 25), ...idle(10)], fps);
      const [shot, next, ...after] = play(h, [25, 24, ...idle(20)], fps);
      assert.equal(shot.bolt, false, 'the bolt is gone on the shot tick');
      assert.ok(shot.draw <= 1 / 25 && next.draw <= 1 / 25 + 1e-9, `the string is released, got ${shot.draw}, ${next.draw}`);
      for (const s of after) assert.deepEqual(s, { draw: 0, bolt: false });
    });
  }
});

test('a press held after the shot draws again and ends loaded, as the engine reloads', () => {
  // fire_then_hold: start(ud=25) bolt@+0 complete@+25, an arrow spent, the next tap SHOT.
  const h = hand();
  play(h, [...opened(25, 25), ...idle(10)], 3);
  const shown = play(h, [...opened(25, 25), ...idle(5)], 3);
  assert.equal(shown[0].bolt, false, 'the shot takes the bolt off');
  assert.deepEqual(shown.at(-1), { draw: 1, bolt: true });
});

test('every measured session ends in the state the engine left the crossbow in', async (t) => {
  for (const s of SESSIONS) {
    await t.test(s.name, () => {
      for (const fps of FRAME_RATES) {
        const h = hand();
        const end = play(h, [...idle(2), ...s.ticks, ...idle(40)], fps).at(-1);
        assert.deepEqual(end, s.loaded ? { draw: 1, bolt: true } : { draw: 0, bolt: false }, `${fps} fps`);
      }
    });
  }
});

test('what the look cannot tell: a release one tick short and a draw with no arrows read as loaded', async (t) => {
  for (const s of BLIND) {
    await t.test(s.name, () => {
      assert.equal(s.loaded, false, 'the engine left it empty');
      const h = hand();
      const end = play(h, [...s.ticks, ...idle(5)], 3).at(-1);
      // The next tap opens a session, and that takes the look off as it does after a real load.
      assert.deepEqual(play(h, [25, 24, ...idle(3)], 3).at(-1), { draw: 0, bolt: false });
      assert.deepEqual(end, { draw: 1, bolt: true }, 'and the look shows it loaded: README, the loaded state, deviations 1–2');
    });
  }
});

test('a bow drawn in the main hand leaves an off-hand crossbow at rest', () => {
  // Probe Q3 bow row: 71988 of 72000 at +12; released after 25 ticks.
  const h = hand();
  for (const ud of opened(72000, 25, 71975)) assert.ok(h.frame(ud, 72000).draw < 0.001);
  assert.deepEqual(h.frame(0, 25), { draw: 0, bolt: false });
});

// ------------------------------------------------------------------ geometry

function decodePng(buf) {
  let pos = 8;
  let ihdr;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') ihdr = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const width = ihdr.readUInt32BE(0);
  assert.equal(ihdr[9], 6, 'the icon is RGBA');
  const raw = inflateSync(Buffer.concat(idat));
  const at = (x, y) => {
    const o = y * (width * 4 + 1) + 1 + x * 4;
    assert.equal(raw[y * (width * 4 + 1)], 0, 'png.mjs writes filter 0 on every row');
    return [...raw.subarray(o, o + 4)];
  };
  return { width, height: ihdr.readUInt32BE(4), at };
}

const icon = decodePng(readFileSync(join(rp, `${attachable.textures.default}.png`)));
// The icon's own palette (tests/sculk-crossbow-icon.test.mjs).
const STOCK = '0,170,170';
const LIMB = '42,74,82';
const DARK = '26,38,44';
const STRING = '85,255,255';

const bones = new Map(geometry.bones.map((b) => [b.name, b]));
const cubesOf = (prefix) => geometry.bones.filter((b) => b.name.startsWith(prefix)).flatMap((b) => b.cubes.map((c) => ({ bone: b.name, ...c })));
const back = (bone) => Number(DRAW.bones[bone]?.position[2].split('*')[1] ?? 0);

/** The one icon pixel a cube samples; every face samples the same one. */
function colourOf(cube) {
  const faces = Object.values(cube.uv);
  assert.equal(faces.length, 6);
  const [{ uv, uv_size }] = faces;
  for (const f of faces) assert.deepEqual(f, faces[0]);
  const [x, y] = uv.map(Math.floor);
  assert.ok(uv[0] + uv_size[0] <= x + 1 && uv[1] + uv_size[1] <= y + 1, 'a face must stay inside one icon pixel');
  const [r, g, b, a] = icon.at(x, y);
  assert.equal(a, 255);
  return `${r},${g},${b}`;
}

test('every face samples one opaque icon pixel: stock, limbs and string in the icon colours', () => {
  assert.deepEqual([geometry.description.texture_width, geometry.description.texture_height], [icon.width, icon.height]);
  for (const c of geometry.bones.flatMap((b) => b.cubes ?? [])) assert.ok([STOCK, LIMB, DARK, STRING].includes(colourOf(c)));
  assert.equal(colourOf(bones.get('crossbow').cubes[0]), STOCK);
  for (const c of cubesOf('limb_')) assert.equal(colourOf(c), LIMB, c.bone);
  for (const c of cubesOf('string_')) assert.equal(colourOf(c), STRING, c.bone);
});

test('the root follows the hand it is held in, offset by the 24 px the engine takes off a bound bone', () => {
  const rootBone = geometry.bones[0];
  assert.equal(rootBone.binding, 'q.item_slot_to_bone_name(c.item_slot)');
  assert.equal(rootBone.parent, undefined);
  for (const b of geometry.bones.slice(1)) assert.ok(b.parent, `${b.name} hangs under the root`);
  // The grip is the cube the hand closes on: its top meets the stock at the bound pivot's height.
  const grip = bones.get('crossbow').cubes[2];
  assert.ok(grip.origin[1] + grip.size[1] <= 24 && grip.origin[1] + grip.size[1] >= 21, 'the grip sits at the hand');
  assert.deepEqual(bones.get('crossbow').pivot, [0, 24, 0]);
  assert.deepEqual(HOLD_FIRST_PERSON.bones, { crossbow: { rotation: [90, 0, 0] } });
});

test('the model is symmetric across the stock, and so is the draw', () => {
  const key = (c, mirror) => JSON.stringify([mirror ? -(c.origin[0] + c.size[0]) : c.origin[0], c.origin[1], c.origin[2], ...c.size, colourOf(c)]);
  const all = geometry.bones.flatMap((b) => b.cubes ?? []);
  const set = new Set(all.map((c) => key(c, false)));
  for (const c of all) assert.ok(set.has(key(c, true)), `no mirror for ${key(c, false)}`);
  for (const name of Object.keys(DRAW.bones)) if (name.includes('_xp')) assert.equal(back(name), back(name.replace('_xp', '_xn')), name);
  for (const name of Object.keys(DRAW.bones)) assert.ok(bones.has(name), `the draw moves ${name}, which the geometry lacks`);
});

test('the string stays one piece: on the limbs at rest, a V to the latch when drawn', () => {
  const strings = cubesOf('string_').filter((c) => c.origin[0] >= -1e-9 || c.bone === 'string_0').sort((a, b) => a.origin[0] - b.origin[0]);
  const limbs = cubesOf('limb_xp').sort((a, b) => a.origin[0] - b.origin[0]);
  const depth = strings[0].size[2];
  const front = (c, draw) => c.origin[2] + back(c.bone) * draw;
  for (const draw of [0, 0.5, 1]) {
    for (let i = 1; i < strings.length; i++) {
      assert.ok(Math.abs(strings[i].origin[0] - (strings[i - 1].origin[0] + strings[i - 1].size[0])) < 1e-9, 'segments abut in x');
      assert.ok(Math.abs(front(strings[i], draw) - front(strings[i - 1], draw)) < depth, `segments ${i - 1}/${i} overlap in z at draw ${draw}`);
    }
    const tip = limbs.at(-1);
    const outer = strings.at(-1);
    assert.ok(Math.abs(front(outer, draw) - (front(tip, draw) + tip.size[2])) < 1e-9, `the string leaves the limb tip at draw ${draw}`);
  }
  const latch = bones.get('crossbow').cubes[5];
  const centre = strings[0];
  assert.ok(Math.abs(front(centre, 1) + depth - latch.origin[2]) < 1e-9, 'fully drawn, the string reaches the latch');
  for (let i = 1; i < limbs.length; i++) assert.ok(back(limbs[i].bone) > back(limbs[i - 1].bone), 'the limbs bend more towards the tips');
});

test('the bolt lies on the stock, nocked on the drawn string, its shard head out past the front', () => {
  const bolt = cubesOf('bolt');
  const [shaft, ...rest] = bolt;
  const stockTop = bones.get('crossbow').cubes[0].origin[1] + bones.get('crossbow').cubes[0].size[1];
  assert.equal(shaft.origin[1], stockTop, 'the shaft rests on top of the stock');
  assert.equal(shaft.origin[0] + shaft.size[0] / 2, 0, 'on the centre line');
  const string = bones.get('string_0').cubes[0];
  assert.ok(Math.abs(shaft.origin[2] + shaft.size[2] - (string.origin[2] + back('string_0'))) < 1e-9, 'its nock is on the string held at the latch');
  const front = Math.min(...geometry.bones.filter((b) => b.name !== 'bolt').flatMap((b) => (b.cubes ?? []).map((c) => c.origin[2])));
  const tip = Math.min(...bolt.map((c) => c.origin[2]));
  assert.ok(tip <= front - 2, `the head stands out past the front of the crossbow: tip ${tip}, front ${front}`);
  // Our bolt flies as an echo shard: a dark shaft, an aqua shard for a head, sculk fins. No wood, flint or feathers.
  assert.equal(colourOf(shaft), DARK);
  const head = rest.filter((c) => c.origin[2] < front);
  const fins = rest.filter((c) => c.origin[2] >= front);
  assert.ok(head.length >= 2 && head.every((c) => colourOf(c) === STRING), 'the head is aqua');
  assert.ok(fins.length >= 2 && fins.every((c) => colourOf(c) === LIMB), 'the fins are sculk');
  for (const c of fins) assert.ok(c.origin[2] > shaft.origin[2] && c.origin[2] + c.size[2] < shaft.origin[2] + shaft.size[2], 'the fins sit on the shaft');
});
