// The Windmill template on a real engine: all four rotations judged by the
// blocks in the world, and the floor-3 spawner's Vindicator and its axe
// (L0-wind-r003, L0-wind-as06). Every test clears what it placed.

import {
  BlockTypes,
  BlockVolume,
  Difficulty,
  type Dimension,
  type Entity,
  EquipmentSlot,
  GameMode,
  StructureRotation,
  type Vector3,
  world,
} from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { Rotation, Vec3 } from "../structures/registry";
import { ENGINE_ROTATION, ROTATIONS, rotateCardinal, rotatedSize, toWorld } from "../structures/rotate";
import windmillTemplate, {
  BLADE_SAIL,
  BLADE_SPAR,
  CHESTS,
  DOOR_LOWER,
  DOOR_UPPER,
  FLOOR_SLAB_Y,
  SPAWNERS,
  WINDMILL_ID,
  WINDMILL_SIZE,
} from "../structures/templates/windmill";
import { BUILDING } from "../structures/templates/windmill-fields";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SIZE: Vec3 = [...WINDMILL_SIZE];
const DOOR_FACING = "south";

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const fmt = (p: Vec3): string => p.join(",");
const local = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** Block counts per name straight from the template source, air excluded. */
function templateCounts(): Map<string, number> {
  const t = windmillTemplate();
  const counts = new Map<string, number>();
  for (const rows of Object.values(t.layers))
    for (const row of rows)
      for (const ch of row) {
        const name = t.blocks[ch].name;
        if (name !== "minecraft:air") counts.set(name, (counts.get(name) ?? 0) + 1);
      }
  return counts;
}

interface Cell {
  at: Vec3;
  typeId: string;
  states: Record<string, boolean | number | string>;
}

function scan(dim: Dimension, box: Box): Cell[] {
  const out: Cell[] = [];
  for (let x = box.min[0]; x <= box.max[0]; x++)
    for (let y = box.min[1]; y <= box.max[1]; y++)
      for (let z = box.min[2]; z <= box.max[2]; z++) {
        const b = dim.getBlock({ x, y, z });
        if (b === undefined) throw new Error(`${x},${y},${z} unloaded during the scan`);
        if (!b.isAir) out.push({ at: [x, y, z], typeId: b.typeId, states: b.permutation.getAllStates() });
      }
  return out;
}

/** Where a windmill test stands: above the platform, on a stone slab so the ditches hold their water. */
async function site(test: Test, name: string): Promise<{ dim: Dimension; loc: Vec3; box: Box; slab: Box; done: () => void }> {
  const dim = test.getDimension();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc: Vec3 = [b.x - 14, b.y + 10, b.z - 14];
  const box = boxOf(loc, SIZE);
  const slab: Box = { min: [loc[0], loc[1] - 1, loc[2]], max: [box.max[0], loc[1] - 1, box.max[2]] };
  const unload = await loadBox(test, dim, name, { min: slab.min, max: box.max });
  const done = (): void => {
    fillBox(dim, box, "minecraft:air");
    fillBox(dim, slab, "minecraft:air");
    for (const e of dim.getEntities({ location: v([loc[0] + 17, loc[1] + 15, loc[2] + 17]), maxDistance: 48, type: "minecraft:item" })) e.remove();
    unload();
  };
  return { dim, loc, box, slab, done };
}

const place = (dim: Dimension, loc: Vec3, rot: Rotation): void =>
  world.structureManager.place(WINDMILL_ID, dim, v(loc), { rotation: StructureRotation[ENGINE_ROTATION[rot]], includeEntities: false });

// ------------------------------------------------ AC5: four rotations, judged by the world

registerAsync("andrew", "windmill_rotations", async (test: Test): Promise<void> => {
  const { dim, loc, box, slab, done } = await site(test, "andrew_gt_windmill_a");
  const expected = templateCounts();
  const verdicts: string[] = [];
  try {
    const unknown = [...expected.keys()].filter((n) => BlockTypes.get(n) === undefined);
    test.assert(unknown.length === 0, `template names the engine does not know: ${unknown.join(" ")}`);
    fillBox(dim, slab, "minecraft:stone");

    // Front normal and building centre in template space; the door's wall is the front.
    const centre: Vec3 = [(BUILDING.x0 + BUILDING.x1) / 2, 0, (BUILDING.z0 + BUILDING.z1) / 2];
    for (const rot of ROTATIONS) {
      place(dim, loc, rot);
      const found = scan(dim, box);
      fillBox(dim, box, "minecraft:air");
      const problems: string[] = [];

      const counts = new Map<string, number>();
      for (const c of found) counts.set(c.typeId, (counts.get(c.typeId) ?? 0) + 1);
      for (const [name, n] of expected) if (counts.get(name) !== n) problems.push(`${name}: ${counts.get(name) ?? 0} in the world, ${n} in the template`);
      for (const [name, n] of counts) if (!expected.has(name)) problems.push(`${name}: ${n} in the world, none in the template`);

      const chests = found.filter((c) => c.typeId === "minecraft:chest");
      const perFloor = FLOOR_SLAB_Y.map((y) => chests.filter((c) => c.at[1] === loc[1] + y + 1).length);
      if (chests.length !== 25 || perFloor.join("/") !== "5/8/12") problems.push(`chests ${chests.length}, per floor ${perFloor.join("/")}`);
      const spawners = found.filter((c) => c.typeId === "minecraft:mob_spawner").map((c) => fmt(c.at));
      const wantSpawners = SPAWNERS.map((s) => fmt(toWorld(loc, local(s.at), SIZE, rot)));
      if (spawners.length !== 3 || !wantSpawners.every((p) => spawners.includes(p))) problems.push(`spawners at ${spawners.join(" ")}, expected ${wantSpawners.join(" ")}`);
      const chestAt = new Set(chests.map((c) => fmt(c.at)));
      for (const c of CHESTS.flat()) if (!chestAt.has(fmt(toWorld(loc, local(c.at), SIZE, rot)))) problems.push(`no chest at template ${fmt(local(c.at))}`);

      // Door and blades on one face: project onto the rotated front normal from the rotated centre.
      const facing = rotateCardinal("north", rot);
      const n: Vec3 = { north: [0, 0, -1], east: [1, 0, 0], south: [0, 0, 1], west: [-1, 0, 0] }[facing] as Vec3;
      const c = toWorld(loc, centre, SIZE, rot);
      const proj = (p: Vec3): number => (p[0] - c[0]) * n[0] + (p[2] - c[2]) * n[2];
      const doors = found.filter((f) => f.typeId === "minecraft:wooden_door");
      const doorFacing = rotateCardinal(DOOR_FACING, rot);
      for (const [label, p, upper] of [["lower", DOOR_LOWER, false], ["upper", DOOR_UPPER, true]] as const) {
        const w = fmt(toWorld(loc, local(p), SIZE, rot));
        const d = doors.find((f) => fmt(f.at) === w);
        if (d === undefined) problems.push(`door ${label}: none at ${w}`);
        else if (d.states.upper_block_bit !== upper || d.states["minecraft:cardinal_direction"] !== doorFacing)
          problems.push(`door ${label}: ${JSON.stringify(d.states)}, expected facing ${doorFacing}`);
      }
      const doorFront = doors.length === 2 ? Math.min(...doors.map((d) => proj(d.at))) : -1;
      const blades = found.filter((f) => f.typeId === BLADE_SPAR || f.typeId === BLADE_SAIL);
      const behind = blades.filter((f) => proj(f.at) <= doorFront);
      if (doors.length !== 2 || doorFront < 7) problems.push(`${doors.length} door block(s), door ${doorFront} from the centre towards ${facing}`);
      if (blades.length === 0 || behind.length > 0) problems.push(`${blades.length} blade blocks, ${behind.length} not in front of the ${facing} wall`);

      for (const p of problems) log(`windmill rot=${rot * 90} MISMATCH ${p}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} mismatch(es)`}`);
      log(`windmill rot=${rot * 90}: front=${facing} door=${doorFacing} chests=${chests.length} (${perFloor.join("/")}) spawners=${spawners.length} blades=${blades.length} blocks=${found.length}`);
      await test.idle(1);
    }
    log(`windmill rotations: ${verdicts.join(" ")}`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), `rotations: ${verdicts.join(" ")}`);
    test.succeed();
  } finally {
    done();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------ AC6: the floor-3 spawner's Vindicator holds an iron axe

const SPAWN_WAIT_TICKS = 2400;
const VINDICATOR = "minecraft:vindicator";
const TAG = "andrew_gt_windmill_vind";

/** Main-hand item of a mob: the equippable component when the engine exposes it, else a hasitem selector. */
function mainHand(dim: Dimension, e: Entity): string {
  try {
    const item = e.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand);
    if (item !== undefined) return item.typeId;
  } catch (err) {
    log(`windmill axe: equippable threw ${String(err)}`);
  }
  e.addTag(TAG);
  const holds = (item: string): boolean | string => {
    try {
      return dim.runCommand(`execute if entity @e[tag=${TAG},hasitem={item=${item},location=slot.weapon.mainhand}]`).successCount > 0;
    } catch (err) {
      return String(err);
    }
  };
  // A selector that matches anything would read as "has an axe": the control must say no.
  const control = holds("golden_sword");
  if (control !== false) return `unknown (hasitem control golden_sword answered ${String(control)})`;
  const axe = holds("iron_axe");
  return axe === true ? "minecraft:iron_axe (hasitem, control negative)" : `not iron_axe (hasitem: ${String(axe)})`;
}

registerAsync("andrew", "windmill_vindicator_axe", async (test: Test): Promise<void> => {
  const { dim, loc, slab, done } = await site(test, "andrew_gt_windmill_b");
  const difficultyBefore = world.getDifficulty();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  try {
    fillBox(dim, slab, "minecraft:stone");
    place(dim, loc, 0);
    await test.idle(2);
    const spawner = toWorld(loc, local(SPAWNERS[2].at), SIZE, 0);
    test.assert(dim.getBlock(v(spawner))?.typeId === "minecraft:mob_spawner", `no spawner at ${fmt(spawner)}`);

    // Floor 3, next to the stair head, 7 blocks from the spawner; unhurt by what it spawns.
    const stand: Vec3 = [loc[0] + 20 - b.x, loc[1] + 15 - b.y, loc[2] + 23 - b.z];
    const player = test.spawnSimulatedPlayer(v(stand), "andrew_windmill", GameMode.Survival);
    player.addEffect("resistance", SPAWN_WAIT_TICKS + 600, { amplifier: 255, showParticles: false });
    // Peaceful (the server default) forbids hostile spawns, spawners included.
    world.setDifficulty(Difficulty.Easy);

    const zone: string[] = [];
    for (const [dx, dz] of [[0, 1], [1, 0], [-1, 0], [0, -1], [2, 2], [-2, 2]]) {
      const p: Vec3 = [spawner[0] + dx, spawner[1] + 1, spawner[2] + dz];
      zone.push(`${fmt(p)}=${dim.getLightLevel(v(p))}/${dim.getSkyLightLevel(v(p))}`);
    }
    log(`windmill axe: light (combined/sky) around the floor-3 spawner ${zone.join(" ")}`);

    let vindicator: Entity | undefined;
    let tick = 0;
    for (; tick <= SPAWN_WAIT_TICKS && vindicator === undefined; tick += 20) {
      vindicator = dim.getEntities({ location: v(spawner), maxDistance: 10, type: VINDICATOR })[0];
      if (vindicator === undefined) await test.idle(20);
    }
    const others = dim
      .getEntities({ location: v([loc[0] + 17, loc[1] + 8, loc[2] + 18]), maxDistance: 20 })
      .filter((e) => e.typeId !== "minecraft:player")
      .map((e) => `${e.typeId}@y${Math.floor(e.location.y - loc[1])}`);
    log(`windmill axe: mobs in the building after ${tick} ticks: ${others.join(" ") || "none"}`);
    test.assert(vindicator !== undefined, `no Vindicator from the floor-3 spawner within ${SPAWN_WAIT_TICKS / 20} s`);
    if (vindicator === undefined) return;
    await test.idle(2);
    const hand = mainHand(dim, vindicator);
    log(`windmill axe RESULT: spawner Vindicator ${vindicator.id} at y${Math.floor(vindicator.location.y - loc[1])} holds ${hand}`);
    test.assert(hand.startsWith("minecraft:iron_axe"), `the floor-3 Vindicator holds ${hand}, not an iron axe`);
    test.succeed();
  } finally {
    world.setDifficulty(difficultyBefore);
    for (const e of dim.getEntities({ location: v([loc[0] + 17, loc[1] + 15, loc[2] + 17]), maxDistance: 48 })) {
      if (e.typeId !== "minecraft:player" && e.typeId !== "minecraft:item") e.remove();
    }
    done();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(SPAWN_WAIT_TICKS + 900)
  .tag("andrew");

export const WINDMILL_TESTS = ["windmill_rotations", "windmill_vindicator_axe"];

log(`registered ${WINDMILL_TESTS.length} windmill test(s): ${WINDMILL_TESTS.join(" ")}`);
