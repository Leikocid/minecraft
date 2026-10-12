// spec v3 §3, ADR-uwbw-rc, C-16: whether the paper + string rocket can be a real Flight Duration 1 on BDS 1.26.51.1.
// The firework data is invisible to the stable 2.10.0 API (no component, tag or property carries it), so the only
// reliable signal is ItemStack.isStackableWith against vanilla references; the second one is the rocket entity's
// lifetime on an Elytra. Answers are the "[gametest] rocket-duration RESULT …" lines, recorded in
// docs/feedback/rocket-duration.md. The probe recipes (`data` 0–3) and loot tables live in packs/gametest. The release
// pack's copy of src/rocket-flight.ts never sees a SimulatedPlayer, so rocket_duration_swap arms its own for its length.

import {
  BlockPermutation,
  type Container,
  EquipmentSlot,
  GameMode,
  ItemStack,
  ItemTypes,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { convertBareRockets, registerRocketFlight } from "../rocket-flight";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const ROCKET = "minecraft:firework_rocket";
const ROCKET_ENTITY = "minecraft:fireworks_rocket";
const AIR = "minecraft:air";
const PAPER = "minecraft:paper";
const STRING = "minecraft:string";
const GUNPOWDER = "minecraft:gunpowder";
const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const CHEST: Vector3 = { x: 5, y: 2, z: 1 };
const GROUND_RADIUS = 8;
const GLIDES = 4;

const log = (msg: string): void => console.warn(`[gametest] rocket-duration ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const span = (xs: number[]): string => (xs.length === 0 ? "-" : `${Math.min(...xs)}–${Math.max(...xs)}`);

type Grid = ReadonlyArray<string | undefined>;
/** Row-major, nine slots; the product recipe sits at index 4 over 7. */
const SHIPPED: Grid = [undefined, undefined, undefined, undefined, PAPER, undefined, undefined, STRING, undefined];
/** Vanilla is shapeless and counts gunpowder by slot: one slot holding N gunpowder still spends one, so N slots. */
const vanilla = (flight: number): Grid => [PAPER, ...Array<string>(flight).fill(GUNPOWDER), ...Array<undefined>(8 - flight).fill(undefined)];
/** RCPE-VNLA-01's reference grid: one slot loaded with N gunpowder. */
const oneSlot = (gunpowder: number): Grid => [PAPER, `${GUNPOWDER} ${gunpowder}`, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
/** Data 0 is the control: the same probe shape with no `data` field must craft. */
const DATA_GRIDS: ReadonlyArray<readonly [number, Grid]> = [
  [0, [undefined, PAPER, undefined, undefined, STRING, undefined, undefined, "minecraft:gravel", undefined]],
  [1, [undefined, PAPER, undefined, undefined, STRING, undefined, undefined, "minecraft:dirt", undefined]],
  [2, [undefined, PAPER, undefined, undefined, STRING, undefined, undefined, "minecraft:cobblestone", undefined]],
  [3, [undefined, PAPER, undefined, undefined, STRING, undefined, undefined, "minecraft:sand", undefined]],
];
/** Names a fireworks item component would plausibly carry; 2.10.0 declares none of them. */
const COMPONENT_GUESSES = [
  "minecraft:fireworks",
  "minecraft:firework",
  "minecraft:firework_rocket",
  "minecraft:fireworks_rocket",
  "minecraft:flight_duration",
  "fireworks",
];

function inventoryOf(p: Player): Container {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${p.name} has no inventory`);
  return c;
}

function rocketSlots(c: Container): number[] {
  const out: number[] = [];
  for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === ROCKET) out.push(i);
  return out;
}

const rocketCount = (c: Container): number => rocketSlots(c).reduce((n, i) => n + (c.getItem(i)?.amount ?? 0), 0);

function clearInventory(p: Player): void {
  const c = inventoryOf(p);
  for (let i = 0; i < c.size; i++) c.setItem(i, undefined);
}

function clearGround(test: Test): void {
  for (const e of test.getDimension().getEntities({ type: "minecraft:item", location: test.worldLocation(STAND), maxDistance: GROUND_RADIUS })) if (e.isValid) e.remove();
}

function chestOf(test: Test): Container {
  const c = test.getBlock(CHEST).getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error("the probe chest has no container");
  return c;
}

async function waitFor(test: Test, ticks: number, done: () => boolean): Promise<boolean> {
  for (let t = 0; t < ticks; t++) {
    if (done()) return true;
    await test.idle(1);
  }
  return done();
}

function setUp(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
  test.setBlockType("minecraft:chest", CHEST);
}

async function survivor(test: Test, name: string): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(STAND, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  return p;
}

function run(test: Test, cmd: string): string {
  try {
    return `ok ${test.getDimension().runCommand(cmd).successCount}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

/** One Crafter craft of `grid`, waited for until the player's rocket count grows. */
async function craftInto(test: Test, p: Player, grid: Grid): Promise<boolean> {
  const at = test.worldBlockLocation(CRAFTER);
  for (const [slot, cell] of grid.entries()) {
    const [id, n] = (cell ?? AIR).split(" ");
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${id} ${n ?? 1}`;
    test.assert(test.getDimension().runCommand(cmd).successCount > 0, `${cmd} failed`);
  }
  const c = inventoryOf(p);
  const before = rocketCount(c);
  test.pulseRedstone(POWER, 2);
  const arrived = await waitFor(test, 60, () => rocketCount(c) > before);
  await test.idle(5);
  return arrived;
}

/** Crafts `grid` once into an emptied inventory; the first rocket stack that arrives, or why none did. */
async function craftOne(test: Test, p: Player, grid: Grid): Promise<{ stack?: ItemStack; note: string }> {
  clearInventory(p);
  clearGround(test);
  await test.idle(2);
  const arrived = await craftInto(test, p, grid);
  const c = inventoryOf(p);
  const slots = rocketSlots(c);
  if (!arrived || slots.length === 0) return { note: "nothing crafted" };
  return { stack: c.getItem(slots[0]), note: `${rocketCount(c)} rockets in ${slots.length} stack(s)` };
}

interface Refs {
  f1: ItemStack;
  f2: ItemStack;
  f3: ItemStack;
  give: ItemStack;
  plain: ItemStack;
}

async function references(test: Test, p: Player): Promise<Refs> {
  const got: ItemStack[] = [];
  for (const flight of [1, 2, 3]) {
    const r = await craftOne(test, p, vanilla(flight));
    log(`RESULT reference vanilla paper+${flight} gunpowder: ${r.note}`);
    test.assert(r.stack !== undefined, `the vanilla flight-${flight} recipe crafted nothing`);
    got.push(r.stack as ItemStack);
  }
  clearInventory(p);
  test.assert(run(test, `give "${p.name}" ${ROCKET} 3`) === "ok 1", "/give firework_rocket failed");
  await test.idle(2);
  const give = inventoryOf(p).getItem(rocketSlots(inventoryOf(p))[0] ?? 0);
  test.assert(give?.typeId === ROCKET, "/give put no rocket in the inventory");
  return { f1: got[0], f2: got[1], f3: got[2], give: give as ItemStack, plain: new ItemStack(ROCKET, 3) };
}

function stackRow(refs: Refs, s: ItemStack): string {
  const cell = (name: string, r: ItemStack): string => `${name}${s.isStackableWith(r) ? "=S" : "=."}`;
  return [cell("f1", refs.f1), cell("f2", refs.f2), cell("f3", refs.f3), cell("give", refs.give), cell("plain", refs.plain)].join(" ");
}

function describe(s: ItemStack): string {
  const guesses = COMPONENT_GUESSES.map((id) => {
    try {
      return `${id}:${s.getComponent(id) === undefined ? "none" : "PRESENT"}`;
    } catch (err) {
      return `${id}:threw ${errText(err)}`;
    }
  });
  return (
    `amount ${s.amount}/${s.maxAmount} stackable ${s.isStackable} components [${s.getComponents().map((x) => x.typeId).join(",")}] tags [${s.getTags().join(",")}] ` +
    `lore [${s.getLore().join(",")}] props [${s.getDynamicPropertyIds().join(",")}] guesses ${guesses.join(" ")}`
  );
}

/** Tries `make` and logs its stack against the references; a stack that stacks with flight 1 comes back. */
async function measure(refs: Refs, path: string, label: string, make: () => Promise<ItemStack | string> | ItemStack | string): Promise<ItemStack | undefined> {
  let got: ItemStack | string;
  try {
    got = await make();
  } catch (err) {
    got = `threw ${errText(err)}`;
  }
  if (typeof got === "string") {
    log(`RESULT ${path} ${label}: no stack (${got})`);
    return undefined;
  }
  log(`RESULT ${path} ${label}: ${got.typeId} ×${got.amount}; ${stackRow(refs, got)}`);
  return got.isStackableWith(refs.f1) ? got : undefined;
}

/** Every route the four paths offer to a stack; the ones that stack with flight 1. */
async function allPaths(test: Test, p: SimulatedPlayer, refs: Refs): Promise<Map<string, ItemStack>> {
  const flightOne = new Map<string, ItemStack>();
  const keep = (label: string, s: ItemStack | undefined): void => {
    if (s !== undefined) flightOne.set(label, s);
  };
  const chest = chestOf(test);
  const at = test.worldBlockLocation(CHEST);
  const manager = world.getLootTableManager();

  // Path 1: the recipe result's `data` field.
  for (const [data, grid] of DATA_GRIDS) {
    const r = await craftOne(test, p, grid);
    if (data === 0) test.assert(r.stack !== undefined, "control: the probe shape without a data field crafted nothing");
    keep(`recipe data ${data}`, await measure(refs, "path1", `recipe result ${data === 0 ? "without data (control)" : `data ${data}`} (${r.note})`, () => r.stack ?? r.note));
  }

  // Path 2: stacks a script builds or copies.
  keep("new ItemStack", await measure(refs, "path2", "new ItemStack(id, 3)", () => new ItemStack(ROCKET, 3)));
  keep("ItemTypes", await measure(refs, "path2", "new ItemStack(ItemTypes.get(id), 3)", () => {
    const t = ItemTypes.get(ROCKET);
    return t === undefined ? "ItemTypes.get returned undefined" : new ItemStack(t, 3);
  }));
  keep("clone /give", await measure(refs, "path2", "clone() of the /give stack, amount 3", () => {
    const s = refs.give.clone();
    s.amount = 3;
    return s;
  }));
  keep("clone flight 1", await measure(refs, "path2", "clone() of a vanilla flight-1 craft, amount 7", () => {
    const s = refs.f1.clone();
    s.amount = 7;
    return s;
  }));
  keep("chest round trip", await measure(refs, "path2", "/give clone written by setItem into a chest and read back", () => {
    chest.setItem(0, refs.give.clone());
    return chest.getItem(0) ?? "the chest slot read empty";
  }));
  chest.clearAll();
  keep("replaceitem block", await measure(refs, "path2", "/replaceitem block chest slot.container 0 firework_rocket 3", () => {
    const res = run(test, `replaceitem block ${at.x} ${at.y} ${at.z} slot.container 0 ${ROCKET} 3`);
    return chest.getItem(0) ?? `the chest slot read empty (${res})`;
  }));
  chest.clearAll();
  clearInventory(p);
  keep("replaceitem entity", await measure(refs, "path2", "/replaceitem entity player slot.hotbar 8 firework_rocket 3", () => {
    const res = run(test, `replaceitem entity "${p.name}" slot.hotbar 8 ${ROCKET} 3`);
    return inventoryOf(p).getItem(8) ?? `the hotbar slot read empty (${res})`;
  }));
  clearInventory(p);
  keep("player.runCommand replaceitem", await measure(refs, "path2", `player.runCommand("replaceitem entity @s slot.inventory 4 …") as a ${String(p.playerPermissionLevel)}-level player, command level ${String(p.commandPermissionLevel)}`, () => {
    let res: string;
    try {
      res = `ok ${p.runCommand(`replaceitem entity @s slot.inventory 4 ${ROCKET} 3`).successCount}`;
    } catch (err) {
      res = `threw ${errText(err)}`;
    }
    return inventoryOf(p).getItem(9 + 4) ?? `the inventory slot read empty (${res})`;
  }));
  for (const [name, s] of [["flight 1", refs.f1], ["flight 3", refs.f3], ["/give", refs.give], ["new ItemStack", refs.plain]] as const) {
    log(`RESULT path2 what a script sees on ${name}: ${describe(s)}`);
  }

  // Path 3: loot tables.
  for (const table of ["probe_rocket/plain", "probe_rocket/data1"]) {
    keep(`loot ${table} generate`, await measure(refs, "path3", `generateLootFromTable(${table})`, () => {
      const t = manager.getLootTable(table);
      if (t === undefined) return "getLootTable returned undefined";
      const out = manager.generateLootFromTable(t) ?? [];
      return out[0] ?? `generated ${out.length} stacks`;
    }));
  }
  clearInventory(p);
  await test.idle(1);
  keep("loot give", await measure(refs, "path3", "/loot give player loot probe_rocket/plain", async () => {
    const res = run(test, `loot give "${p.name}" loot "probe_rocket/plain"`);
    await test.idle(2);
    const c = inventoryOf(p);
    return c.getItem(rocketSlots(c)[0] ?? 0) ?? `no rocket in the inventory (${res})`;
  }));
  keep("loot replace block", await measure(refs, "path3", "/loot replace block chest slot.container 0 loot probe_rocket/plain", () => {
    const res = run(test, `loot replace block ${at.x} ${at.y} ${at.z} slot.container 0 loot "probe_rocket/plain"`);
    return chest.getItem(0) ?? `the chest slot read empty (${res})`;
  }));
  chest.clearAll();
  return flightOne;
}

registerAsync("andrew", "rocket_duration_paths", async (test: Test): Promise<void> => {
  setUp(test);
  const p = await survivor(test, "rd_paths");
  try {
    await test.idle(3);
    const refs = await references(test, p);
    log(`RESULT references against each other: f1 [${stackRow(refs, refs.f1)}] f2 [${stackRow(refs, refs.f2)}] f3 [${stackRow(refs, refs.f3)}] give [${stackRow(refs, refs.give)}] plain [${stackRow(refs, refs.plain)}]`);
    test.assert(refs.f1.isStackableWith(refs.give) && !refs.f1.isStackableWith(refs.f2) && !refs.f2.isStackableWith(refs.f3) && !refs.f1.isStackableWith(refs.plain), "control: the references do not tell the flights apart");

    const shipped = await craftOne(test, p, SHIPPED);
    log(`RESULT shipped recipe paper over string: ${shipped.note}; ${shipped.stack === undefined ? "-" : stackRow(refs, shipped.stack)}`);
    for (const n of [2, 3]) {
      const r = await craftOne(test, p, oneSlot(n));
      log(`RESULT RCPE-VNLA-01 reference grid, one slot of ${n} gunpowder: ${r.note}; ${r.stack === undefined ? "-" : stackRow(refs, r.stack)}`);
    }

    const flightOne = await allPaths(test, p, refs);
    log(`RESULT routes to a stack of flight 1: [${[...flightOne.keys()].join(", ") || "none"}]`);
  } finally {
    clearGround(test);
    test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1500)
  .tag("andrew");

// ------------------------------------------------ path 4 and the thrust in ticks

/** Glides from 60 up over a loaded strip, fires the rocket in slot 0, and times the rocket entity it attaches. */
async function glideOnce(test: Test, p: SimulatedPlayer, s: ItemStack): Promise<{ lifetime: number | string; peak: number; above: number }> {
  const start: Vector3 = { x: 3.5, y: 60, z: 2.5 };
  clearInventory(p);
  const st = s.clone();
  st.amount = 1;
  inventoryOf(p).setItem(0, st);
  p.selectedSlotIndex = 0;
  p.teleport(test.worldLocation(start), { rotation: { x: 0, y: 0 } });
  p.lookAtLocation({ x: start.x, y: start.y - 6, z: start.z + 60 }, LookDuration.Continuous);
  await test.idle(4);
  p.glide();
  await test.idle(10);
  let rocket: string | undefined;
  let born = 0;
  let gone: number | undefined;
  const spawnSub = world.afterEvents.entitySpawn.subscribe((ev) => {
    if (rocket === undefined && ev.entity.isValid && ev.entity.typeId === ROCKET_ENTITY) {
      rocket = ev.entity.id;
      born = system.currentTick;
    }
  });
  const rmSub = world.afterEvents.entityRemove.subscribe((ev) => {
    if (ev.removedEntityId === rocket && gone === undefined) gone = system.currentTick - born;
  });
  const speeds: number[] = [];
  try {
    p.useItemInSlot(0);
    for (let dt = 0; dt < 70 && gone === undefined; dt++) {
      await test.idle(1);
      const v = p.getVelocity();
      speeds.push(Math.hypot(v.x, v.y, v.z));
    }
  } finally {
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    world.afterEvents.entityRemove.unsubscribe(rmSub);
  }
  p.stopGliding();
  return { lifetime: gone ?? (rocket === undefined ? "no rocket" : "alive at +70"), peak: Math.max(0, ...speeds), above: speeds.filter((x) => x > 1.6).length };
}

/** Rocket stacks in the inventory as `amount@slot`, each tagged with the reference it stacks with. */
function stacksOf(c: Container, refs: Refs): string {
  const tag = (x: ItemStack): string => (x.isStackableWith(refs.f1) ? "f1" : x.isStackableWith(refs.f2) ? "f2" : x.isStackableWith(refs.f3) ? "f3" : x.isStackableWith(refs.plain) ? "bare" : "other");
  return rocketSlots(c).map((i) => `${(c.getItem(i) as ItemStack).amount}@${i}:${tag(c.getItem(i) as ItemStack)}`).join(" ") || "none";
}

registerAsync("andrew", "rocket_duration_swap", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  setUp(test);
  const p = await survivor(test, "rd_swap");
  let disarm: (() => void) | undefined;
  let unload: (() => void) | undefined;
  try {
    await test.idle(3);
    const refs = await references(test, p);
    const shipped = await craftOne(test, p, SHIPPED);
    const raw = shipped.stack as ItemStack;
    test.assert(raw !== undefined, "the shipped recipe crafted nothing");
    log(`RESULT path4 shipped recipe, src/rocket-flight.ts not armed: ${shipped.note}; ${stackRow(refs, raw)}`);
    test.assert(raw.isStackableWith(refs.plain) && !raw.isStackableWith(refs.f1), "negative control: the shipped recipe already gives flight 1 without the swap");

    disarm = registerRocketFlight();
    const c = inventoryOf(p);
    clearInventory(p);
    clearGround(test);
    for (let k = 0; k < 2; k++) await craftInto(test, p, SHIPPED);
    const twice = stacksOf(c, refs);
    log(`RESULT path4 shipped recipe ×2, armed: ${rocketCount(c)} rockets, stacks ${twice}`);
    test.assert(twice === "6@0:f1", `two crafts of the shipped recipe did not become one stack of 6 flight-1 rockets: ${twice}`);

    clearInventory(p);
    const held = refs.f1.clone();
    held.amount = 5;
    c.setItem(3, held);
    await test.idle(2);
    await craftInto(test, p, SHIPPED);
    const merged = stacksOf(c, refs);
    log(`RESULT path4 shipped recipe onto 5 vanilla flight-1 rockets in slot 3, armed: stacks ${merged}`);
    test.assert(merged === "8@3:f1", `the crafted rockets did not join the held flight-1 stack: ${merged}`);

    const old: string[] = [];
    for (const flight of [1, 2, 3]) {
      const r = await craftOne(test, p, vanilla(flight));
      old.push(`flight ${flight}: ${r.note}, stacks ${stacksOf(c, refs)}`);
      test.assert(stacksOf(c, refs) === `3@0:f${flight}`, `armed: the vanilla flight-${flight} recipe no longer gives 3 flight-${flight} rockets: ${stacksOf(c, refs)}`);
    }
    log(`RESULT old recipes with src/rocket-flight.ts armed: ${old.join("; ")}`);

    clearInventory(p);
    c.setItem(5, new ItemStack(ROCKET, 4));
    await test.idle(3);
    log(`RESULT a bare new ItemStack ×4 put into slot 5, armed: stacks ${stacksOf(c, refs)}`);
    test.assert(stacksOf(c, refs) === "4@5:f1", `a data-less rocket put by a script was not converted: ${stacksOf(c, refs)}`);
    clearInventory(p);
    test.assert(convertBareRockets(p) === 0, "convertBareRockets converted something in an empty inventory");

    clearInventory(p);
    await craftInto(test, p, SHIPPED);
    const swapped = c.getItem(rocketSlots(c)[0] ?? 0) as ItemStack;
    disarm();
    disarm = undefined;

    const kinds: Array<readonly [string, ItemStack]> = [
      ["shipped recipe, not armed", raw],
      ["shipped recipe, armed", swapped],
      ["vanilla flight 1", refs.f1],
      ["vanilla flight 2", refs.f2],
      ["vanilla flight 3", refs.f3],
    ];
    const w0 = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
    unload = await loadBox(test, dim, "andrew_gt_rocket_glide", { min: [w0.x - 24, 0, w0.z - 8], max: [w0.x + 24, 0, w0.z + 120] });
    await test.idle(20);
    p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Chest, new ItemStack("minecraft:elytra"));
    const lifetimes = new Map<string, number[]>();
    for (let g = 0; g < GLIDES; g++) {
      for (const [label, s] of kinds) {
        const r = await glideOnce(test, p, s);
        log(`RESULT glide ${label} #${g + 1}: rocket lifetime ${r.lifetime} ticks; peak ${f2(r.peak)} b/t; above 1.60 for ${r.above} ticks`);
        if (typeof r.lifetime === "number") lifetimes.set(label, [...(lifetimes.get(label) ?? []), r.lifetime]);
        await test.idle(5);
      }
    }
    const of = (label: string): number[] => lifetimes.get(label) ?? [];
    log(`RESULT thrust in ticks on an Elytra (${GLIDES} each): ${kinds.map(([label]) => `${label} ${span(of(label))} [${of(label).join(",")}]`).join("; ")}`);
    test.assert(of("vanilla flight 3").length === GLIDES && of("shipped recipe, armed").length === GLIDES, "control: a glide timed no rocket");
    test.assert(Math.max(...of("vanilla flight 1")) < Math.min(...of("vanilla flight 3")), "control: flight 1 and flight 3 thrust overlap");
    test.assert(Math.min(...of("shipped recipe, armed")) > Math.max(...of("shipped recipe, not armed")), "the armed recipe rocket does not outlast the bare one");
    test.assert(Math.max(...of("shipped recipe, armed")) < Math.min(...of("vanilla flight 2")), "the armed recipe rocket thrusts as long as flight 2");
  } finally {
    disarm?.();
    unload?.();
    for (const e of dim.getEntities({ type: ROCKET_ENTITY, location: test.worldLocation({ x: 3, y: 30, z: 30 }), maxDistance: 150 })) e.remove();
    clearGround(test);
    test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");
