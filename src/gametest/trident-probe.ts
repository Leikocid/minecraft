// TRDT-PROBE-01 probes on BDS 1.26.51.1 (L0-trdt-cons P1–P10): the engine
// numbers the Above-Water Trident stands on, measured before any trident code
// exists. A scenario passes when its measurement completed and its controls
// behaved; the answers are the "[probe] TRDT Pn RESULT …" lines, recorded in
// docs/feedback/probe-trident.md. The probe items, the token recipe and the two
// custody stand-in entities live in packs/gametest (andrew:probe_trident_*).

import {
  BlockPermutation,
  BlockVolume,
  type Container,
  Difficulty,
  type Dimension,
  EffectTypes,
  EnchantmentType,
  type Entity,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  InputButton,
  ItemStack,
  type Player,
  type Vector3,
  WeatherType,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import type { Box } from "../structures/clear";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const TRIDENT = "minecraft:trident";
const VANILLA_THROWN = "minecraft:thrown_trident";
const CHARGE = "andrew:probe_trident_charge";
const PLAIN = "andrew:probe_trident_plain";
const TOKEN = "andrew:probe_trident_token";
const THROWN = "andrew:probe_trident_thrown";
const RETURN = "andrew:probe_trident_return";
/** THROWN on the thrown_trident and arrow runtimes, for P10 only. */
const THROWN_TR = "andrew:probe_trident_thrown_tr";
const THROWN_AR = "andrew:probe_trident_thrown_ar";
/** The custody key L0-trdt-ecus puts on both custody entities. */
const THROW_PROP = "andrew:tr.throw";
/** Facing +x. */
const EAST = -90;

const log = (msg: string): void => console.warn(`[probe] TRDT ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const f3 = (n: number): string => n.toFixed(3);
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const v3 = (v: Vector3): string => `${f3(v.x)},${f3(v.y)},${f3(v.z)}`;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vector3, k: number): Vector3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const hlen = (v: Vector3): number => Math.hypot(v.x, v.z);
const short = (id: string): string => id.replace("minecraft:", "").replace("andrew:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? Number.NaN : s.length % 2 === 1 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Minecraft's view vector for a pitch/yaw in degrees. */
function viewOf(pitch: number, yaw: number): Vector3 {
  const p = (pitch * Math.PI) / 180;
  const y = (yaw * Math.PI) / 180;
  return { x: -Math.sin(y) * Math.cos(p), y: -Math.sin(p), z: Math.cos(y) * Math.cos(p) };
}

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(a, b), block);
}

/** fillBlocks refuses a volume over 32768 cells, so wide boxes go in x-slabs. */
function fillSlabs(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  const per = Math.max(1, Math.floor(32768 / ((b.y - a.y + 1) * (b.z - a.z + 1))));
  for (let x = a.x; x <= b.x; x += per) fill(dim, { x, y: a.y, z: a.z }, { x: Math.min(b.x, x + per - 1), y: b.y, z: b.z }, block);
}

function inventory(p: Player): Container {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${p.name} has no inventory`);
  return c;
}

function countIn(c: Container, typeId: string): number {
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === typeId) n += s.amount;
  }
  return n;
}

function itemsNear(dim: Dimension, at: Vector3, radius: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of dim.getEntities({ type: "minecraft:item", location: at, maxDistance: radius })) {
    const s = e.getComponent("minecraft:item")?.itemStack;
    if (s !== undefined) out.set(s.typeId, (out.get(s.typeId) ?? 0) + s.amount);
  }
  return out;
}

const showCounts = (m: Map<string, number>): string => [...m].map(([k, n]) => `${short(k)}×${n}`).join(" ") || "none";

function enchanted(id: string, enchants: Array<[string, number]>): { stack: ItemStack; note: string } {
  const stack = new ItemStack(id);
  const notes: string[] = [];
  const ench = stack.getComponent("minecraft:enchantable");
  for (const [type, level] of enchants) {
    const e = { type: new EnchantmentType(type), level };
    if (ench === undefined) {
      notes.push(`${type}: no enchantable component`);
      continue;
    }
    const can = ench.canAddEnchantment(e);
    try {
      ench.addEnchantment(e);
      notes.push(`${type} ${level}: canAdd=${can}, added (reads ${ench.getEnchantment(type)?.level ?? "none"})`);
    } catch (err) {
      notes.push(`${type} ${level}: canAdd=${can}, addEnchantment threw ${errText(err)}`);
    }
  }
  return { stack, note: notes.join("; ") || "plain" };
}

function hp(e: Entity): number {
  return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
}

/** A Survival SimulatedPlayer; `boost` gives 40 HP, `immune` Resistance V. */
async function survivor(test: Test, rel: Vector3, name: string, opts: { boost?: boolean; immune?: boolean } = {}): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  if (opts.boost === true) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  if (opts.immune === true) p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

/** Put a player at `at` (world) facing pitch/yaw; settleAim checks the head followed. */
function aim(p: SimulatedPlayer, at: Vector3, pitch: number, yaw: number): void {
  p.teleport(at, { rotation: { x: pitch, y: yaw } });
  p.setRotation({ x: pitch, y: yaw });
}

/** A teleport's pitch does not reach a SimulatedPlayer's head; lookAtLocation (test-relative) does. */
async function settleAim(test: Test, aims: Array<{ p: SimulatedPlayer; pitch: number; yaw: number }>): Promise<string[]> {
  await test.idle(2);
  const how = aims.map((a) => {
    const want = viewOf(a.pitch, a.yaw);
    if (len(sub(a.p.getViewDirection(), want)) <= 0.02) return "rotation";
    a.p.lookAtLocation(add(test.relativeLocation(a.p.getHeadLocation()), mul(want, 50)), LookDuration.Instant);
    return "lookAt";
  });
  await test.idle(2);
  return aims.map((a, i) => `${how[i]} view ${v3(a.p.getViewDirection())} (want ${v3(viewOf(a.pitch, a.yaw))})`);
}

interface Sample {
  pos: Vector3;
  vel: Vector3;
  ground: boolean;
  water: boolean;
}

function sampleOf(e: Entity): Sample {
  return { pos: { ...e.location }, vel: e.getVelocity(), ground: e.isOnGround, water: e.isInWater };
}

interface FlightShape {
  /** Displacement over the first tick after the action. */
  d1: Vector3;
  peak: number;
  /** Ticks from the action to the first resting ground contact after being airborne. */
  landT?: number;
  landH?: number;
  /** Horizontal distance where the path comes back down through the start height. */
  crossH?: number;
  restH: number;
  airborne: boolean;
}

function shape(s: Sample[]): FlightShape {
  const s0 = s[0].pos;
  const d1 = s.length > 1 ? sub(s[1].pos, s0) : { x: 0, y: 0, z: 0 };
  let peak = 0;
  let peakAt = 0;
  for (let i = 0; i < s.length; i++) {
    const h = s[i].pos.y - s0.y;
    if (h > peak) {
      peak = h;
      peakAt = i;
    }
  }
  const firstAir = s.findIndex((x, i) => i > 0 && (x.pos.y - s0.y > 0.1 || !x.ground));
  let landT: number | undefined;
  if (firstAir > 0) {
    for (let i = firstAir + 2; i < s.length; i++) {
      if (s[i].ground && Math.abs(s[i].pos.y - s[i - 1].pos.y) < 0.001) {
        landT = i;
        break;
      }
    }
  }
  let crossH: number | undefined;
  for (let i = Math.max(1, peakAt); i < s.length; i++) {
    const a = s[i - 1].pos;
    const b = s[i].pos;
    if (peak > 0.2 && a.y - s0.y > 0 && b.y - s0.y <= 0) {
      const k = (a.y - s0.y) / (a.y - b.y);
      crossH = hlen(sub(add(a, mul(sub(b, a), k)), s0));
      break;
    }
  }
  return {
    d1,
    peak,
    landT,
    landH: landT === undefined ? undefined : hlen(sub(s[landT].pos, s0)),
    crossH,
    restH: hlen(sub(s[s.length - 1].pos, s0)),
    airborne: firstAir > 0,
  };
}

const showShape = (f: FlightShape): string =>
  `first tick d=(${v3(f.d1)}) |h|=${f3(hlen(f.d1))} y=${f3(f.d1.y)}; peak +${f2(f.peak)}; ` +
  `back through start height at ${f.crossH === undefined ? "-" : f2(f.crossH)}; landed ${f.landT === undefined ? "-" : `+${f.landT} t at ${f2(f.landH ?? 0)}`}; ` +
  `after the window ${f2(f.restH)} from the start`;

async function follow(test: Test, entities: Entity[], ticks: number): Promise<Sample[][]> {
  const out = entities.map((e) => [sampleOf(e)]);
  for (let t = 0; t < ticks; t++) {
    await test.idle(1);
    entities.forEach((e, i) => {
      if (e.isValid) out[i].push(sampleOf(e));
    });
  }
  return out;
}

/** A stone floor at test-relative y=1 over a far, loaded box; the cleanup clears `height` layers from the floor up. */
async function farPad(test: Test, area: string, origin: Vector3, size: { x: number; z: number }, height: number): Promise<() => void> {
  const dim = test.getDimension();
  const box: Box = { min: [origin.x - 4, 0, origin.z - 4], max: [origin.x + size.x + 4, 0, origin.z + size.z + 4] };
  const unload = await loadBox(test, dim, area, box);
  const lo = { x: origin.x - 2, y: origin.y, z: origin.z - 2 };
  const hi = { x: origin.x + size.x + 2, y: origin.y + height, z: origin.z + size.z + 2 };
  // Two layers: a water hole cut into the top one still has a floor (the platform hangs over air).
  fillSlabs(dim, { x: lo.x, y: lo.y - 1, z: lo.z }, { x: hi.x, y: lo.y, z: hi.z }, "minecraft:stone");
  return () => {
    try {
      for (const e of dim.getEntities({ location: { x: origin.x + size.x / 2, y: origin.y, z: origin.z + size.z / 2 }, maxDistance: size.x + size.z + 16 })) {
        if (e.typeId !== "minecraft:player" && e.isValid) e.remove();
      }
      fillSlabs(dim, { x: lo.x, y: lo.y - 1, z: lo.z }, hi, "minecraft:air");
    } catch (err) {
      log(`cleanup of ${area} threw ${errText(err)}`);
    }
    unload();
  };
}

// ------------------------------------------------ P1: does a token recipe hand the empty buckets back (xasm33, adrf)

const CRAFTER = { x: 3, y: 2, z: 4 };
const POWER = { x: 2, y: 2, z: 4 };
const STAND = { x: 3, y: 2, z: 5 };

// The shipped recipe transposed: the GameTest pack loads beside it, and of two identical grids the engine
// crafts one (tests/recipe-collisions.test.mjs).
const TOKEN_GRID: Array<string | undefined> = [
  undefined, "minecraft:water_bucket", undefined,
  "minecraft:golden_apple", TRIDENT, "minecraft:golden_apple",
  undefined, "minecraft:water_bucket", undefined,
];
const MILK_GRID: Array<string | undefined> = TOKEN_GRID.map((id) => (id === "minecraft:water_bucket" ? "minecraft:milk_bucket" : id));
const CAKE_GRID: Array<string | undefined> = [
  "minecraft:milk_bucket", "minecraft:milk_bucket", "minecraft:milk_bucket",
  "minecraft:sugar", "minecraft:egg", "minecraft:sugar",
  "minecraft:wheat", "minecraft:wheat", "minecraft:wheat",
];

registerAsync("andrew", "probe_trident_buckets", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const crafter = BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" });
  const p = await survivor(test, STAND, "trdt_crafter");
  const centre = test.worldLocation({ x: 3.5, y: 2, z: 4.5 });
  const crafterAt = test.worldBlockLocation(CRAFTER);
  const cases: Array<{ label: string; layout: Array<string | undefined>; full: boolean; result: string }> = [
    { label: "token recipe, free inventory", layout: TOKEN_GRID, full: false, result: TOKEN },
    { label: "token recipe, full inventory", layout: TOKEN_GRID, full: true, result: TOKEN },
    { label: "same token recipe with milk buckets (control), free inventory", layout: MILK_GRID, full: false, result: TOKEN },
    { label: "vanilla cake (control), free inventory", layout: CAKE_GRID, full: false, result: "minecraft:cake" },
  ];
  const clearGround = (): void => {
    for (const e of dim.getEntities({ type: "minecraft:item", location: centre, maxDistance: 10 })) e.remove();
  };
  let tokenCrafted = 0;
  let readable = "?";
  for (const c of cases) {
    clearGround();
    test.setBlockPermutation(crafter, CRAFTER);
    const inv = inventory(p);
    inv.clearAll();
    if (c.full) for (let i = 0; i < inv.size; i++) inv.setItem(i, new ItemStack("minecraft:dirt", 64));
    p.teleport(test.worldLocation({ x: STAND.x + 0.5, y: STAND.y, z: STAND.z + 0.5 }));
    c.layout.forEach((id, slot) => {
      const cmd = `replaceitem block ${crafterAt.x} ${crafterAt.y} ${crafterAt.z} slot.container ${slot} ${id ?? "minecraft:air"} 1`;
      test.assert(dim.runCommand(cmd).successCount > 0 || id === undefined, `${cmd} failed`);
    });
    await test.idle(2);
    readable = test.getBlock(CRAFTER).getComponent("minecraft:inventory") === undefined ? "no" : "yes";
    test.pulseRedstone(POWER, 2);
    await test.idle(40);
    const ground = itemsNear(dim, centre, 10);
    const held = (id: string): number => countIn(inventory(p), id);
    const results = held(c.result) + (ground.get(c.result) ?? 0);
    if (c.layout === TOKEN_GRID) tokenCrafted += results;
    // Script cannot read a crafter's slots: what stayed in the grid is what spills when it breaks.
    clearGround();
    p.teleport(test.worldLocation({ x: 0.5, y: 2, z: 0.5 }));
    await test.idle(2);
    test.destroyBlock(CRAFTER, true);
    await test.idle(10);
    const spilled = itemsNear(dim, centre, 4);
    spilled.delete("minecraft:crafter");
    log(
      `P1 RESULT ${c.label}: crafted ${short(c.result)} ${results} (player ${held(c.result)}, ground ${ground.get(c.result) ?? 0}); ` +
        `empty buckets: player ${held("minecraft:bucket")}, ground ${ground.get("minecraft:bucket") ?? 0}; ` +
        `filled buckets: water player ${held("minecraft:water_bucket")} ground ${ground.get("minecraft:water_bucket") ?? 0}, milk player ${held("minecraft:milk_bucket")} ground ${ground.get("minecraft:milk_bucket") ?? 0}; ` +
        `left in the crafter grid (spilled on break): ${showCounts(spilled)}; all ground items after the craft: ${showCounts(ground)}`
    );
    clearGround();
  }
  log(`P1 RESULT the crafter's inventory component is readable from script: ${readable}`);
  test.assert(tokenCrafted > 0, "control: the crafter never made the probe token — the recipe did not run, so nothing above says anything about buckets");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ P2: vanilla trident melee, armour, Impaling on the custom item (xasm34)

interface HurtRead {
  victim: string;
  cause: string;
  before: number;
  after?: number;
  attacker: string;
  projectile: string;
}

/** Records every hurt on `ids`, before and after armour events; `cancel` ids never take the damage. */
function hurtLog(ids: () => Map<string, string>, cancel: () => Set<string>): { reads: HurtRead[]; stop: () => void } {
  const reads: HurtRead[] = [];
  const b = world.beforeEvents.entityHurt.subscribe((e) => {
    const name = ids().get(e.hurtEntity.id);
    if (name === undefined) return;
    reads.push({
      victim: name,
      cause: e.damageSource.cause,
      before: e.damage,
      attacker: e.damageSource.damagingEntity?.typeId ?? "none",
      projectile: e.damageSource.damagingProjectile?.typeId ?? "none",
    });
    if (cancel().has(e.hurtEntity.id)) e.cancel = true;
  });
  const a = world.afterEvents.entityHurt.subscribe((e) => {
    const name = ids().get(e.hurtEntity.id);
    if (name === undefined) return;
    const open = [...reads].reverse().find((r) => r.victim === name && r.after === undefined);
    if (open !== undefined) open.after = e.damage;
  });
  return {
    reads,
    stop: () => {
      world.beforeEvents.entityHurt.unsubscribe(b);
      world.afterEvents.entityHurt.unsubscribe(a);
    },
  };
}

const showHurts = (rs: HurtRead[]): string =>
  rs.length === 0 ? "no hurt" : rs.map((r) => `${r.cause} ${f2(r.before)}${r.after === undefined ? " (no after-event)" : ` after ${f2(r.after)}`}`).join(" + ");

function weapons(): Array<{ label: string; make: () => { stack: ItemStack; note: string } }> {
  return [
    { label: "diamond_sword (control)", make: () => enchanted("minecraft:diamond_sword", []) },
    { label: "trident", make: () => enchanted(TRIDENT, []) },
    { label: "trident Impaling V", make: () => enchanted(TRIDENT, [["impaling", 5]]) },
    { label: "probe custom item (damage 8, slot spear)", make: () => enchanted(CHARGE, []) },
    { label: "probe custom item Impaling V", make: () => enchanted(CHARGE, [["impaling", 5]]) },
  ];
}

const DIAMOND_KIT: Array<[EquipmentSlot, string]> = [
  [EquipmentSlot.Head, "minecraft:diamond_helmet"],
  [EquipmentSlot.Chest, "minecraft:diamond_chestplate"],
  [EquipmentSlot.Legs, "minecraft:diamond_leggings"],
  [EquipmentSlot.Feet, "minecraft:diamond_boots"],
];

const WET_PLAYER = { x: 5, y: 2, z: 3 };
const WET_DROWNED = { x: 1, y: 2, z: 5 };
const DRY_DROWNED = { x: 3, y: 2, z: 5 };

registerAsync("andrew", "probe_trident_melee", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // Wet cells: a source on the floor walled in on four sides (the platform hangs over air, so no holes).
  for (const w of [WET_PLAYER, WET_DROWNED]) {
    for (const d of [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }]) test.setBlockType("minecraft:stone", { x: w.x + d.x, y: w.y, z: w.z + d.z });
    test.setBlockType("minecraft:water", w);
  }
  const under = test.getBlock({ x: WET_PLAYER.x, y: 0, z: WET_PLAYER.z }).typeId;
  const names = new Map<string, string>();
  const cancelled = new Set<string>();
  const hurts = hurtLog(() => names, () => cancelled);
  const difficulty = world.getDifficulty();
  const players: SimulatedPlayer[] = [];
  const mobs: Entity[] = [];
  try {
    const attacker = await survivor(test, { x: 3, y: 2, z: 0 }, "trdt_melee_a");
    players.push(attacker);
    const targets: Array<{ label: string; cell: Vector3; p: SimulatedPlayer }> = [];
    for (const [label, cell, kit] of [
      ["bare, dry", { x: 1, y: 2, z: 3 }, []],
      ["diamond armour, dry", { x: 3, y: 2, z: 3 }, DIAMOND_KIT],
      ["bare, standing in water", WET_PLAYER, []],
    ] as Array<[string, Vector3, Array<[EquipmentSlot, string]>]>) {
      const p = await survivor(test, cell, `trdt_melee_${targets.length}`, { boost: true });
      for (const [slot, id] of kit) p.getComponent("minecraft:equippable")?.setEquipment(slot, new ItemStack(id));
      players.push(p);
      names.set(p.id, label);
      targets.push({ label, cell, p });
    }
    await test.idle(5);
    const armour = targets.map((t) => `${t.label}: armor ${t.p.getComponent("minecraft:equippable")?.totalArmor ?? "?"} toughness ${t.p.getComponent("minecraft:equippable")?.totalToughness ?? "?"} inWater ${t.p.isInWater}`);
    log(`P2 SETUP block under the platform ${under}; ${armour.join("; ")}`);
    const rows: string[] = [];
    for (const w of weapons()) {
      const made = w.make();
      const cells: string[] = [];
      for (const t of targets) {
        const per: string[] = [];
        for (let k = 0; k < 2; k++) {
          t.p.teleport(test.worldLocation({ x: t.cell.x + 0.5, y: t.cell.y, z: t.cell.z + 0.5 }));
          t.p.getComponent("minecraft:health")?.resetToMaxValue();
          attacker.teleport(test.worldLocation({ x: t.cell.x + 0.5, y: 2, z: t.cell.z - 1.5 }), { rotation: { x: 10, y: 0 } });
          attacker.setItem(made.stack.clone(), 0, true);
          await test.idle(2);
          const from = hurts.reads.length;
          const swung = attacker.attackEntity(t.p);
          await test.idle(14);
          per.push(`${swung ? "" : "(attackEntity false) "}${showHurts(hurts.reads.slice(from).filter((r) => r.victim === t.label))}`);
        }
        cells.push(`${t.label}: ${per.join(" | ")}`);
      }
      rows.push(`${w.label} [${made.note}] -> ${cells.join("; ")}`);
      log(`P2 RESULT melee ${rows[rows.length - 1]}`);
    }

    // The drowned: aquatic for Java's Impaling, in water for Bedrock's. Damage is recorded, then cancelled.
    for (const t of targets) if (t.p.isValid) test.removeSimulatedPlayer(t.p);
    world.setDifficulty(Difficulty.Easy);
    const wet = test.spawnWithoutBehaviors("minecraft:drowned", WET_DROWNED);
    const dry = test.spawnWithoutBehaviors("minecraft:drowned", DRY_DROWNED);
    mobs.push(wet, dry);
    for (const m of mobs) m.addEffect("fire_resistance", 2000, { showParticles: false });
    names.set(wet.id, "drowned in water");
    names.set(dry.id, "drowned dry");
    cancelled.add(wet.id);
    cancelled.add(dry.id);
    await test.idle(5);
    log(`P2 SETUP drowned in water: inWater ${wet.isInWater} hp ${f2(hp(wet))}; drowned dry: inWater ${dry.isInWater} hp ${f2(hp(dry))}`);
    for (const w of weapons().slice(1)) {
      const made = w.make();
      const cells: string[] = [];
      for (const [mob, cell] of [
        [wet, WET_DROWNED],
        [dry, DRY_DROWNED],
      ] as Array<[Entity, Vector3]>) {
        const per: string[] = [];
        for (let k = 0; k < 2; k++) {
          attacker.teleport(test.worldLocation({ x: cell.x + 0.5, y: 2, z: cell.z - 1.5 }), { rotation: { x: 10, y: 0 } });
          attacker.setItem(made.stack.clone(), 0, true);
          await test.idle(2);
          const from = hurts.reads.length;
          const swung = attacker.attackEntity(mob);
          await test.idle(14);
          per.push(`${swung ? "" : "(attackEntity false) "}${showHurts(hurts.reads.slice(from).filter((r) => r.victim === names.get(mob.id)))}`);
        }
        cells.push(`${names.get(mob.id)}: ${per.join(" | ")}`);
      }
      log(`P2 RESULT melee on drowned ${w.label} [${made.note}] -> ${cells.join("; ")}`);
    }
    const sword = hurts.reads.find((r) => r.victim === "bare, dry");
    test.assert(sword !== undefined && sword.before > 0, "control: the diamond sword landed no hurt on the bare target — the attacker does not reach");
  } finally {
    hurts.stop();
    world.setDifficulty(difficulty);
    for (const m of mobs) if (m.isValid) m.remove();
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ P2 thrown, P7 flight, P10 damage source of a script-shot projectile

const THROW_FIELD = { x: 2400, y: 1, z: 0 };

/** Every VANILLA_THROWN spawned while the watch is on, with its owner. */
function thrownWatch(): { got: Array<{ e: Entity; tick: number; owner: string }>; stop: () => void } {
  const got: Array<{ e: Entity; tick: number; owner: string }> = [];
  const s = world.afterEvents.entitySpawn.subscribe((ev) => {
    if (ev.entity.typeId !== VANILLA_THROWN) return;
    got.push({ e: ev.entity, tick: system.currentTick, owner: ev.entity.getComponent("minecraft:projectile")?.owner?.id ?? "none" });
  });
  return { got, stop: () => world.afterEvents.entitySpawn.unsubscribe(s) };
}

/** setItem with selectSlot turns a SimulatedPlayer's head back to its body: give first, aim after. */
function giveTrident(p: SimulatedPlayer): void {
  p.setItem(new ItemStack(TRIDENT), 0, true);
}

async function chargeAndRelease(test: Test, p: SimulatedPlayer, hold: number): Promise<boolean> {
  let ok = p.useItemInSlot(0);
  if (!ok) {
    await test.idle(2);
    ok = p.useItemInSlot(0);
  }
  await test.idle(hold);
  p.stopUsingItem();
  return ok;
}

function projectileFields(e: Entity): string {
  const c = e.getComponent("minecraft:projectile");
  return c === undefined
    ? "no projectile component"
    : `gravity=${c.gravity} airInertia=${c.airInertia} liquidInertia=${c.liquidInertia} stopOnHit=${c.stopOnHit} bounce=${c.shouldBounceOnHit} lightningStrikeOnHit=${c.lightningStrikeOnHit}`;
}

/** Per-tick drag and gravity from a free-flight path: v[t+1] = (v[t] - g·ŷ)·d and the alternative v[t+1] = v[t]·d - g. */
function fitFlight(path: Vector3[]): string {
  const v: Vector3[] = [];
  for (let i = 1; i < path.length; i++) v.push(sub(path[i], path[i - 1]));
  const drags: number[] = [];
  const gAfter: number[] = [];
  const gBefore: number[] = [];
  for (let i = 0; i + 1 < v.length && i < 10; i++) {
    const h0 = hlen(v[i]);
    const h1 = hlen(v[i + 1]);
    if (h0 < 0.05 || h1 > h0 * 1.01) break;
    const d = h1 / h0;
    drags.push(d);
    gAfter.push(v[i].y * d - v[i + 1].y);
    gBefore.push(v[i].y - v[i + 1].y / d);
  }
  return (
    `speed per tick ${v.slice(0, 6).map((x) => f3(len(x))).join("/")}; drag ${drags.map(f3).join("/")} (median ${f3(median(drags))}); ` +
    `gravity if applied after drag ${f3(median(gAfter))}, before drag ${f3(median(gBefore))} (n=${drags.length})`
  );
}

registerAsync("andrew", "probe_trident_throw", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation(THROW_FIELD);
  const cleanup = await farPad(test, "andrew_gt_trdt_throw", origin, { x: 140, z: 16 }, 0);
  const watch = thrownWatch();
  const names = new Map<string, string>();
  const hurts = hurtLog(() => names, () => new Set());
  const hitEvents: string[] = [];
  const hitSub = world.afterEvents.projectileHitEntity.subscribe((e) => {
    hitEvents.push(`${short(e.projectile.typeId)} source=${e.source?.typeId ?? "none"} hit ${names.get(e.getEntityHit().entity?.id ?? "") ?? e.getEntityHit().entity?.typeId ?? "?"}`);
  });
  const players: SimulatedPlayer[] = [];
  const rel = (x: number, y: number, z: number): Vector3 => ({ x: THROW_FIELD.x + x, y: THROW_FIELD.y + y, z: THROW_FIELD.z + z });
  try {
    const thrower = await survivor(test, rel(0, 1, 2), "trdt_thrower", { immune: true });
    players.push(thrower);

    // P7: two free flights over the pad.
    const vanillaPaths: Array<{ pitch: number; path: Vector3[]; v1: Vector3; at0: Vector3 }> = [];
    for (const pitch of [0, -30]) {
      giveTrident(thrower);
      await test.idle(2);
      aim(thrower, test.worldLocation(rel(0.5, 1, 2.5)), pitch, EAST);
      const aimed = await settleAim(test, [{ p: thrower, pitch, yaw: EAST }]);
      log(`P7 SETUP pitch ${pitch}: ${aimed[0]}`);
      const from = watch.got.length;
      const ok = await chargeAndRelease(test, thrower, 20);
      const view = thrower.getViewDirection();
      await test.idle(1);
      const spawned = watch.got[from];
      if (spawned === undefined) {
        log(`P7 RESULT vanilla throw pitch ${pitch}: useItemInSlot=${ok}, no ${VANILLA_THROWN} spawned`);
        continue;
      }
      const e = spawned.e;
      const fields = projectileFields(e);
      const [s] = await follow(test, [e], 70);
      const path = s.map((x) => x.pos);
      const shapeOf = shape(s);
      log(
        `P7 RESULT vanilla thrown_trident pitch ${pitch}, view at the release ${v3(view)}: useItemInSlot=${ok}, owner is the thrower ${spawned.owner === thrower.id}; ` +
          `component ${fields}; first sample at ${v2(sub(path[0], thrower.getHeadLocation()))} from the head, velocity read ${v3(s[0].vel)}; ${fitFlight(path)}; ` +
          `stopped ${f2(hlen(sub(path[path.length - 1], path[0])))} out, ${f2(path[path.length - 1].y - path[0].y)} vertical; ${showShape(shapeOf)}`
      );
      vanillaPaths.push({ pitch, path, v1: sub(path[1], path[0]), at0: path[0] });
      if (e.isValid) e.remove();
    }

    // P7b: the custom projectile shot by script with the vanilla first-tick velocity, from the same point.
    for (const vp of vanillaPaths) {
      const e = dim.spawnEntity(THROWN, vp.at0);
      const fields = projectileFields(e);
      e.getComponent("minecraft:projectile")?.shoot(vp.v1, { uncertainty: 0 });
      const [s] = await follow(test, [e], 70);
      const path = s.map((x) => x.pos);
      const diffs = [1, 3, 5, 10, 15, 20].map((t) => (path[t] !== undefined && vp.path[t] !== undefined ? `+${t}:${f2(len(sub(path[t], vp.path[t])))}` : `+${t}:-`));
      log(`P7 RESULT ${short(THROWN)} pitch ${vp.pitch} shot with the vanilla first-tick velocity ${v3(vp.v1)}: component ${fields}; ${fitFlight(path)}; distance from the vanilla path ${diffs.join(" ")}`);
      if (e.isValid) e.remove();
    }

    // P2 thrown + P10: hits on targets 6 blocks out.
    const targets: Array<{ label: string; p: SimulatedPlayer; at: Vector3 }> = [];
    for (const [label, z, kit] of [
      ["bare", 8, []],
      ["diamond armour", 12, DIAMOND_KIT],
    ] as Array<[string, number, Array<[EquipmentSlot, string]>]>) {
      const at = rel(7, 1, z);
      const p = await survivor(test, at, `trdt_tgt_${label.replace(" ", "_")}`, { boost: true });
      for (const [slot, id] of kit) p.getComponent("minecraft:equippable")?.setEquipment(slot, new ItemStack(id));
      players.push(p);
      names.set(p.id, label);
      targets.push({ label, p, at });
    }
    names.set(thrower.id, "thrower");
    await test.idle(3);
    for (const t of targets) {
      const per: string[] = [];
      for (let k = 0; k < 2; k++) {
        t.p.teleport(test.worldLocation({ x: t.at.x + 0.5, y: t.at.y, z: t.at.z + 0.5 }));
        t.p.getComponent("minecraft:health")?.resetToMaxValue();
        giveTrident(thrower);
        thrower.teleport(test.worldLocation({ x: THROW_FIELD.x + 1.5, y: THROW_FIELD.y + 1, z: t.at.z + 0.5 }), { rotation: { x: 0, y: EAST } });
        await test.idle(2);
        thrower.lookAtEntity(t.p);
        const from = hurts.reads.length;
        const hits = hitEvents.length;
        await chargeAndRelease(test, thrower, 20);
        await test.idle(20);
        const mine = hurts.reads.slice(from).filter((r) => r.victim === t.label);
        per.push(`${showHurts(mine)} [attacker ${mine[0]?.attacker ?? "-"} projectile ${mine[0]?.projectile ?? "-"}; hit events ${hitEvents.slice(hits).join(", ") || "none"}]`);
        for (const e of dim.getEntities({ type: VANILLA_THROWN, location: test.worldLocation(rel(4, 1, 8)), maxDistance: 30 })) e.remove();
      }
      log(`P2 RESULT thrown vanilla trident at ${t.label} 6 blocks out: ${per.join(" | ")}`);
    }

    // P10: the custom projectile with the thrower as owner, shot at the bare target, on three runtimes.
    const bare = targets[0];
    const speed = vanillaPaths.length > 0 ? len(vanillaPaths[0].v1) : 2.5;
    for (const type of [THROWN, THROWN_TR, THROWN_AR]) {
      const per: string[] = [];
      for (let k = 0; k < 2; k++) {
        bare.p.teleport(test.worldLocation({ x: bare.at.x + 0.5, y: bare.at.y, z: bare.at.z + 0.5 }));
        bare.p.getComponent("minecraft:health")?.resetToMaxValue();
        thrower.teleport(test.worldLocation({ x: THROW_FIELD.x + 1.5, y: THROW_FIELD.y + 1, z: bare.at.z + 0.5 }), { rotation: { x: 0, y: EAST } });
        await test.idle(12);
        const head = thrower.getHeadLocation();
        const aimAt = add(bare.p.location, { x: 0, y: 1.0, z: 0 });
        const dir = mul(sub(aimAt, head), 1 / len(sub(aimAt, head)));
        let e: Entity;
        try {
          e = dim.spawnEntity(type, add(head, dir));
        } catch (err) {
          per.push(`spawn threw ${errText(err)}`);
          break;
        }
        const proj = e.getComponent("minecraft:projectile");
        if (proj !== undefined) proj.owner = thrower;
        const from = hurts.reads.length;
        const hits = hitEvents.length;
        proj?.shoot(mul(dir, speed), { uncertainty: 0 });
        await test.idle(20);
        const mine = hurts.reads.slice(from).filter((r) => r.victim === "bare");
        per.push(
          `${showHurts(mine)} [attacker ${mine[0]?.attacker ?? "-"} projectile ${mine[0]?.projectile ?? "-"}; hit events ${hitEvents.slice(hits).join(", ") || "none"}; ` +
            `projectile after: ${e.isValid ? `valid at ${v2(sub(e.location, bare.p.location))} from the target, velocity ${v3(e.getVelocity())}` : "removed"}]`
        );
        if (e.isValid) e.remove();
      }
      for (const it of dim.getEntities({ type: "minecraft:item", location: test.worldLocation(rel(7, 1, 8)), maxDistance: 20 })) it.remove();
      log(`P10 RESULT ${short(type)} (impact_damage 8, components as ${short(THROWN)}) owner=thrower at speed ${f3(speed)} b/t: ${per.join(" | ")}`);
    }
    test.assert(vanillaPaths.length > 0, "control: the simulated player never threw a vanilla trident");
  } finally {
    watch.stop();
    hurts.stop();
    world.afterEvents.projectileHitEntity.unsubscribe(hitSub);
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

// ------------------------------------------------ P3: itemReleaseUse on a custom item with a charge, and isSneaking at release

registerAsync("andrew", "probe_trident_release", async (test: Test): Promise<void> => {
  const p = await survivor(test, { x: 3, y: 2, z: 3 }, "trdt_release");
  const events: Array<{ tick: number; text: string }> = [];
  const mine = (src: Player): boolean => src.id === p.id;
  const sneakState = (src: Player): string => {
    try {
      return `isSneaking=${src.isSneaking} button=${src.inputInfo.getButtonState(InputButton.Sneak)}`;
    } catch (err) {
      return `isSneaking=${src.isSneaking} button threw ${errText(err)}`;
    }
  };
  const start = world.afterEvents.itemStartUse.subscribe((e) => {
    if (mine(e.source)) events.push({ tick: system.currentTick, text: `start(${short(e.itemStack.typeId)} dur=${e.useDuration})` });
  });
  const release = world.afterEvents.itemReleaseUse.subscribe((e) => {
    if (mine(e.source)) events.push({ tick: system.currentTick, text: `release(${short(e.itemStack?.typeId ?? "none")} dur=${e.useDuration} ${sneakState(e.source)})` });
  });
  const stop = world.afterEvents.itemStopUse.subscribe((e) => {
    if (mine(e.source)) events.push({ tick: system.currentTick, text: `stop(${short(e.itemStack?.typeId ?? "none")} dur=${e.useDuration} ${sneakState(e.source)})` });
  });
  const complete = world.afterEvents.itemCompleteUse.subscribe((e) => {
    if (mine(e.source)) events.push({ tick: system.currentTick, text: `complete(${short(e.itemStack.typeId)} dur=${e.useDuration})` });
  });
  const use = world.afterEvents.itemUse.subscribe((e) => {
    if (mine(e.source)) events.push({ tick: system.currentTick, text: `use(${short(e.itemStack.typeId)})` });
  });
  type Sneak = "no" | "held" | "dropped with the release";
  const cases: Array<{ label: string; item: string; hold: number; sneak: Sneak }> = [
    { label: "charge item (spear), hold 20, standing", item: CHARGE, hold: 20, sneak: "no" },
    { label: "charge item, hold 20, sneaking through the release", item: CHARGE, hold: 20, sneak: "held" },
    { label: "charge item, hold 20, sneak dropped in the same script turn as the release", item: CHARGE, hold: 20, sneak: "dropped with the release" },
    { label: "charge item, hold 5", item: CHARGE, hold: 5, sneak: "no" },
    { label: "charge item, hold 40", item: CHARGE, hold: 40, sneak: "no" },
    { label: "plain item (use_modifiers only), hold 20", item: PLAIN, hold: 20, sneak: "no" },
    { label: "vanilla trident (control), hold 20, sneaking", item: TRIDENT, hold: 20, sneak: "held" },
  ];
  let customReleases = 0;
  let controlReleases = 0;
  try {
    let input = "?";
    try {
      input = `lastInputModeUsed=${p.inputInfo.lastInputModeUsed} touchOnlyAffectsHotbar=${p.inputInfo.touchOnlyAffectsHotbar} platformType=${p.clientSystemInfo.platformType}`;
    } catch (err) {
      input = `threw ${errText(err)}`;
    }
    log(`P3 RESULT what the server reads about the simulated player's input: ${input}`);
    for (const c of cases) {
      p.teleport(test.worldLocation({ x: 3.5, y: 2, z: 3.5 }), { rotation: { x: 0, y: EAST } });
      p.setItem(new ItemStack(c.item), 0, true);
      await test.idle(3);
      if (c.sneak !== "no") p.isSneaking = true;
      await test.idle(3);
      const sneakBefore = sneakState(p);
      const from = events.length;
      const t0 = system.currentTick;
      let ok = p.useItemInSlot(0);
      let retried = false;
      if (!ok) {
        await test.idle(2);
        ok = p.useItemInSlot(0);
        retried = true;
      }
      const t1 = system.currentTick;
      await test.idle(c.hold);
      const released = p.stopUsingItem();
      if (c.sneak === "dropped with the release") p.isSneaking = false;
      const tr = system.currentTick;
      await test.idle(4);
      p.isSneaking = false;
      const seen = events.slice(from).map((e) => `${e.text}@+${e.tick - t0}`);
      if (c.item !== TRIDENT && seen.some((s) => s.startsWith("release("))) customReleases++;
      if (c.item === TRIDENT && seen.some((s) => s.startsWith("release("))) controlReleases++;
      log(
        `P3 RESULT ${c.label}: before the press ${sneakBefore}; useItemInSlot=${ok}${retried ? " (second try)" : ""} at +${t1 - t0}, stopUsingItem at +${tr - t0} -> ${released?.typeId ?? "undefined"}; ` +
          `events [${seen.join(" ")}]`
      );
      for (const e of test.getDimension().getEntities({ type: VANILLA_THROWN, location: p.location, maxDistance: 40 })) e.remove();
      await test.idle(5);
    }
    test.assert(controlReleases > 0, "control: the vanilla trident raised no itemReleaseUse — the instrument cannot see releases");
    log(`P3 RESULT summary: custom-item cases with itemReleaseUse ${customReleases} of ${cases.length - 1}`);
  } finally {
    world.afterEvents.itemStartUse.unsubscribe(start);
    world.afterEvents.itemReleaseUse.unsubscribe(release);
    world.afterEvents.itemStopUse.unsubscribe(stop);
    world.afterEvents.itemCompleteUse.unsubscribe(complete);
    world.afterEvents.itemUse.unsubscribe(use);
    if (p.isValid) test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ P4: vanilla Riptide III launch, and applyKnockback calibrated to it (xasm37)

const RIPTIDE_FIELD = { x: 1600, y: 1, z: 0 };
const LANES = [1, 4, 7, 10, 13];

interface Launch {
  label: string;
  pitch: number;
  shape?: FlightShape;
  view?: Vector3;
}

registerAsync("andrew", "probe_trident_riptide", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation(RIPTIDE_FIELD);
  const cleanup = await farPad(test, "andrew_gt_trdt_rip", origin, { x: 110, z: 15 }, 0);
  const rel = (x: number, y: number, z: number): Vector3 => ({ x: RIPTIDE_FIELD.x + x, y: RIPTIDE_FIELD.y + y, z: RIPTIDE_FIELD.z + z });
  const players: SimulatedPlayer[] = [];
  try {
    for (let i = 0; i < LANES.length; i++) players.push(await survivor(test, rel(0, 1, LANES[i]), `trdt_rip_${i}`, { immune: true }));
    const riptide = (): ItemStack => enchanted(TRIDENT, [["riptide", 3]]).stack;
    const startOf = (i: number, inWater: boolean): Vector3 => test.worldLocation(rel(0.5, inWater ? 0 : 1, LANES[i] + 0.5));

    /** Riptide releases on lanes 0..n-1 at once; returns the launch shapes. */
    const riptideRun = async (label: string, pitches: number[], inWater: boolean): Promise<Launch[]> => {
      const ps = players.slice(0, pitches.length);
      ps.forEach((p, i) => {
        p.setItem(riptide(), 0, true);
        aim(p, startOf(i, inWater), pitches[i], EAST);
      });
      const aimed = await settleAim(test, ps.map((p, i) => ({ p, pitch: pitches[i], yaw: EAST })));
      log(`P4 SETUP ${label}: ${aimed.join(" | ")}`);
      const used = ps.map((p) => p.useItemInSlot(0));
      await test.idle(20);
      const s0 = ps.map((p) => sampleOf(p));
      const views = ps.map((p) => p.getViewDirection());
      const inWaterNow = ps.map((p) => p.isInWater);
      ps.forEach((p) => p.stopUsingItem());
      const tracks = await follow(test, ps, 80);
      return ps.map((_, i) => {
        const s = [s0[i], ...tracks[i].slice(1)];
        const f = shape(s);
        log(`P4 RESULT riptide III ${label} pitch ${pitches[i]}: useItemInSlot=${used[i]} inWater=${inWaterNow[i]} view ${v3(views[i])}; ${showShape(f)}`);
        return { label, pitch: pitches[i], shape: f, view: views[i] };
      });
    };

    // Dry ground, clear sky: vanilla refuses.
    dim.setWeather(WeatherType.Clear, 24000);
    await test.idle(5);
    const control = await riptideRun("dry ground, clear sky (control)", [-30], false);

    // Standing in a one-block water hole cut into the pad.
    for (let i = 0; i < 3; i++) fill(dim, test.worldBlockLocation(rel(0, 0, LANES[i])), test.worldBlockLocation(rel(0, 0, LANES[i])), "minecraft:water");
    const below = dim.getBlock(test.worldBlockLocation(rel(0, -1, LANES[0])))?.typeId ?? "unloaded";
    const water = await riptideRun(`in water (hole over ${short(below)})`, [-30, -45, -90], true);
    for (let i = 0; i < 3; i++) fill(dim, test.worldBlockLocation(rel(0, 0, LANES[i])), test.worldBlockLocation(rel(0, 0, LANES[i])), "minecraft:stone");

    // applyKnockback on a standing player: what velocity one unit of force gives.
    const kb: Array<{ label: string; h: number; v: number; d1?: Vector3; vel?: Vector3 }> = [
      { label: "h1", h: 1, v: 0 },
      { label: "h2", h: 2, v: 0 },
      { label: "v0.5", h: 0, v: 0.5 },
      { label: "v1", h: 0, v: 1 },
      { label: "h1 v1", h: 1, v: 1 },
    ];
    for (let i = 0; i < kb.length; i++) aim(players[i], startOf(i, false), 0, EAST);
    await test.idle(4);
    const kb0 = kb.map((_, i) => ({ ...players[i].location }));
    kb.forEach((k, i) => {
      players[i].applyKnockback({ x: k.h, z: 0 }, k.v);
      k.vel = players[i].getVelocity();
    });
    const kbTracks = await follow(test, players.slice(0, kb.length), 60);
    kb.forEach((k, i) => {
      k.d1 = sub(kbTracks[i][1].pos, kb0[i]);
      log(`P4 RESULT applyKnockback({x:${k.h},z:0}, ${k.v}) standing: velocity read in the same turn ${v3(k.vel ?? { x: 0, y: 0, z: 0 })}; ${showShape(shape([{ ...kbTracks[i][0], pos: kb0[i] }, ...kbTracks[i].slice(1)]))}`);
    });
    const kH = (kb[0].d1?.x ?? Number.NaN) / 1;
    const kV = (kb[3].d1?.y ?? Number.NaN) / 1;

    // Rain over dry ground.
    dim.setWeather(WeatherType.Rain, 24000);
    await test.idle(100);
    let rain = await riptideRun("rain over dry ground", [0, -30, -45, -90], false);
    if (rain.every((r) => (r.shape?.restH ?? 0) < 1 && (r.shape?.peak ?? 0) < 1)) {
      log("P4 RESULT rain: no launch after 100 ticks of rain — waiting 200 more and repeating");
      await test.idle(200);
      rain = await riptideRun("rain over dry ground (after 300 ticks of rain)", [0, -30, -45, -90], false);
    }
    dim.setWeather(WeatherType.Clear, 24000);

    // H and V from the first-tick displacement: riptide's against one unit of knockback.
    // The dash runs in dry air, so rain over dry ground is its reference; water is reported beside it.
    const factors = (ls: Launch[]): { hs: number[]; vs: number[] } => {
      const hs: number[] = [];
      const vs: number[] = [];
      for (const l of ls) {
        const f = l.shape;
        const view = l.view;
        if (f === undefined || view === undefined || (f.peak < 0.5 && f.restH < 1)) continue;
        if (hlen(view) > 0.3) hs.push(hlen(f.d1) / (hlen(view) * kH));
        if (view.y > 0.3) vs.push(f.d1.y / (view.y * kV));
      }
      return { hs, vs };
    };
    const dry = factors(rain);
    const wet = factors(water);
    const H = median(dry.hs);
    const V = median(dry.vs);
    log(
      `P4 RESULT calibration: one unit of horizontal force = ${f3(kH)} b/t, of vertical = ${f3(kV)} b/t; from riptide in rain H [${dry.hs.map(f2).join(" ")}] median ${f2(H)}, ` +
        `V [${dry.vs.map(f2).join(" ")}] median ${f2(V)}; from riptide in water H [${wet.hs.map(f2).join(" ")}], V [${wet.vs.map(f2).join(" ")}]`
    );

    // Dry air, no rain: the scripted dash applyKnockback({x: v.x·H, z: v.z·H}, v.y·V).
    const pitches = [0, -30, -45, -90];
    for (let i = 0; i < pitches.length; i++) aim(players[i], startOf(i, false), pitches[i], EAST);
    log(`P4 SETUP dash: ${(await settleAim(test, pitches.map((pitch, i) => ({ p: players[i], pitch, yaw: EAST })))).join(" | ")}`);
    const d0 = pitches.map((_, i) => ({ ...players[i].location }));
    const dashViews = pitches.map((_, i) => players[i].getViewDirection());
    pitches.forEach((_, i) => {
      const v = dashViews[i];
      players[i].applyKnockback({ x: v.x * (Number.isFinite(H) ? H : 0), z: v.z * (Number.isFinite(H) ? H : 0) }, v.y * (Number.isFinite(V) ? V : 0));
    });
    const dashTracks = await follow(test, players.slice(0, pitches.length), 80);
    pitches.forEach((pitch, i) => {
      const f = shape([{ ...dashTracks[i][0], pos: d0[i] }, ...dashTracks[i].slice(1)]);
      const ref = rain.find((r) => r.pitch === pitch)?.shape;
      const refW = water.find((r) => r.pitch === pitch)?.shape;
      const ratio = (a?: number, b?: number): string => (a === undefined || b === undefined || b === 0 ? "-" : f2(a / b));
      log(
        `P4 RESULT scripted dash pitch ${pitch} H ${f2(H)} V ${f2(V)} in dry air: ${showShape(f)}; vs riptide in rain: peak ${ratio(f.peak, ref?.peak)}×, ` +
          `crossing ${ratio(f.crossH, ref?.crossH)}×, landing ${ratio(f.landH, ref?.landH)}×, rest ${ratio(f.restH, ref?.restH)}×; vs riptide in water: peak ${ratio(f.peak, refW?.peak)}×, crossing ${ratio(f.crossH, refW?.crossH)}×`
      );
    });
    const launched = [...rain, ...water].some((l) => (l.shape?.peak ?? 0) > 1 || (l.shape?.restH ?? 0) > 2);
    log(`P4 RESULT control: riptide on dry ground with a clear sky moved ${f2(control[0].shape?.restH ?? 0)} horizontally, peak +${f2(control[0].shape?.peak ?? 0)}`);
    test.assert(launched, "control: riptide III launched in neither rain nor water — the instrument does not reach vanilla riptide");
  } finally {
    dim.setWeather(WeatherType.Clear, 24000);
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");

// ------------------------------------------------ P5: cancelling the landing in beforeEvents.entityHurt (xasm36)

registerAsync("andrew", "probe_trident_fall_cancel", async (test: Test): Promise<void> => {
  const floor = test.worldBlockLocation({ x: 0, y: 2, z: 0 }).y;
  const HEIGHT = 20;
  const fallers: Array<{ label: string; cell: Vector3; p?: SimulatedPlayer; hp0?: number; reset?: boolean; landed?: number; peak: number }> = [
    { label: "control", cell: { x: 1, y: 2, z: 1 }, peak: 0 },
    { label: "before-event cancel", cell: { x: 5, y: 2, z: 5 }, peak: 0 },
    { label: "self-teleport at 2 (katana method)", cell: { x: 1, y: 2, z: 5 }, peak: 0 },
  ];
  const byId = new Map<string, string>();
  const beforeFall = new Map<string, number[]>();
  const afterHurt = new Map<string, string[]>();
  const cancelId = (): string | undefined => fallers[1].p?.id;
  const b = world.beforeEvents.entityHurt.subscribe((e) => {
    const label = byId.get(e.hurtEntity.id);
    if (label === undefined || e.damageSource.cause !== EntityDamageCause.fall) return;
    beforeFall.get(label)?.push(e.damage);
    if (e.hurtEntity.id === cancelId()) e.cancel = true;
  });
  const a = world.afterEvents.entityHurt.subscribe((e) => {
    const label = byId.get(e.hurtEntity.id);
    if (label !== undefined) afterHurt.get(label)?.push(`${e.damageSource.cause}:${f2(e.damage)}`);
  });
  try {
    for (const f of fallers) {
      f.p = await survivor(test, f.cell, `trdt_fall_${byId.size}`, { boost: true });
      byId.set(f.p.id, f.label);
      beforeFall.set(f.label, []);
      afterHurt.set(f.label, []);
    }
    await test.idle(3);
    for (const f of fallers) {
      const p = f.p as SimulatedPlayer;
      f.hp0 = hp(p);
      p.teleport(test.worldLocation({ x: f.cell.x + 0.5, y: f.cell.y + HEIGHT, z: f.cell.z + 0.5 }));
    }
    await test.idle(1);
    for (const f of fallers) (f.p as SimulatedPlayer).applyKnockback({ x: 0, z: 0 }, 0.6);
    for (let t = 1; t <= 200 && fallers.some((f) => f.landed === undefined); t++) {
      await test.idle(1);
      for (const f of fallers) {
        const p = f.p as SimulatedPlayer;
        const h = p.location.y - floor;
        f.peak = Math.max(f.peak, h);
        if (f.label.startsWith("self-teleport") && f.reset !== true && p.getVelocity().y < 0 && h <= 2) {
          p.teleport(p.location, { rotation: p.getRotation() });
          f.reset = true;
        }
        if (f.landed === undefined && t > 5 && h < 0.01) f.landed = t;
      }
    }
    await test.idle(10);
    for (const f of fallers) {
      const p = f.p as SimulatedPlayer;
      log(
        `P5 RESULT ${f.label}: dropped from ${HEIGHT} after a 0.6 knockback launch, peak ${f2(f.peak)} above the floor, landed +${f.landed ?? "never"}; ` +
          `fall seen by the before-event [${(beforeFall.get(f.label) ?? []).map(f2).join(" ")}], after-events [${(afterHurt.get(f.label) ?? []).join(" ")}], ` +
          `hp ${f2(f.hp0 ?? 0)} -> ${f2(hp(p))}`
      );
    }
    const control = beforeFall.get("control") ?? [];
    const cancelled = fallers[1];
    log(
      `P5 RESULT verdict: control took fall ${control.map(f2).join(" ") || "none"}; the cancelled player's before-event saw ${(beforeFall.get(cancelled.label) ?? []).length} fall, ` +
        `after-events ${(afterHurt.get(cancelled.label) ?? []).length}, hp change ${f2(hp(cancelled.p as SimulatedPlayer) - (cancelled.hp0 ?? 0))} -> the before-event cancel ` +
        `${(beforeFall.get(cancelled.label) ?? []).length > 0 && (afterHurt.get(cancelled.label) ?? []).length === 0 && hp(cancelled.p as SimulatedPlayer) >= (cancelled.hp0 ?? 0) ? "STOPS" : "DOES NOT STOP"} the landing damage`
    );
    test.assert(control.length > 0, "control: the uncancelled player took no fall damage — the instrument cannot see a landing");
    for (const f of fallers) test.assert(f.landed !== undefined, `${f.label} never reached the floor`);
  } finally {
    world.beforeEvents.entityHurt.unsubscribe(b);
    world.afterEvents.entityHurt.unsubscribe(a);
    for (const f of fallers) if (f.p?.isValid === true) test.removeSimulatedPlayer(f.p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ P6: swim speed without the trident, and the land sprint it is compared to (xasm37)

const SWIM_FIELD = { x: 2000, y: 1, z: 0 };
const SWIM_LEN = 60;

registerAsync("andrew", "probe_trident_swim", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation(SWIM_FIELD);
  const cleanup = await farPad(test, "andrew_gt_trdt_swim", origin, { x: SWIM_LEN, z: 27 }, 3);
  const at = (x: number, y: number, z: number): Vector3 => test.worldBlockLocation({ x: SWIM_FIELD.x + x, y: SWIM_FIELD.y + y, z: SWIM_FIELD.z + z });
  const players: SimulatedPlayer[] = [];
  type Mode = "walk" | "sprint" | "swim plain" | "sprint-swim" | "sprint-swim + knockback";
  const lanes: Array<{ label: string; z: number; water: boolean; mode: Mode; k?: number; speed?: boolean }> = [
    { label: "land, walking", z: 0, water: false, mode: "walk" },
    { label: "land, sprinting", z: 3, water: false, mode: "sprint" },
    { label: "water 2 deep, moving forward, no sprint", z: 6, water: true, mode: "swim plain" },
    { label: "water 2 deep, swim() + sprint", z: 9, water: true, mode: "sprint-swim" },
    { label: "water 2 deep, swim() + sprint + knockback 0.28/tick", z: 12, water: true, mode: "sprint-swim + knockback", k: 0.28 },
    { label: "water 2 deep, swim() + sprint + knockback 0.35/tick", z: 15, water: true, mode: "sprint-swim + knockback", k: 0.35 },
    { label: "water 2 deep, moving forward, no sprint, knockback 0.28/tick", z: 18, water: true, mode: "swim plain", k: 0.28 },
    { label: "water 2 deep, swim() + sprint + knockback 0.34/tick", z: 21, water: true, mode: "sprint-swim + knockback", k: 0.34 },
    { label: "water 2 deep, swim() + sprint, Speed II effect", z: 24, water: true, mode: "sprint-swim", speed: true },
  ];
  const kick = system.runInterval(() => {
    lanes.forEach((l, i) => {
      const p = players[i];
      if (l.k === undefined || p === undefined || !p.isValid || !p.isInWater) return;
      const v = p.getViewDirection();
      const h = hlen(v) || 1;
      p.applyKnockback({ x: (v.x / h) * l.k, z: (v.z / h) * l.k }, p.getVelocity().y);
    });
  }, 1);
  try {
    // Walls of stone, open water two deep in each swim lane, open air over each land lane.
    fill(dim, at(-1, 1, -1), at(SWIM_LEN, 3, 25), "minecraft:stone");
    for (const l of lanes) {
      if (l.water) {
        fill(dim, at(0, 1, l.z), at(SWIM_LEN - 1, 2, l.z), "minecraft:water");
        fill(dim, at(0, 3, l.z), at(SWIM_LEN - 1, 3, l.z), "minecraft:air");
      } else fill(dim, at(0, 1, l.z), at(SWIM_LEN - 1, 3, l.z), "minecraft:air");
    }
    await test.idle(5);
    for (const l of lanes) players.push(await survivor(test, { x: SWIM_FIELD.x + 1, y: SWIM_FIELD.y + 1, z: SWIM_FIELD.z + l.z }, `trdt_swim_${players.length}`, { immune: true }));
    lanes.forEach((l, i) => aim(players[i], test.worldLocation({ x: SWIM_FIELD.x + 1.5, y: SWIM_FIELD.y + 1, z: SWIM_FIELD.z + l.z + 0.5 }), 0, EAST));
    lanes.forEach((l, i) => {
      if (l.speed === true) players[i].addEffect("speed", 2000, { amplifier: 1, showParticles: false });
    });
    let grace = "?";
    try {
      players[0].addEffect("dolphins_grace", 100);
      grace = "accepted";
    } catch (err) {
      grace = `threw ${errText(err)}`;
    }
    log(
      `P6 RESULT effect types on this engine: dolphins_grace ${EffectTypes.get("dolphins_grace") === undefined ? "absent" : "present"}, ` +
        `conduit_power ${EffectTypes.get("conduit_power") === undefined ? "absent" : "present"}, speed ${EffectTypes.get("speed") === undefined ? "absent" : "present"}; addEffect("dolphins_grace") ${grace}`
    );
    await test.idle(10);
    lanes.forEach((l, i) => {
      const p = players[i];
      if (l.mode === "sprint-swim" || l.mode === "sprint-swim + knockback") p.swim();
      if (l.mode !== "walk" && l.mode !== "swim plain") p.isSprinting = true;
      p.moveRelative(0, 1, 1);
    });
    const tracks = await follow(test, players, 100);
    const flags = players.map((p) => `swimming ${p.isSwimming} sprinting ${p.isSprinting} inWater ${p.isInWater}`);
    lanes.forEach((l, i) => {
      const s = tracks[i];
      const x = (t: number): number => s[Math.min(t, s.length - 1)].pos.x;
      const end = s.findIndex((q) => q.pos.x - s[0].pos.x > SWIM_LEN - 6);
      const last = end > 0 ? end : s.length - 1;
      const w0 = Math.min(20, last);
      const steady = last > w0 ? ((x(last) - x(w0)) / (last - w0)) * 20 : Number.NaN;
      const ys = s.slice(w0, last + 1).map((q) => q.pos.y - s[0].pos.y);
      log(
        `P6 RESULT ${l.label}: steady ${f2(steady)} b/s over ticks ${w0}..${last}; first 20 ticks ${f2(((x(w0) - x(0)) / Math.max(1, w0)) * 20)} b/s; ` +
          `y drift ${f2(Math.min(...ys))}..${f2(Math.max(...ys))}; at the end ${flags[i]}`
      );
    });
    test.assert(tracks[1][tracks[1].length - 1].pos.x - tracks[1][0].pos.x > 10, "control: the land sprinter moved less than 10 blocks — moveRelative did not drive the player");
  } finally {
    system.clearRun(kick);
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    try {
      for (const l of lanes) if (l.water) fill(dim, at(0, 1, l.z), at(SWIM_LEN - 1, 2, l.z), "minecraft:air");
    } catch (err) {
      log(`swim cleanup threw ${errText(err)}`);
    }
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ P8: a steered return body through a 3-block wall at 0.5 block/tick

registerAsync("andrew", "probe_trident_return", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const STEP = 0.5;
  const FROM_X = -7;
  const TO_X = 13;
  fill(dim, test.worldBlockLocation({ x: 2, y: 2, z: 0 }), test.worldBlockLocation({ x: 4, y: 4, z: 6 }), "minecraft:stone");
  type Drive = "teleport" | "velocity";
  const bodies: Array<{ label: string; type: string; z: number; drive: Drive; e?: Entity }> = [
    { label: `${short(RETURN)} (no physics), teleport-steered`, type: RETURN, z: 1.5, drive: "teleport" },
    { label: `${short(THROWN)} (projectile), teleport-steered`, type: THROWN, z: 3.5, drive: "teleport" },
    { label: `${short(RETURN)} (no physics), clearVelocity + applyImpulse 0.5`, type: RETURN, z: 5.5, drive: "velocity" },
  ];
  const hitsB: string[] = [];
  let t0 = system.currentTick;
  const hb = world.afterEvents.projectileHitBlock.subscribe((e) => {
    if (e.projectile.typeId === THROWN) hitsB.push(`${short(e.getBlockHit().block.typeId)}@${v2(test.relativeLocation(e.location))} at +${system.currentTick - t0} t`);
  });
  const removed = new Set<string>();
  const rm = world.afterEvents.entityRemove.subscribe((e) => removed.add(e.removedEntityId));
  try {
    for (const b of bodies) {
      b.e = dim.spawnEntity(b.type, test.worldLocation({ x: FROM_X, y: 3.5, z: b.z }));
      if (b.drive === "teleport" && b.type === THROWN) b.e.getComponent("minecraft:projectile")?.shoot({ x: 0, y: 0, z: 0 }, { uncertainty: 0 });
    }
    await test.idle(2);
    t0 = system.currentTick;
    const trace = bodies.map(() => [] as string[]);
    const arrived: Array<number | undefined> = bodies.map(() => undefined);
    const lag: number[][] = bodies.map(() => []);
    const wallTicks = bodies.map(() => 0);
    const steps = Math.ceil((TO_X - FROM_X) / STEP);
    for (let t = 1; t <= steps + 10; t++) {
      bodies.forEach((b, i) => {
        const e = b.e;
        if (e === undefined || !e.isValid || arrived[i] !== undefined) return;
        const want = test.worldLocation({ x: Math.min(TO_X, FROM_X + t * STEP), y: 3.5, z: b.z });
        if (b.drive === "teleport") e.teleport(want);
        else {
          e.clearVelocity();
          e.applyImpulse({ x: STEP, y: 0, z: 0 });
        }
      });
      await test.idle(1);
      bodies.forEach((b, i) => {
        const e = b.e;
        if (e === undefined || arrived[i] !== undefined) return;
        if (!e.isValid) {
          if (trace[i][trace[i].length - 1] !== "invalid") trace[i].push(`invalid@+${t}${removed.has(b.e?.id ?? "") ? " (entityRemove)" : ""}`);
          return;
        }
        const r = test.relativeLocation(e.location);
        const want = Math.min(TO_X, FROM_X + t * STEP);
        lag[i].push(want - r.x);
        const cell = dim.getBlock(e.location)?.typeId ?? "?";
        if (cell === "minecraft:stone") wallTicks[i]++;
        if (t % 4 === 0 || (r.x > 1.5 && r.x < 5.5)) trace[i].push(`+${t}:${f2(r.x)}${cell === "minecraft:stone" ? "[in stone]" : ""}`);
        if (r.x >= TO_X - 0.01) arrived[i] = t;
      });
    }
    bodies.forEach((b, i) => {
      const t = arrived[i];
      log(
        `P8 RESULT ${b.label}: ${TO_X - FROM_X} blocks through a 3-block stone wall at ${STEP} b/t asked: ${t === undefined ? "did NOT arrive" : `arrived +${t} t = ${f2(t / 20)} s (${f2((TO_X - FROM_X) / (t / 20))} b/s)`}; ` +
          `ticks inside stone ${wallTicks[i]}; lag behind the steered point max ${f2(Math.max(0, ...lag[i]))}; valid at the end ${b.e?.isValid === true}; trace ${trace[i].join(" ")}`
      );
    });
    log(`P8 RESULT projectileHitBlock for ${short(THROWN)} (steering stops on arrival, then gravity takes it): ${hitsB.join(", ") || "none"}; arrival at +${arrived[1] ?? "-"} t`);
    test.assert(bodies[0].e !== undefined, "control: the return body did not spawn");
  } finally {
    world.afterEvents.projectileHitBlock.unsubscribe(hb);
    world.afterEvents.entityRemove.unsubscribe(rm);
    for (const b of bodies) if (b.e?.isValid === true) b.e.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// ------------------------------------------------ P9: custody entities across a server restart (seed, restart, check)

const RESTART_FIELD = { x: 2800, y: 1, z: 0 };
const RESTART_AREA = "andrew_gt_trdt_rs";
const RESTART_RECORD = "andrew:gt_trdt_restart";
const RESTART_TYPES = new Set([RETURN, THROWN, VANILLA_THROWN]);

interface Seeded {
  key: string;
  label: string;
  type: string;
  id: string;
  at: Vector3;
  vel: Vector3;
}

interface RestartRecord {
  savedAt: number;
  bodies: Seeded[];
  box: Box;
}

/** entityLoad for the custody types since this script loaded: the boot after the seed. */
const loads: Array<{ id: string; type: string; key: string; at: Vector3; vel: Vector3; tick: number; ms: number }> = [];
world.afterEvents.entityLoad.subscribe((ev) => {
  const e = ev.entity;
  if (!RESTART_TYPES.has(e.typeId)) return;
  let key = "?";
  try {
    key = String(e.getDynamicProperty(THROW_PROP) ?? "none");
  } catch (err) {
    key = `threw ${errText(err)}`;
  }
  loads.push({ id: e.id, type: e.typeId, key, at: { ...e.location }, vel: e.getVelocity(), tick: system.currentTick, ms: Date.now() });
});

/** The seed's flying bodies are re-shot upward until the server stops, so the save catches them in flight. */
let aloft: number | undefined;

registerAsync("andrew", "probe_trident_restart_seed", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  world.setDynamicProperty(RESTART_RECORD, undefined);
  const o = test.worldBlockLocation(RESTART_FIELD);
  const box: Box = { min: [o.x - 4, 0, o.z - 4], max: [o.x + 28, 0, o.z + 20] };
  await loadBox(test, dim, RESTART_AREA, box);
  const at = (x: number, y: number, z: number): Vector3 => ({ x: o.x + x, y: o.y + y, z: o.z + z });
  fill(dim, at(0, 0, 0), at(24, 0, 16), "minecraft:stone");
  const bodies: Seeded[] = [];
  const flying: Array<{ e: Entity; base: number }> = [];
  const keep = (key: string, label: string, e: Entity, fly: boolean): void => {
    e.setDynamicProperty(THROW_PROP, key);
    bodies.push({ key, label, type: e.typeId, id: e.id, at: { ...e.location }, vel: e.getVelocity() });
    if (fly) flying.push({ e, base: e.location.y });
  };
  const spawn = (key: string, label: string, type: string, where: Vector3, v?: Vector3): void => {
    try {
      const e = dim.spawnEntity(type, where);
      if (v !== undefined) e.getComponent("minecraft:projectile")?.shoot(v, { uncertainty: 0 });
      keep(key, label, e, key === "probe-F");
    } catch (err) {
      log(`P9 RESULT seed: spawning ${label} (${type}) threw ${errText(err)}`);
    }
  };
  try {
    dim.spawnEntity(VANILLA_THROWN, at(20.5, 3, 8.5)).remove();
    log("P9 RESULT seed: spawnEntity(minecraft:thrown_trident) is accepted");
  } catch (err) {
    log(`P9 RESULT seed: spawnEntity(minecraft:thrown_trident) threw ${errText(err)}`);
  }
  spawn("probe-R", "return body hanging in the air", RETURN, at(4.5, 6, 8.5));
  spawn("probe-F", "custom projectile kept in flight", THROWN, at(10.5, 3, 8.5), { x: 0, y: 1.6, z: 0 });
  spawn("probe-G", "custom projectile stuck in the floor", THROWN, at(16.5, 5, 8.5), { x: 0, y: -1.5, z: 0 });
  // A thrown_trident is not summonable, so a simulated player throws one straight up.
  const watch = thrownWatch();
  const thrower = await survivor(test, { x: RESTART_FIELD.x + 20, y: RESTART_FIELD.y + 1, z: RESTART_FIELD.z + 8 }, "trdt_rs_thrower");
  giveTrident(thrower);
  await test.idle(2);
  aim(thrower, at(20.5, 1, 8.5), -90, EAST);
  log(`P9 SETUP thrower ${(await settleAim(test, [{ p: thrower, pitch: -90, yaw: EAST }]))[0]}`);
  await chargeAndRelease(test, thrower, 20);
  await test.idle(2);
  watch.stop();
  const v = watch.got[0]?.e;
  // Pinned to its own column inside the kept ticking area, whatever the throw's aim.
  if (v !== undefined && v.isValid) {
    v.teleport(at(20.5, 4, 8.5));
    v.getComponent("minecraft:projectile")?.shoot({ x: 0, y: 1.6, z: 0 }, { uncertainty: 0 });
  }
  if (v === undefined) log("P9 RESULT seed: the simulated player's throw spawned no thrown_trident");
  else {
    try {
      keep("probe-V", "vanilla thrown_trident kept in flight", v, true);
    } catch (err) {
      log(`P9 RESULT seed: marking the vanilla thrown_trident threw ${errText(err)}`);
    }
  }
  test.removeSimulatedPlayer(thrower);
  if (aloft !== undefined) system.clearRun(aloft);
  const until = system.currentTick + 6000;
  aloft = system.runInterval(() => {
    if (system.currentTick > until && aloft !== undefined) system.clearRun(aloft);
    for (const f of flying) {
      if (!f.e.isValid) continue;
      if (f.e.getVelocity().y < 0 && f.e.location.y < f.base + 4) f.e.getComponent("minecraft:projectile")?.shoot({ x: 0, y: 1.6, z: 0 }, { uncertainty: 0 });
    }
  }, 1);
  await test.idle(30);
  for (const b of bodies) {
    const e = world.getEntity(b.id);
    if (e !== undefined && e.isValid) {
      b.at = { ...e.location };
      b.vel = e.getVelocity();
    }
  }
  const record: RestartRecord = { savedAt: Date.now(), bodies, box };
  world.setDynamicProperty(RESTART_RECORD, JSON.stringify(record));
  log(
    `P9 RESULT seed: ${bodies.map((b) => `${b.key} ${b.label} (${short(b.type)}) id ${b.id} at ${v2(sub(b.at, o))} vel ${v3(b.vel)} prop ${String(world.getEntity(b.id)?.getDynamicProperty(THROW_PROP))}`).join(" | ")}; ` +
      `the ticking area ${RESTART_AREA} stays through the restart; the flying bodies are re-shot upward until the server stops`
  );
  test.assert(bodies.some((b) => b.type === RETURN) && bodies.some((b) => b.type === THROWN), "control: the custody stand-ins did not spawn");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

registerAsync("andrew", "probe_trident_restart_check", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const raw = world.getDynamicProperty(RESTART_RECORD);
  test.assert(typeof raw === "string", "no record from probe_trident_restart_seed: it did not run in this world before the restart");
  const rec = JSON.parse(raw as string) as RestartRecord;
  const o = test.worldBlockLocation(RESTART_FIELD);
  const centre = { x: o.x + 12, y: o.y + 4, z: o.z + 8 };
  let unload: (() => void) | undefined;
  try {
    const loadedAtCheck = dim.isChunkLoaded(centre);
    if (!loadedAtCheck) unload = await loadBox(test, dim, `${RESTART_AREA}b`, rec.box);
    await test.idle(5);
    const startTick = system.currentTick;
    log(
      `P9 RESULT restart: ${f2((Date.now() - rec.savedAt) / 1000)} s since the seed saved its record; chunk loaded when the check began ${loadedAtCheck}; ` +
        `entityLoad events for custody types since this script loaded: ${loads.length === 0 ? "none" : loads.map((l) => `${short(l.type)} ${l.key} id ${l.id} at ${v2(sub(l.at, o))} vel ${v3(l.vel)} ${startTick - l.tick} t before the check`).join(" | ")}`
    );
    const present = [...RESTART_TYPES].flatMap((type) => dim.getEntities({ type }));
    for (const b of rec.bodies) {
      const byOld = world.getEntity(b.id);
      const byKey = present.find((e) => {
        try {
          return e.getDynamicProperty(THROW_PROP) === b.key;
        } catch {
          return false;
        }
      });
      const load = loads.find((l) => l.key === b.key);
      log(
        `P9 RESULT ${b.key} ${b.label}: world.getEntity(old id ${b.id}) ${byOld === undefined ? "undefined" : `found${byOld.isValid ? ` at ${v2(sub(byOld.location, o))}` : " (invalid)"}`}; ` +
          `by ${THROW_PROP}: ${byKey === undefined ? "not found" : `found, id ${byKey.id} (${byKey.id === b.id ? "same id" : "NEW id"}), at ${v2(sub(byKey.location, o))} (seed ${v2(sub(b.at, o))}), velocity ${v3(byKey.getVelocity())} (seed ${v3(b.vel)})`}; ` +
          `entityLoad ${load === undefined ? "not seen" : `seen, prop ${load.key}, at ${v2(sub(load.at, o))} vel ${v3(load.vel)}`}`
      );
    }
    const later = present.filter((e) => e.isValid).map((e) => ({ e, at: { ...e.location } }));
    await test.idle(40);
    log(`P9 RESULT 40 ticks into the check: ${later.map(({ e, at }) => `${short(e.typeId)} ${String(e.isValid ? e.getDynamicProperty(THROW_PROP) : "?")} ${e.isValid ? `moved ${f2(len(sub(e.location, at)))}` : "gone"}`).join(" | ") || "nothing present"}`);
    const others = present.filter((e) => !rec.bodies.some((b) => b.key === e.getDynamicProperty(THROW_PROP)));
    log(`P9 RESULT custody-type entities in the area without a seeded key: ${others.length}`);
  } finally {
    for (const type of RESTART_TYPES) for (const e of dim.getEntities({ type })) if (e.isValid) e.remove();
    try {
      fill(dim, { x: o.x, y: o.y, z: o.z }, { x: o.x + 24, y: o.y + 12, z: o.z + 16 }, "minecraft:air");
    } catch (err) {
      log(`restart cleanup threw ${errText(err)}`);
    }
    try {
      dim.runCommand(`tickingarea remove ${RESTART_AREA}`);
    } catch (err) {
      log(`tickingarea remove ${RESTART_AREA} threw ${errText(err)}`);
    }
    unload?.();
    world.setDynamicProperty(RESTART_RECORD, undefined);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
