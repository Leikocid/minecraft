// The UFO magnet's choice on a real engine (src/ufo/iron.ts, magnet-select.ts):
// every id resolves on BDS 1.26.51.1, and each scenario runs the product's r 50
// zone on its own stone pad far from every other test. A pad's ticking area is
// smaller than the zone, so every scan also meets unloaded chunks (C-12′).

import {
  BlockPermutation,
  BlockTypes,
  BlockVolume,
  type Container,
  Difficulty,
  type Dimension,
  type Entity,
  EntityTypes,
  ItemStack,
  ItemTypes,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type Test, registerAsync } from "@minecraft/server-gametest";
import { DRAGON_KATANA, ORBITAL_CANNON, SCYTHE_OF_CALAMITY, WEB_SWORD, genLedgerKey, isLegendaryStack } from "../legendary/registry";
import * as state from "../legendary/state";
import { FIRST_MAX_MS, FIRST_MIN_MS, PAUSE_MS, type UfoEnv, type UfoPlayer } from "../ufo/env";
import { IRON_TAG, type Magnet, type Saucer, UfoCore, hoverHeight } from "../ufo/event";
import { BLOCK_ITEMS, CONTAINER_BLOCKS, IRON_ARMOUR, IRON_ENTITY_TYPES, IRON_ITEMS, IRON_ORE, RAW_IRON, SCAN_TYPES, itemForBlock } from "../ufo/iron";
import { BLOCK, GROUND, HOLDER, type MagnetHost, type MagnetSelection, ORE, STACK, type Zone, inZone, magnetOn, reach, zoneMiddle, zoneOf } from "../ufo/magnet-select";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const FILL_CELLS = 32768;

const log = (msg: string): void => console.warn(`[gametest] magnet ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const short = (id: string): string => id.replace("minecraft:", "").replace("andrew:", "a:");

const host: MagnetHost = {
  itemStack: (typeId, amount) => new ItemStack(typeId, amount),
  volume: (from, to) => new BlockVolume(from, to),
  now: () => Date.now(),
  log: (msg) => console.warn(`[gametest] ${msg}`),
};

function fill(dim: Dimension, min: Vector3, max: Vector3, type: string): void {
  const area = (max.x - min.x + 1) * (max.z - min.z + 1);
  const slab = Math.max(1, Math.floor(FILL_CELLS / area));
  for (let y = min.y; y <= max.y; y += slab) {
    dim.fillBlocks(new BlockVolume({ x: min.x, y, z: min.z }, { x: max.x, y: Math.min(max.y, y + slab - 1), z: max.z }), type);
  }
}

// ---------------------------------------------------------------- the pads

/** Far from the origin, on −x where no other test builds; one pad per scenario. */
const SITE_DX = -1200;
const SITE_STEP = -240;
const SITE_DZ = 600;
const PAD_HALF = 14;
/** Deep enough for ore at the zone floor (centre − 20) to sit inside stone. */
const PAD_DEPTH = 24;
const LOAD_MARGIN = 6;

interface Pad {
  dim: Dimension;
  cx: number;
  cz: number;
  /** The pad's top row: the event centre's y. */
  top: number;
  centre: Vector3;
  hoverY: number;
  zone: Zone;
  unload: () => void;
}

async function pad(test: Test, name: string, k: number): Promise<Pad> {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cx = origin.x + SITE_DX + SITE_STEP * k;
  const cz = origin.z + SITE_DZ;
  const top = dim.heightRange.min + PAD_DEPTH + 10;
  const r = PAD_HALF + LOAD_MARGIN;
  const unload = await loadBox(test, dim, name, { min: [cx - r, 0, cz - r], max: [cx + r, 0, cz + r] });
  fill(dim, { x: cx - PAD_HALF, y: top - PAD_DEPTH, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: top, z: cz + PAD_HALF }, "minecraft:stone");
  fill(dim, { x: cx - PAD_HALF, y: top + 1, z: cz - PAD_HALF }, { x: cx + PAD_HALF, y: top + 12, z: cz + PAD_HALF }, "minecraft:air");
  const centre = { x: cx, y: top, z: cz };
  const hoverY = hoverHeight(top, dim.heightRange.max);
  return { dim, cx, cz, top, centre, hoverY, zone: zoneOf(centre, hoverY, dim.heightRange), unload };
}

const at = (p: Pad, dx: number, dz: number, dy = 1): Vector3 => ({ x: p.cx + dx, y: p.top + dy, z: p.cz + dz });
const middle = (b: Vector3): Vector3 => ({ x: b.x + 0.5, y: b.y + 0.5, z: b.z + 0.5 });

function blockAt(p: Pad, b: Vector3): string {
  return p.dim.getBlock(b)?.typeId ?? "unloaded";
}

function setBlock(p: Pad, b: Vector3, typeId: string): void {
  const block = p.dim.getBlock(b);
  if (block === undefined) throw new Error(`${fmt(b)} is not loaded`);
  block.setType(typeId);
}

/** Both halves: a lone lower half pops. */
function placeDoor(p: Pad, b: Vector3): void {
  p.dim.getBlock(b)?.setPermutation(BlockPermutation.resolve("minecraft:iron_door", { upper_block_bit: false }));
  p.dim.getBlock({ ...b, y: b.y + 1 })?.setPermutation(BlockPermutation.resolve("minecraft:iron_door", { upper_block_bit: true }));
}

function containerAt(p: Pad, b: Vector3): Container {
  const c = p.dim.getBlock(b)?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${blockAt(p, b)} at ${fmt(b)} has no inventory`);
  return c;
}

function stackOf(e: Entity): ItemStack | undefined {
  return e.isValid ? e.getComponent("minecraft:item")?.itemStack : undefined;
}

function itemsIn(p: Pad): Entity[] {
  return p.dim.getEntities({ type: "minecraft:item", location: zoneMiddle(p.zone), maxDistance: reach(p.zone) }).filter((e) => e !== undefined && e.isValid && inZone(p.zone, e.location));
}

function describe(sel: MagnetSelection): string {
  return sel.elements.map((e) => `${e.cls}:${short(e.from)}@${e.distance.toFixed(1)}`).join(" ");
}

/** The zone holds no iron before seeding: the pass picks nothing and changes nothing. */
function assertClean(test: Test, p: Pad): void {
  const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
  test.assert(sel.elements.length === 0 && sel.failures.length === 0, `the zone was not clean before seeding: ${describe(sel)} ${sel.failures.join(" | ")}`);
}

function removeAll(entities: Iterable<Entity | undefined>): void {
  for (const e of entities) if (e?.isValid) e.remove();
}

function clearItems(p: Pad): void {
  removeAll(itemsIn(p));
}

/** Kept still for the few ticks between seeding and the scan. */
function spawnStill(p: Pad, typeId: string, b: Vector3): Entity {
  const e = p.dim.spawnEntity(typeId, { x: b.x + 0.5, y: b.y, z: b.z + 0.5 });
  e.addEffect("slowness", 600, { amplifier: 255, showParticles: false });
  e.addEffect("fire_resistance", 600, { amplifier: 0, showParticles: false });
  return e;
}

function nonDecreasing(values: readonly number[]): boolean {
  return values.every((v, i) => i === 0 || values[i - 1] <= v + 1e-9);
}

// ------------------------------------------------ AC-1: every id resolves on 1.26.51, every block gives its own item

registerAsync("andrew", "ufo_iron_ids_resolve", async (test: Test): Promise<void> => {
  const missing: string[] = [];
  for (const id of IRON_ITEMS) if (ItemTypes.get(id) === undefined) missing.push(`item ${id}`);
  for (const { item } of IRON_ARMOUR) if (ItemTypes.get(item) === undefined) missing.push(`armour ${item}`);
  for (const id of new Set([...SCAN_TYPES, ...BLOCK_ITEMS.keys(), ...IRON_ORE, ...CONTAINER_BLOCKS])) if (BlockTypes.get(id) === undefined) missing.push(`block ${id}`);
  for (const id of new Set([...BLOCK_ITEMS.values(), RAW_IRON])) if (ItemTypes.get(id) === undefined) missing.push(`block item ${id}`);
  for (const id of IRON_ENTITY_TYPES) if (EntityTypes.get(id) === undefined) missing.push(`entity ${id}`);
  log(`ids RESULT ${IRON_ITEMS.size} items, ${BLOCK_ITEMS.size} built blocks, ${IRON_ORE.size} ores, ${CONTAINER_BLOCKS.size} containers, ${IRON_ENTITY_TYPES.size} entity types; missing [${missing.join(" ")}]`);
  test.assert(missing.length === 0, `ids missing on this engine: ${missing.join(", ")}`);

  // L0-magn-asit: Block.getItemStack(1) of each placed built block against the map.
  const p = await pad(test, "andrew_gt_magn_i", 7);
  try {
    const rows: string[] = [];
    const wrong: string[] = [];
    [...BLOCK_ITEMS.keys()].forEach((id, i) => {
      const b = at(p, -12 + 2 * (i % 13), -10 + 3 * Math.floor(i / 13));
      let got = "place threw";
      try {
        if (id === "minecraft:iron_door") placeDoor(p, b);
        else setBlock(p, b, id);
        got = blockAt(p, b) === id ? (p.dim.getBlock(b)?.getItemStack(1)?.typeId ?? "undefined") : `placed as ${blockAt(p, b)}`;
      } catch (err) {
        got = `threw ${String(err)}`;
      }
      rows.push(`${short(id)}→${short(got)}`);
      // Where the engine names no registered item (deprecated_anvil), the map's own fallback must be one.
      const engineHasItem = ItemTypes.get(got) !== undefined;
      const mapped = itemForBlock(id);
      if (engineHasItem ? got !== mapped : mapped === undefined || ItemTypes.get(mapped) === undefined) wrong.push(`${id}: engine ${got}, map ${mapped}`);
    });
    log(`block items RESULT ${rows.join(" ")}`);
    test.assert(wrong.length === 0, `Block.getItemStack disagrees with the map: ${wrong.join("; ")}`);
  } finally {
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-2: 10 by class, nearest first, through onPhase("magnet")

class MemoryStore {
  readonly data = new Map<string, number | boolean>();
  get(key: string): unknown {
    return this.data.get(key);
  }
  set(key: string, value: number | boolean | undefined): void {
    if (value === undefined) this.data.delete(key);
    else this.data.set(key, value);
  }
}

registerAsync("andrew", "ufo_magnet_priority", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_magn_p", 0);
  const extras: Entity[] = [];
  try {
    assertClean(test, p);
    // Class 1: three ground items.
    const ground = [
      p.dim.spawnItem(new ItemStack("minecraft:iron_ingot", 2), middle(at(p, 2, 0))),
      p.dim.spawnItem(new ItemStack("minecraft:iron_nugget", 5), middle(at(p, 0, 4))),
      p.dim.spawnItem(new ItemStack("minecraft:shears", 1), middle(at(p, -6, 0))),
    ];
    // Class 2: one chest, four iron stacks and dirt.
    const chest = at(p, 0, -8);
    setBlock(p, chest, "minecraft:chest");
    const stacks: [string, number][] = [
      ["minecraft:iron_sword", 1],
      ["minecraft:bucket", 1],
      ["minecraft:raw_iron", 3],
      ["minecraft:iron_ingot", 4],
    ];
    const box = containerAt(p, chest);
    stacks.forEach(([id, n], k) => box.setItem(k, new ItemStack(id, n)));
    box.setItem(5, new ItemStack("minecraft:dirt", 3));
    // Class 3: two golems and a minecart, plus a farther minecart the cut leaves.
    const golemNear = spawnStill(p, "minecraft:iron_golem", at(p, 9, 0));
    const golemFar = spawnStill(p, "minecraft:iron_golem", at(p, 0, 11));
    const cart = p.dim.spawnEntity("minecraft:minecart", middle(at(p, -12, 2)));
    const cartFar = p.dim.spawnEntity("minecraft:minecart", middle(at(p, 12, 9)));
    extras.push(golemNear, golemFar, cart, cartFar);
    // Classes 4 and 5, nearer than every entity: priority, not distance, leaves them.
    const blocks = [at(p, 4, 4), at(p, -4, 4), at(p, 4, -4)];
    for (const b of blocks) setBlock(p, b, "minecraft:iron_block");
    const ores = [at(p, 2, 2, 0), at(p, -2, -2, -1)];
    for (const b of ores) setBlock(p, b, "minecraft:iron_ore");
    await test.idle(10);

    // The product core with a stand-in saucer: the pass runs inside onPhase("magnet").
    let sel: MagnetSelection | undefined;
    const ticks = { phase: -1, done: -1 };
    let payload = "";
    const magnet: Magnet = {
      onPhase(phase, pl) {
        if (phase !== "magnet") return;
        ticks.phase = system.currentTick;
        payload = `centre ${fmt(pl.centre)} hover ${pl.hoverY}`;
        sel = magnetOn(p.dim, pl.centre, pl.hoverY, host);
        ticks.done = system.currentTick;
      },
      magnetStep() {},
    };
    const saucer: Saucer = { onPhase() {}, saucerStep() {}, saucerPosition: () => ({ x: p.cx + 0.5, y: p.hoverY, z: p.cz + 0.5 }) };
    const target: UfoPlayer = { id: "gt-magnet-target", name: "magnet target", location: { x: p.cx + 0.5, y: p.top + 1, z: p.cz + 0.5 }, sendMessage() {} };
    const env: UfoEnv = {
      now: () => 1_790_000_000_000,
      durations: { arrival: 4, magnet: 20, departure: 4, downed: 4 },
      pauseMs: PAUSE_MS,
      firstMinMs: FIRST_MIN_MS,
      firstMaxMs: FIRST_MAX_MS,
      overworldPlayers: () => [target],
      random: () => 0.5,
      store: new MemoryStore(),
      ceiling: () => p.dim.heightRange.max,
      log: (msg) => console.warn(`[gametest] ${msg}`),
    };
    const core = new UfoCore(env, { scope: "gm", saucer, magnet });
    test.assert(core.command("come", target.id).ok, "come was refused");
    for (let t = 0; t < 40 && sel === undefined; t++) {
      core.tick();
      await test.idle(1);
    }
    core.command("stop");
    for (let t = 0; t < 4 && core.session() !== undefined; t++) core.tick();
    test.assert(sel !== undefined, "the magnet phase never started");
    const s = sel as MagnetSelection;
    log(`priority RESULT ${payload}; ${s.elements.length} elements [${describe(s)}] in ${s.ms} ms, onPhase tick ${ticks.phase}, done tick ${ticks.done}`);

    test.assert(ticks.phase === ticks.done, "the pass did not finish in the tick of onPhase(magnet)");
    test.assert(payload === `centre ${fmt(p.centre)} hover ${p.hoverY}`, `the core published ${payload}`);
    test.assert(s.elements.length === 10, `${s.elements.length} elements, expected 10`);
    const classes = s.elements.map((e) => e.cls).join("");
    test.assert(classes === "1112222333", `classes in order ${classes}, expected 1112222333`);
    for (const cls of [GROUND, STACK, HOLDER]) {
      const d = s.elements.filter((e) => e.cls === cls).map((e) => e.distance);
      test.assert(nonDecreasing(d), `class ${cls} is not nearest first: ${d.map((x) => x.toFixed(2)).join(" ")}`);
    }
    const ids = (cls: number): string => s.elements.filter((e) => e.cls === cls).map((e) => e.entity.id).join(" ");
    test.assert(ids(GROUND) === ground.map((e) => e.id).join(" "), `ground items ${ids(GROUND)}, expected ${ground.map((e) => e.id).join(" ")}`);
    test.assert(ids(HOLDER) === [golemNear, golemFar, cart].map((e) => e.id).join(" "), `holders ${ids(HOLDER)}; the far minecart ${cartFar.id} must be the one left`);
    const pulled = s.elements.filter((e) => e.cls === STACK).map((e) => `${e.from}*${stackOf(e.entity)?.amount}`);
    test.assert(pulled.join(" ") === stacks.map(([id, n]) => `${id}*${n}`).join(" "), `container stacks ${pulled.join(" ")}`);
    test.assert([0, 1, 2, 3].every((k) => box.getItem(k) === undefined), "a chest slot still holds its iron");
    test.assert(box.getItem(5)?.typeId === "minecraft:dirt" && box.getItem(5)?.amount === 3, "the chest's dirt changed");
    test.assert(blocks.every((b) => blockAt(p, b) === "minecraft:iron_block"), `a built block was touched: ${blocks.map((b) => blockAt(p, b)).join(" ")}`);
    test.assert(ores.every((b) => blockAt(p, b) === "minecraft:iron_ore"), `an ore was touched: ${ores.map((b) => blockAt(p, b)).join(" ")}`);
    test.assert(s.spawned.size === 4, `${s.spawned.size} item entities spawned, expected the 4 stacks`);
    test.assert(!cartFar.hasTag(IRON_TAG), "the minecart left out carries the held tag");
  } finally {
    clearItems(p);
    removeAll(extras);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ AC-2, second scenario: blocks fill what the item leaves, nearest first

registerAsync("andrew", "ufo_magnet_nearest_blocks", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_magn_n", 1);
  try {
    assertClean(test, p);
    const item = p.dim.spawnItem(new ItemStack("minecraft:iron_pickaxe", 1), middle(at(p, -1, -1)));
    // Twelve iron blocks at distinct distances: 3, 4, … 14 out along a turning ray.
    const blocks = Array.from({ length: 12 }, (_, i) => {
      const r = 3 + i;
      const a = (i * 2 * Math.PI) / 5;
      return at(p, Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a)));
    });
    for (const b of blocks) setBlock(p, b, "minecraft:iron_block");
    await test.idle(5);
    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    const byDistance = [...blocks].sort((a, b) => Math.hypot(a.x - p.cx, a.y - p.top, a.z - p.cz) - Math.hypot(b.x - p.cx, b.y - p.top, b.z - p.cz));
    const left = byDistance.slice(9);
    log(`nearest blocks RESULT [${describe(sel)}] in ${sel.ms} ms; left ${left.map((b) => blockAt(p, b)).join(" ")}`);
    test.assert(sel.elements.length === 10, `${sel.elements.length} elements, expected 10`);
    test.assert(sel.elements[0].entity.id === item.id && sel.elements[0].cls === GROUND, "the ground item is not first");
    test.assert(sel.elements.slice(1).every((e) => e.cls === BLOCK), "an element after the item is not a built block");
    test.assert(nonDecreasing(sel.elements.slice(1).map((e) => e.distance)), "the blocks were not taken nearest first");
    test.assert(byDistance.slice(0, 9).every((b) => blockAt(p, b) === "minecraft:air"), `a near block stayed: ${byDistance.slice(0, 9).map((b) => blockAt(p, b)).join(" ")}`);
    test.assert(left.every((b) => blockAt(p, b) === "minecraft:iron_block"), `a far block was pulled: ${left.map((b) => blockAt(p, b)).join(" ")}`);
  } finally {
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-3: only the iron comes out, of every container type

registerAsync("andrew", "ufo_magnet_containers", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_magn_c", 2);
  try {
    assertClean(test, p);
    const types = [
      "minecraft:chest",
      "minecraft:trapped_chest",
      "minecraft:barrel",
      "minecraft:hopper",
      "minecraft:furnace",
      "minecraft:blast_furnace",
      "minecraft:smoker",
      "minecraft:undyed_shulker_box",
      "minecraft:dispenser",
      "minecraft:dropper",
      "minecraft:brewing_stand",
    ];
    // Distinct distances, none adjacent: the ten nearest go in the first event, the rest in the second.
    const offsets: [number, number][] = [[3, -3], [-4, -3], [5, 2], [-2, 6], [7, -1], [-7, -3], [2, -8], [-5, 7], [9, 2], [-9, -3], [6, 9]];
    const rows = types.map((typeId, i) => ({ typeId, b: at(p, ...offsets[i]), amount: i + 1 }));
    const pairA = at(p, -11, 11);
    const pairB = at(p, -10, 11);
    setBlock(p, pairA, "minecraft:chest");
    setBlock(p, pairB, "minecraft:chest");
    for (const r of rows) setBlock(p, r.b, r.typeId);
    const crafter = at(p, 1, 1);
    setBlock(p, crafter, "minecraft:crafter");
    await test.idle(2);
    const seeded: string[] = [];
    for (const r of rows) {
      const c = containerAt(p, r.b);
      c.setItem(0, new ItemStack("minecraft:iron_ingot", r.amount));
      c.setItem(c.size - 1, new ItemStack("minecraft:dirt", 3));
      seeded.push(`${short(r.typeId)} size ${c.size} slot0 ${c.getItem(0)?.amount ?? 0} last ${c.getItem(c.size - 1)?.typeId ?? "refused"}`);
    }
    const pair = containerAt(p, pairA);
    test.assert(pair.size === 54, `the two chests did not pair (size ${pair.size})`);
    pair.setItem(27, new ItemStack("minecraft:iron_nugget", 12));
    pair.setItem(53, new ItemStack("minecraft:dirt", 3));
    const fromB = containerAt(p, pairB);
    const viewB = fromB.getItem(27)?.typeId === "minecraft:iron_nugget" ? "same order" : fromB.getItem(0)?.typeId === "minecraft:iron_nugget" ? "halves swapped" : "nugget not seen";
    p.dim.runCommand(`replaceitem block ${crafter.x} ${crafter.y} ${crafter.z} slot.container 0 iron_ingot 9`);
    log(`containers seeded: ${seeded.join("; ")}; double chest from the other half: ${viewB}`);
    for (const r of rows) {
      const c = containerAt(p, r.b);
      test.assert(c.getItem(0)?.amount === r.amount && c.getItem(c.size - 1)?.typeId === "minecraft:dirt", `seeding ${r.typeId} failed`);
    }
    const all = [...rows.map((r) => ({ key: r.typeId, halves: [r.b], amount: r.amount, id: "minecraft:iron_ingot" })), { key: "double chest", halves: [pairA, pairB], amount: 12, id: "minecraft:iron_nugget" }];
    const dist = (halves: Vector3[]): number => Math.min(...halves.map((q) => Math.hypot(q.x - p.cx, q.y - p.top, q.z - p.cz)));
    all.sort((a, b) => dist(a.halves) - dist(b.halves));

    const events: string[] = [];
    let taken = 0;
    for (const [n, expect] of [all.slice(0, 10), all.slice(10)].entries()) {
      const before = new Set(itemsIn(p).map((e) => e.id));
      const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
      const fresh = itemsIn(p).filter((e) => !before.has(e.id));
      events.push(`event ${n + 1}: [${describe(sel)}] ${sel.ms} ms`);
      test.assert(sel.elements.length === expect.length, `event ${n + 1}: ${sel.elements.length} elements, expected ${expect.length}`);
      test.assert(sel.elements.every((e) => e.cls === STACK), `event ${n + 1}: an element is not a container stack`);
      test.assert(fresh.length === expect.length, `event ${n + 1}: ${fresh.length} new item entities, expected ${expect.length}`);
      expect.forEach((x, i) => {
        const e = sel.elements[i];
        const s = stackOf(e.entity);
        test.assert(s?.typeId === x.id && s.amount === x.amount, `event ${n + 1} element ${i}: ${s?.typeId}*${s?.amount}, expected ${x.key}'s ${x.id}*${x.amount}`);
        test.assert(x.halves.some((h) => e.origin.x === h.x && e.origin.y === h.y && e.origin.z === h.z), `event ${n + 1} element ${i} came from ${fmt(e.origin)}, expected ${x.key} at ${x.halves.map(fmt).join(" or ")}`);
      });
      taken += sel.elements.length;
      // In the tick it spawned: a hopper under an item would take it back.
      clearItems(p);
    }
    log(`containers RESULT ${events.join("; ")}`);
    test.assert(taken === all.length, `${taken} stacks taken over two events, expected ${all.length}`);
    for (const r of rows) {
      test.assert(blockAt(p, r.b) === r.typeId, `${r.typeId} became ${blockAt(p, r.b)}`);
      const c = containerAt(p, r.b);
      const last = c.getItem(c.size - 1);
      test.assert(c.getItem(0) === undefined, `${r.typeId} still holds its iron`);
      test.assert(last?.typeId === "minecraft:dirt" && last.amount === 3, `${r.typeId}'s dirt changed`);
    }
    test.assert(blockAt(p, pairA) === "minecraft:chest" && blockAt(p, pairB) === "minecraft:chest", "a half of the double chest is gone");
    test.assert(pair.getItem(27) === undefined && fromB.getItem(27) === undefined && fromB.getItem(0) === undefined, "the double chest still holds its nugget");
    test.assert(pair.getItem(53)?.typeId === "minecraft:dirt", "the double chest's dirt changed");
    test.assert(blockAt(p, rows[3].b) === "minecraft:hopper", "the non-empty hopper is gone");

    // The crafter's iron is still inside: breaking it drops the nine ingots.
    p.dim.runCommand(`setblock ${crafter.x} ${crafter.y} ${crafter.z} air destroy`);
    await test.idle(3);
    const dropped = itemsIn(p).flatMap((e) => {
      const s = stackOf(e);
      return s?.typeId === "minecraft:iron_ingot" ? [s.amount] : [];
    });
    log(`crafter RESULT dropped iron ingots [${dropped.join(" ")}]`);
    test.assert(dropped.reduce((a, b) => a + b, 0) === 9, `breaking the crafter dropped [${dropped.join(" ")}] iron ingots, expected 9`);
  } finally {
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ AC-4: air and exactly one own item per block; the torch on top pops

registerAsync("andrew", "ufo_magnet_blocks", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_magn_b", 3);
  try {
    assertClean(test, p);
    const sources: { label: string; b: Vector3; item: string; cells: Vector3[] }[] = [
      { label: "iron_block", b: at(p, 3, 0), item: "minecraft:iron_block", cells: [] },
      { label: "iron_bars", b: at(p, -3, 0), item: "minecraft:iron_bars", cells: [] },
      { label: "rail", b: at(p, 0, 3), item: "minecraft:rail", cells: [] },
      { label: "anvil", b: at(p, 0, -3), item: "minecraft:anvil", cells: [] },
      { label: "cauldron", b: at(p, 5, 5), item: "minecraft:cauldron", cells: [] },
      { label: "iron_chain", b: at(p, -5, 5), item: "minecraft:iron_chain", cells: [] },
      { label: "lantern", b: at(p, 5, -5), item: "minecraft:lantern", cells: [] },
      { label: "iron_door", b: at(p, -5, -5), item: "minecraft:iron_door", cells: [] },
      { label: "empty hopper", b: at(p, 8, 0), item: "minecraft:hopper", cells: [] },
      { label: "iron_ore", b: at(p, 0, 8, 0), item: RAW_IRON, cells: [] },
    ];
    for (const s of sources) {
      s.cells.push(s.b);
      if (s.label === "iron_door") {
        placeDoor(p, s.b);
        s.cells.push({ ...s.b, y: s.b.y + 1 });
      } else setBlock(p, s.b, s.label === "empty hopper" ? "minecraft:hopper" : `minecraft:${s.label}`);
    }
    const torch = { ...sources[0].b, y: sources[0].b.y + 1 };
    p.dim.getBlock(torch)?.setPermutation(BlockPermutation.resolve("minecraft:torch", { torch_facing_direction: "top" }));
    await test.idle(5);
    test.assert(blockAt(p, torch) === "minecraft:torch", `the torch did not stay on the iron block (${blockAt(p, torch)})`);
    test.assert(sources[7].cells.every((c) => blockAt(p, c) === "minecraft:iron_door"), "the door is not two halves");

    const before = new Set(itemsIn(p).map((e) => e.id));
    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    const census = (): Map<string, number> => {
      const m = new Map<string, number>();
      for (const e of itemsIn(p)) {
        if (before.has(e.id)) continue;
        const s = stackOf(e);
        if (s !== undefined) m.set(s.typeId, (m.get(s.typeId) ?? 0) + s.amount);
      }
      return m;
    };
    const now = census();
    await test.idle(10);
    const later = census();
    const show = (m: Map<string, number>): string => [...m].map(([id, n]) => `${short(id)}*${n}`).join(" ");
    log(`blocks RESULT [${describe(sel)}] in ${sel.ms} ms; new items at once [${show(now)}], 10 ticks later [${show(later)}]; torch cell ${blockAt(p, torch)}`);

    test.assert(sel.elements.length === sources.length, `${sel.elements.length} elements, expected ${sources.length}`);
    test.assert(sel.elements.slice(0, 9).every((e) => e.cls === BLOCK) && sel.elements[9].cls === ORE, `classes ${sel.elements.map((e) => e.cls).join("")}`);
    for (const s of sources) {
      test.assert(s.cells.every((c) => blockAt(p, c) === "minecraft:air"), `${s.label} left ${s.cells.map((c) => blockAt(p, c)).join(" ")}`);
      const own = sel.elements.filter((e) => e.origin.x === s.b.x && e.origin.y === s.b.y && e.origin.z === s.b.z);
      const stack = own.length === 1 ? stackOf(own[0].entity) : undefined;
      test.assert(own.length === 1 && stack?.typeId === s.item && stack.amount === 1, `${s.label}: ${own.length} element(s), item ${stack?.typeId}*${stack?.amount}, expected one ${s.item}`);
    }
    const expected = new Map(sources.map((s) => [s.item, 1]));
    expected.set("minecraft:torch", 1);
    for (const [label, m] of [["at once", now], ["10 ticks later", later]] as const) {
      const extra = [...m].filter(([id, n]) => id !== "minecraft:torch" && expected.get(id) !== n);
      const missing = [...expected].filter(([id]) => id !== "minecraft:torch" && !m.has(id));
      test.assert(extra.length === 0 && missing.length === 0, `${label}: new items [${show(m)}] do not match one per source`);
    }
    test.assert(blockAt(p, torch) === "minecraft:air", `the torch did not pop (${blockAt(p, torch)})`);
    test.assert(later.get("minecraft:torch") === 1, `the torch dropped ${later.get("minecraft:torch") ?? 0} torch items, expected 1 (vanilla)`);
  } finally {
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-5: ore 20 below the centre, inside stone

/** L0-magn-asfl: elements fly at most this far per tick. */
const FLIGHT_SPEED = 1.5;

registerAsync("andrew", "ufo_magnet_deep_ore", async (test: Test): Promise<void> => {
  const p = await pad(test, "andrew_gt_magn_o", 4);
  try {
    assertClean(test, p);
    const ore = at(p, 3, -2, -20);
    test.assert(ore.y === p.zone.yMin, `the ore row ${ore.y} is not the zone floor ${p.zone.yMin}`);
    setBlock(p, ore, "minecraft:iron_ore");
    // Stone on every side of it, and a column of stone above to the pad's top.
    const around = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dz) => ({ x: ore.x + dx, y: ore.y + dy, z: ore.z + dz })))).filter((c) => c.x !== ore.x || c.y !== ore.y || c.z !== ore.z);
    test.assert(around.every((c) => blockAt(p, c) === "minecraft:stone"), "the ore is not enclosed in stone");
    await test.idle(2);
    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    test.assert(sel.elements.length === 1, `${sel.elements.length} elements: [${describe(sel)}]`);
    const el = sel.elements[0];
    const stack = stackOf(el.entity);
    test.assert(el.cls === ORE && stack?.typeId === RAW_IRON && stack.amount === 1, `the element is ${el.cls}:${stack?.typeId}*${stack?.amount}, expected one raw_iron from the ore`);
    test.assert(blockAt(p, ore) === "minecraft:air", `the ore cell is ${blockAt(p, ore)}`);
    const born = el.entity.location;
    test.assert(Math.floor(born.y) === ore.y, `the raw_iron was spawned at ${fmt(born)}, not in the ore cell`);

    // Out through the rock the way the hold step moves an element (U3).
    const slot = { x: p.cx + 0.5 + 5, y: p.hoverY - 3, z: p.cz + 0.5 };
    let t = 0;
    let surfaced = -1;
    for (; t < 80 && el.entity.isValid; t++) {
      const q = el.entity.location;
      const d = { x: slot.x - q.x, y: slot.y - q.y, z: slot.z - q.z };
      const len = Math.hypot(d.x, d.y, d.z);
      if (len < 0.5) break;
      const k = Math.min(FLIGHT_SPEED, len) / len;
      el.entity.teleport({ x: q.x + d.x * k, y: q.y + d.y * k, z: q.z + d.z * k });
      el.entity.clearVelocity();
      if (surfaced < 0 && el.entity.location.y > p.top + 1) surfaced = t;
      await test.idle(1);
    }
    const end = el.entity.isValid ? el.entity.location : undefined;
    const holes = around.filter((c) => blockAt(p, c) !== "minecraft:stone").length;
    const column: Vector3[] = [];
    for (let y = ore.y + 1; y <= p.top; y++) column.push({ x: ore.x, y, z: ore.z });
    const columnHoles = column.filter((c) => blockAt(p, c) !== "minecraft:stone").length;
    log(`deep ore RESULT [${describe(sel)}] in ${sel.ms} ms; raw_iron born ${fmt(born)}, above the stone after ${surfaced} ticks, at ${end === undefined ? "GONE" : fmt(end)} after ${t}; stone cells changed: ${holes} around, ${columnHoles} in the column`);
    test.assert(end !== undefined, "the raw_iron vanished on its way out");
    test.assert(surfaced >= 0, "the raw_iron never rose above the stone");
    test.assert(Math.hypot((end as Vector3).x - slot.x, (end as Vector3).y - slot.y, (end as Vector3).z - slot.z) <= 1, `the raw_iron stopped at ${fmt(end as Vector3)}, not within 1 of ${fmt(slot)}`);
    test.assert(holes === 0 && columnHoles === 0, `stone was changed: ${holes} around the ore, ${columnHoles} above it`);
  } finally {
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC-6: golems, minecarts and iron-wearing mobs; bare and sword zombies stay

/** Zombies roll random gear; every slot is set by hand. */
function dress(e: Entity, gear: Partial<Record<"head" | "chest" | "legs" | "feet" | "mainhand" | "offhand", string>>): void {
  const slots = { head: "slot.armor.head", chest: "slot.armor.chest", legs: "slot.armor.legs", feet: "slot.armor.feet", mainhand: "slot.weapon.mainhand", offhand: "slot.weapon.offhand" };
  for (const [name, slot] of Object.entries(slots)) {
    const item = gear[name as keyof typeof slots] ?? "air";
    e.runCommand(`replaceitem entity @s ${slot} 0 ${item}`);
  }
}

registerAsync("andrew", "ufo_magnet_holders", async (test: Test): Promise<void> => {
  const difficulty = world.getDifficulty();
  const time = world.getTimeOfDay();
  const p = await pad(test, "andrew_gt_magn_h", 5);
  const extras: Entity[] = [];
  try {
    assertClean(test, p);
    // A zombie is deleted on Peaceful, where the checks world runs; noon keeps others from spawning.
    world.setDifficulty(Difficulty.Easy);
    world.setTimeOfDay(6000);
    const golem = spawnStill(p, "minecraft:iron_golem", at(p, 12, 12));
    const cart = p.dim.spawnEntity("minecraft:minecart", middle(at(p, -12, 12)));
    const helmeted = spawnStill(p, "minecraft:zombie", at(p, -10, -10));
    const stand = p.dim.spawnEntity("minecraft:armor_stand", middle(at(p, 10, -10)));
    const bare = spawnStill(p, "minecraft:zombie", at(p, -10, -4));
    const sword = spawnStill(p, "minecraft:zombie", at(p, -4, -10));
    extras.push(golem, cart, helmeted, stand, bare, sword);
    await test.idle(2);
    dress(helmeted, { head: "iron_helmet" });
    dress(stand, { legs: "iron_leggings" });
    dress(bare, {});
    dress(sword, { mainhand: "iron_sword" });
    await test.idle(2);
    test.assert(extras.every((e) => e.isValid), "a mob is gone before the scan");
    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    const names = new Map([golem, cart, helmeted, stand, bare, sword].map((e, i) => [e.id, ["golem", "minecart", "helmet zombie", "leggings stand", "bare zombie", "sword zombie"][i]]));
    const chosen = sel.elements.map((e) => names.get(e.entity.id) ?? short(e.from));
    log(`holders RESULT [${chosen.join(", ")}] in ${sel.ms} ms; tagged now: ${[...names].filter(([id]) => extras.find((e) => e.id === id)?.hasTag(IRON_TAG)).map(([, n]) => n).join(", ")}${sel.failures.length > 0 ? `; failures ${sel.failures.join(" | ")}` : ""}`);
    test.assert(sel.elements.every((e) => e.cls === HOLDER), "an element is not a holder");
    test.assert([...chosen].sort().join() === ["golem", "minecart", "helmet zombie", "leggings stand"].sort().join(), `chosen [${chosen.join(", ")}]`);
    test.assert(!bare.hasTag(IRON_TAG) && !sword.hasTag(IRON_TAG), "a zombie without iron armour carries the held tag");
    test.assert(sel.failures.length === 0, `failures: ${sel.failures.join(" | ")}`);
  } finally {
    world.setDifficulty(difficulty);
    world.setTimeOfDay(time);
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    clearItems(p);
    p.unload();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ legendary weapons are pulled like iron, wherever they lie

registerAsync("andrew", "ufo_magnet_legendaries", async (test: Test): Promise<void> => {
  const owner = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 3 }, "magnet_owner");
  const p = await pad(test, "andrew_gt_magn_l", 6);
  const extras: Entity[] = [];
  try {
    assertClean(test, p);
    const mark = state.makeMark("admin", owner);
    const scythe = p.dim.spawnItem(state.markItem(SCYTHE_OF_CALAMITY, new ItemStack(SCYTHE_OF_CALAMITY.itemId, 1), mark), middle(at(p, 1, 0)));
    // Five iron ground items, farther than the Scythe; five types two blocks apart, so no two merge.
    const kinds = ["iron_ingot", "iron_nugget", "raw_iron", "iron_sword", "shears"];
    const iron = kinds.map((k, i) => p.dim.spawnItem(new ItemStack(`minecraft:${k}`, 1), middle(at(p, -4 - 2 * (i % 3), 4 + 2 * Math.floor(i / 3)))));
    // The hopper, holding the Cannon alone, is nearer than the chest.
    const hopper = at(p, 0, -6);
    setBlock(p, hopper, "minecraft:hopper");
    const chest = at(p, 0, -10);
    setBlock(p, chest, "minecraft:chest");
    containerAt(p, hopper).setItem(0, new ItemStack(ORBITAL_CANNON.itemId, 1));
    const box = containerAt(p, chest);
    box.setItem(0, new ItemStack(WEB_SWORD.itemId, 1));
    box.setItem(1, new ItemStack("minecraft:iron_ingot", 7));
    box.setItem(2, new ItemStack("minecraft:dirt", 3));
    await test.idle(10);
    const gen = world.getDynamicProperty(genLedgerKey(SCYTHE_OF_CALAMITY, mark.id));

    const sel = magnetOn(p.dim, p.centre, p.hoverY, host);
    log(`legendaries RESULT [${describe(sel)}] in ${sel.ms} ms; chest ${box.getItem(0)?.typeId ?? "empty"}/${box.getItem(1)?.typeId ?? "empty"}/${box.getItem(2)?.typeId ?? "empty"}; hopper ${blockAt(p, hopper)} holding ${containerAt(p, hopper).getItem(0)?.typeId ?? "nothing"}`);
    test.assert(sel.failures.length === 0, `failures: ${sel.failures.join(" | ")}`);
    test.assert(sel.elements.map((e) => e.cls).join("") === "111111222", `classes ${sel.elements.map((e) => e.cls).join("")}, expected 111111222`);
    test.assert(sel.elements[0].entity.id === scythe.id, `the nearest ground element is ${sel.elements[0].from}, not the Scythe`);
    test.assert(sel.elements.slice(1, 6).map((e) => e.entity.id).sort().join() === iron.map((e) => e.id).sort().join(), "the other five ground elements are not the five iron items");
    const stacks = sel.elements.slice(6).map((e) => stackOf(e.entity));
    test.assert(stacks.map((s) => s?.typeId).join(" ") === `${ORBITAL_CANNON.itemId} ${WEB_SWORD.itemId} minecraft:iron_ingot`, `the stacks are ${stacks.map((s) => s?.typeId).join(" ")}`);
    test.assert(stacks.slice(0, 2).every((s) => isLegendaryStack(s)), "an extracted weapon lost its type");
    test.assert(blockAt(p, hopper) === "minecraft:hopper" && containerAt(p, hopper).getItem(0) === undefined, "the hopper did not give up its Cannon, or left its place");
    test.assert(box.getItem(0) === undefined && box.getItem(1) === undefined, "the chest kept a weapon or its ingots");
    test.assert(box.getItem(2)?.typeId === "minecraft:dirt", "the chest lost its dirt");
    test.assert(stackOf(scythe)?.typeId === SCYTHE_OF_CALAMITY.itemId, "the Scythe's stack changed");
    test.assert(world.getDynamicProperty(genLedgerKey(SCYTHE_OF_CALAMITY, mark.id)) === gen, "the Scythe's ledger moved");

    // The holders: a chest minecart with a Web Sword, an iron-wearing stand
    // holding the Cannon, a bare stand holding the Katana, the same cart and
    // stand without a weapon and a plain minecart are taken; a bare stand
    // holding a stick is not.
    for (const e of sel.elements) if (e.entity.isValid && e.cls === STACK) e.entity.remove();
    removeAll(iron);
    if (scythe.isValid) scythe.remove();
    const loaded = p.dim.spawnEntity("minecraft:chest_minecart", middle(at(p, 6, 6)));
    const stand = p.dim.spawnEntity("minecraft:armor_stand", middle(at(p, -6, 6)));
    const katanaStand = p.dim.spawnEntity("minecraft:armor_stand", middle(at(p, 0, 8)));
    const bareStand = p.dim.spawnEntity("minecraft:armor_stand", middle(at(p, 0, -8)));
    const ironCart = p.dim.spawnEntity("minecraft:chest_minecart", middle(at(p, 6, -6)));
    const ironStand = p.dim.spawnEntity("minecraft:armor_stand", middle(at(p, -6, -6)));
    const plain = p.dim.spawnEntity("minecraft:minecart", middle(at(p, 8, -8)));
    extras.push(loaded, stand, katanaStand, bareStand, ironCart, ironStand, plain);
    await test.idle(2);
    loaded.getComponent("minecraft:inventory")?.container?.setItem(0, new ItemStack(WEB_SWORD.itemId, 1));
    loaded.getComponent("minecraft:inventory")?.container?.setItem(1, new ItemStack("minecraft:iron_ingot", 2));
    ironCart.getComponent("minecraft:inventory")?.container?.setItem(1, new ItemStack("minecraft:iron_ingot", 2));
    dress(stand, { head: "iron_helmet", mainhand: ORBITAL_CANNON.itemId });
    dress(katanaStand, { mainhand: DRAGON_KATANA.itemId });
    dress(bareStand, { mainhand: "minecraft:stick" });
    dress(ironStand, { head: "iron_helmet", mainhand: "minecraft:stick" });
    await test.idle(2);
    const second = magnetOn(p.dim, p.centre, p.hoverY, host);
    const want = [loaded, stand, katanaStand, ironCart, ironStand, plain].map((e) => e.id).sort().join(" ");
    const got = second.elements.map((e) => e.entity.id).sort().join(" ");
    log(`legendary holders RESULT [${describe(second)}]; chosen ${got}; expected ${want}; left: bare stand ${bareStand.id}`);
    test.assert(got === want, `chosen [${describe(second)}] (${got}), expected both carts, the plain minecart and the three dressed stands (${want})`);
    test.assert(second.failures.length === 0, `class 3 failures: ${second.failures.join(" | ")}`);
    test.assert(!bareStand.hasTag(IRON_TAG), "a stand holding a stick carries the held tag");
    test.assert(katanaStand.hasTag(IRON_TAG) && stand.hasTag(IRON_TAG), "a chosen weapon holder lacks the held tag");
  } finally {
    for (const e of extras) if (e.isValid) e.removeTag(IRON_TAG);
    removeAll(extras);
    clearItems(p);
    p.unload();
    if (owner.isValid) test.removeSimulatedPlayer(owner);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");
