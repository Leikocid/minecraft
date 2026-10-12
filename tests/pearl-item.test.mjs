// The Pearl Rod as an item (spec v3 §6; L0-pear-pr01, L0-pear-ru04, L0-pear-ac01), off the engine: the pure rules,
// the recipe and its collisions (C-40), the craft token and its icon, the swap and the repairs of src/pearl/item.ts
// against a stand-in @minecraft/server, and that neither the token nor the rod is a legendary (C-46).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../scripts/lib/png.mjs';
import { ICON, ICON_PATH, iconRgba } from '../tools/draw-pearl-rod.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (...p) => JSON.parse(readFileSync(join(root, ...p), 'utf-8'));
const asModule = (text) => import('data:text/javascript;base64,' + Buffer.from(text, 'utf-8').toString('base64'));

const rulesBundle = await build({
  entryPoints: [join(root, 'src', 'pearl', 'item-rules.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  external: ['@minecraft/*'],
});
const rules = await asModule(rulesBundle.outputFiles[0].text);
const { TOKEN_ID, ROD_ID, MARK_KEY, ROD_NAME, LORE_TITLE, LORE_UNBOUND, HAND_CHECK_TICKS, REPAIR_AFTER_USE_TICKS } = rules;

// ------------------------------------------------------------------ rules

test('item-rules imports nothing from the engine', () => {
  assert.doesNotMatch(rulesBundle.outputFiles[0].text, /@minecraft\//);
});

test('the item action: swap a token, repair a worn Pearl Rod, nothing else', () => {
  const { itemAction } = rules;
  assert.equal(itemAction({ typeId: TOKEN_ID, mark: undefined, damage: undefined }), 'swap');
  assert.equal(itemAction({ typeId: ROD_ID, mark: 'r1', damage: 2 }), 'repair');
  assert.equal(itemAction({ typeId: ROD_ID, mark: 'r1', damage: 0 }), 'none');
  assert.equal(itemAction({ typeId: ROD_ID, mark: undefined, damage: 50 }), 'none', 'a plain rod wears as vanilla');
  assert.equal(itemAction({ typeId: ROD_ID, mark: '', damage: 50 }), 'none', 'an empty mark is no mark');
  assert.equal(itemAction({ typeId: ROD_ID, mark: 7, damage: 50 }), 'none', 'a mark is a string');
  assert.equal(itemAction({ typeId: 'minecraft:carrot_on_a_stick', mark: 'r1', damage: 3 }), 'none', 'only a fishing rod is a Pearl Rod');
  assert.equal(itemAction(undefined), 'none');
});

test('a rod id is never empty and does not repeat', () => {
  const { newRodId } = rules;
  const ids = new Set();
  let seed = 0;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 1000; i++) ids.add(newRodId(1000 + i, rand));
  assert.equal(ids.size, 1000);
  assert.match(newRodId(0, () => 0), /^0-0{8}$/);
  assert.ok(newRodId(-5, () => 0.999999).length > 2);
});

test('lore, name and the token count', () => {
  assert.deepEqual(rules.unboundLore(), ['Pearl Rod', 'unbound']);
  assert.equal(ROD_NAME, 'Перовый сокровятель');
  assert.equal(rules.rodsFor(1), 1);
  assert.equal(rules.rodsFor(3), 3);
  assert.equal(rules.rodsFor(0), 1);
  assert.equal(rules.rodsFor(Number.NaN), 1);
  assert.ok(HAND_CHECK_TICKS > 0 && HAND_CHECK_TICKS <= 20);
  assert.ok(REPAIR_AFTER_USE_TICKS >= 1);
});

// ------------------------------------------------------------------ recipe

const recipe = readJson('packs', 'behavior', 'recipes', 'pearl_rod.json')['minecraft:recipe_shaped'];

test('the recipe: pearl over rod, a full 3x3 with blank cells, on the crafting table, one token out', () => {
  assert.equal(recipe.description.identifier, 'andrew:pearl_rod');
  assert.deepEqual(recipe.tags, ['crafting_table']);
  // A full three-row pattern: Bedrock keeps blank rows and columns (probe Q8), so the positions are fixed.
  assert.deepEqual(recipe.pattern, [' P ', ' R ', '   ']);
  assert.deepEqual(recipe.key, { P: { item: 'minecraft:ender_pearl' }, R: { item: 'minecraft:fishing_rod' } });
  assert.deepEqual(recipe.result, { item: TOKEN_ID, count: 1 });
  assert.deepEqual(
    recipe.unlock.map((u) => u.item),
    ['minecraft:ender_pearl', 'minecraft:fishing_rod']
  );
});

/** Ingredient multiset of a shaped or shapeless recipe, as "id×n" sorted. */
function ingredients(r) {
  const counts = new Map();
  if (r.pattern) {
    for (const ch of r.pattern.join('')) {
      if (ch === ' ') continue;
      const id = r.key[ch].item;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  } else {
    for (const ing of r.ingredients ?? []) counts.set(ing.item, (counts.get(ing.item) ?? 0) + (ing.count ?? 1));
  }
  return [...counts].map(([id, n]) => `${id}×${n}`).sort().join(' ');
}

test('C-40: no other shipped recipe takes a pearl and a rod, and the vanilla rod recipes take no pearl', () => {
  const dir = join(root, 'packs', 'behavior', 'recipes');
  const mine = ingredients(recipe);
  assert.equal(mine, 'minecraft:ender_pearl×1 minecraft:fishing_rod×1');
  for (const file of readdirSync(dir)) {
    if (file === 'pearl_rod.json') continue;
    const json = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    const body = json['minecraft:recipe_shaped'] ?? json['minecraft:recipe_shapeless'];
    if (body === undefined) continue;
    assert.notEqual(ingredients(body), mine, `${file} takes the same ingredients as the Pearl Rod`);
  }
  // Bedrock's own recipes that take a fishing rod (vanilla data, not shipped here).
  const vanilla = {
    carrot_on_a_stick: ['minecraft:fishing_rod', 'minecraft:carrot'],
    warped_fungus_on_a_stick: ['minecraft:fishing_rod', 'minecraft:warped_fungus'],
  };
  for (const [name, items] of Object.entries(vanilla)) {
    assert.ok(!items.includes('minecraft:ender_pearl'), `${name} would collide`);
  }
});

// ------------------------------------------------------------------ the craft token

const token = readJson('packs', 'behavior', 'items', 'pearl_rod_token.json')['minecraft:item'];
const itemTexture = readJson('packs', 'resource', 'textures', 'item_texture.json');

function parseLang(file) {
  const map = new Map();
  for (const line of readFileSync(join(root, 'packs', 'resource', 'texts', file), 'utf-8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !line.startsWith('#')) map.set(line.slice(0, i), line.slice(i + 1));
  }
  return map;
}

test('the token: hidden from the Creative menu, stacks to one, named in both languages', () => {
  assert.equal(token.description.identifier, TOKEN_ID);
  assert.deepEqual(token.description.menu_category, { category: 'none' });
  assert.equal(token.components['minecraft:max_stack_size'], 1);
  const key = token.components['minecraft:display_name'].value;
  assert.equal(parseLang('en_US.lang').get(key), 'Pearl Rod');
  assert.equal(parseLang('ru_RU.lang').get(key), ROD_NAME);
});

test('the token icon: registered, drawn by tools/draw-pearl-rod.mjs, in the house size', () => {
  const icon = token.components['minecraft:icon'];
  const path = itemTexture.texture_data[icon]?.textures;
  assert.equal(path, 'textures/items/andrew_pearl_rod_token');
  assert.ok(existsSync(join(root, 'packs', 'resource', `${path}.png`)));
  const png = decodePng(readFileSync(ICON_PATH));
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
  assert.deepEqual([...png.rgba], [...iconRgba()], 'the shipped icon drifted from the drawer — run node tools/draw-pearl-rod.mjs');
  const opaque = ICON.join('').replace(/\./g, '').length;
  const colours = new Set(ICON.join('').replace(/\./g, ''));
  assert.ok(opaque >= 35 && opaque <= 46, `${opaque} opaque pixels`);
  assert.ok(colours.size >= 5 && colours.size <= 9, `${colours.size} colours`);
  assert.ok(ICON[0] === '.'.repeat(16) && ICON[15] === '.'.repeat(16), 'a margin above and below');
  assert.ok(ICON.every((row) => row[0] === '.' && row[15] === '.'), 'a margin left and right');
});

// ------------------------------------------------------------------ item.ts on a stand-in engine

const stubPlugin = {
  name: 'mc-stub',
  setup(b) {
    b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'stub', namespace: 'mc-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'mc-stub' }, () => ({
      loader: 'js',
      contents: `
        const H = (globalThis.__pear = { runs: [], timeouts: [], interval: undefined, players: [], made: 0 });
        export class ItemStack {
          constructor(typeId, amount = 1) {
            H.made++;
            this.typeId = typeId; this.amount = amount; this.nameTag = undefined; this.lore = []; this.dp = new Map();
            this.maxAmount = typeId === 'minecraft:fishing_rod' || typeId === 'andrew:pearl_rod_token' ? 1 : 64;
            this.durability = typeId === 'minecraft:fishing_rod' ? { damage: 0, maxDurability: 384 } : undefined;
            this.enchants = [];
          }
          clone() {
            const c = Object.create(ItemStack.prototype);
            Object.assign(c, this, { lore: [...this.lore], dp: new Map(this.dp), enchants: [...this.enchants],
              durability: this.durability && { ...this.durability } });
            return c;
          }
          setLore(l) { this.lore = [...l]; }
          getLore() { return [...this.lore]; }
          setDynamicProperty(k, v) { if (this.maxAmount !== 1) throw new Error('stackable'); this.dp.set(k, v); }
          getDynamicProperty(k) { if (this.maxAmount !== 1) throw new Error('stackable'); return this.dp.get(k); }
          getComponent(id) {
            if (id === 'minecraft:durability') return this.durability;
            if (id === 'minecraft:enchantable') return { getEnchantments: () => [...this.enchants] };
            return undefined;
          }
        }
        export const world = {
          getAbsoluteTime: () => 1234,
          getAllPlayers: () => H.players,
          afterEvents: {
            playerInventoryItemChange: { subscribe(cb) { H.inv = cb; return cb; } },
            itemUse: { subscribe(cb) { H.use = cb; return cb; } },
          },
        };
        export const system = {
          run(cb) { H.runs.push(cb); },
          runTimeout(cb, t) { H.timeouts.push([cb, t]); },
          runInterval(cb, t) { H.interval = [cb, t]; },
        };
      `,
    }));
  },
};

const itemBundle = await build({
  stdin: {
    contents: "export * from './src/pearl/item.ts'; export { ItemStack } from '@minecraft/server';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  plugins: [stubPlugin],
});
const item = await asModule(itemBundle.outputFiles[0].text);
const { ItemStack } = item;
const H = globalThis.__pear;

/** A player whose inventory hands out copies, like the engine: an unwritten change is lost. */
function fakePlayer(name, slots = 36) {
  const items = new Array(slots).fill(undefined);
  const spilled = [];
  const container = {
    size: slots,
    getItem: (i) => items[i]?.clone(),
    setItem: (i, s) => { items[i] = s?.clone(); },
    addItem: (s) => {
      const free = items.findIndex((x) => x === undefined);
      if (free < 0) return s;
      items[free] = s.clone();
      return undefined;
    },
  };
  return {
    name, id: `id-${name}`, isValid: true, selectedSlotIndex: 0, items, spilled,
    location: { x: 0, y: 0, z: 0 },
    dimension: { spawnItem: (s) => spilled.push(s) },
    getComponent: (id) => (id === 'minecraft:inventory' ? { container } : undefined),
  };
}

function marked(damage) {
  const rod = item.makePearlRod();
  rod.durability.damage = damage;
  return rod;
}

item.registerPearlItem();

test('a new Pearl Rod is a fresh vanilla rod: mark, name, lore, no damage, no enchantment of any input', () => {
  const before = H.made;
  const rod = item.makePearlRod();
  assert.equal(H.made, before + 1, 'built from a new ItemStack, not from the rod that went into the craft');
  assert.equal(rod.typeId, ROD_ID);
  assert.equal(rod.nameTag, ROD_NAME);
  assert.deepEqual(rod.getLore(), [LORE_TITLE, LORE_UNBOUND]);
  assert.equal(typeof rod.getDynamicProperty(MARK_KEY), 'string');
  assert.equal(rod.durability.damage, 0);
  assert.equal(rod.getComponent('minecraft:enchantable').getEnchantments().length, 0);
  assert.notEqual(item.makePearlRod().getDynamicProperty(MARK_KEY), rod.getDynamicProperty(MARK_KEY));
});

test('a token reported in an inventory becomes a Pearl Rod in its slot, once per tick per player', () => {
  const p = fakePlayer('crafter');
  p.items[4] = new ItemStack(TOKEN_ID, 1);
  p.items[7] = new ItemStack(TOKEN_ID, 1);
  H.runs.length = 0;
  H.inv({ itemStack: new ItemStack(TOKEN_ID, 1), player: p, slot: 4 });
  H.inv({ itemStack: new ItemStack(TOKEN_ID, 1), player: p, slot: 7 });
  assert.equal(H.runs.length, 1, 'one flush for the tick');
  H.runs.shift()();
  for (const slot of [4, 7]) {
    const s = p.items[slot];
    assert.equal(s.typeId, ROD_ID, `slot ${slot}`);
    assert.equal(s.nameTag, ROD_NAME);
    assert.equal(typeof s.getDynamicProperty(MARK_KEY), 'string');
  }
  assert.notEqual(p.items[4].getDynamicProperty(MARK_KEY), p.items[7].getDynamicProperty(MARK_KEY));
});

test('a token stack of three gives three rods; with no room the rest lands at the feet', () => {
  const p = fakePlayer('bulk', 2);
  p.items[0] = new ItemStack(TOKEN_ID, 3);
  H.runs.length = 0;
  H.inv({ itemStack: p.items[0], player: p, slot: 0 });
  H.runs.shift()();
  assert.equal(p.items.filter((s) => s?.typeId === ROD_ID).length, 2);
  assert.equal(p.spilled.length, 1);
  assert.equal(p.spilled[0].typeId, ROD_ID);
});

test('no token, or no readable player, schedules nothing', () => {
  H.runs.length = 0;
  H.inv({ itemStack: new ItemStack(ROD_ID, 1), player: fakePlayer('x'), slot: 0 });
  H.inv({ itemStack: new ItemStack(TOKEN_ID, 1), player: undefined, slot: 0 });
  H.inv({ itemStack: undefined, player: fakePlayer('y'), slot: 0 });
  assert.equal(H.runs.length, 0);
});

test('a use of a Pearl Rod repairs that slot in the event and once more a tick later; a plain rod is left to wear', () => {
  const p = fakePlayer('fisher');
  p.selectedSlotIndex = 2;
  p.items[2] = marked(2);
  H.timeouts.length = 0;
  const inEvent = item.itemStats.repairsInEvent;
  H.use({ itemStack: p.items[2], source: p });
  assert.equal(p.items[2].durability.damage, 0, 'the reel damage already on the rod is written back in the event');
  assert.equal(item.itemStats.repairsInEvent, inEvent + 1);
  assert.equal(H.timeouts.length, 1);
  assert.equal(H.timeouts[0][1], REPAIR_AFTER_USE_TICKS);
  p.items[2].durability.damage = 2;
  const before = item.itemStats.repairsAfterUse;
  H.timeouts.shift()[0]();
  assert.equal(p.items[2].durability.damage, 0, 'damage landing after the event is written back through setItem');
  assert.equal(item.itemStats.repairsAfterUse, before + 1);
  assert.equal(typeof p.items[2].getDynamicProperty(MARK_KEY), 'string', 'the repair keeps the mark');

  const q = fakePlayer('plain');
  q.items[0] = new ItemStack(ROD_ID, 1);
  H.use({ itemStack: q.items[0], source: q });
  H.use({ itemStack: marked(0), source: undefined });
  assert.equal(H.timeouts.length, 0);
});

test('the hand check zeroes a held Pearl Rod, leaves a plain rod and skips unreadable players', () => {
  assert.equal(H.interval[1], HAND_CHECK_TICKS);
  const p = fakePlayer('holder');
  p.items[0] = marked(9);
  p.items[1] = marked(9);
  const q = fakePlayer('plain');
  q.items[0] = new ItemStack(ROD_ID, 1);
  q.items[0].durability.damage = 9;
  H.players = [p, undefined, q];
  H.interval[0]();
  assert.equal(p.items[0].durability.damage, 0, 'the selected slot');
  assert.equal(p.items[1].durability.damage, 9, 'only the hand is checked');
  assert.equal(q.items[0].durability.damage, 9);
  H.players = [];
});

// ------------------------------------------------------------------ not a legendary (C-46)

test('neither the token nor a Pearl Rod is a legendary', async () => {
  const stub = {
    name: 'registry-stub',
    setup(b) {
      b.onResolve({ filter: /^@minecraft\/server$/ }, () => ({ path: 'x', namespace: 'reg-stub' }));
      b.onLoad({ filter: /.*/, namespace: 'reg-stub' }, () => ({ loader: 'js', contents: 'export const world = {}; export const system = {};' }));
    },
  };
  const out = await build({
    stdin: { contents: "export * from './src/legendary/registry.ts';", resolveDir: root, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
    plugins: [stub],
  });
  const reg = await asModule(out.outputFiles[0].text);
  for (const typeId of [TOKEN_ID, ROD_ID]) {
    assert.equal(reg.defForToken({ typeId }), undefined, typeId);
    assert.equal(reg.defForStack({ typeId }), undefined, typeId);
    assert.equal(reg.isLegendaryStack({ typeId }), false, typeId);
  }
});
