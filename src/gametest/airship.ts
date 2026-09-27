// The Airship template on a real engine: all four rotations judged by the
// blocks in the world — counts per block type, the 10 chests, the one spawner
// and the two doors on opposite ends (L0-airs-r001/r002), and the spawner's
// block light measured in the engine. Every test clears
// what it placed.

import { BlockTypes, BlockVolume, type Dimension, StructureRotation, type Vector3, world } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { type Box, boxOf, sliceBox } from "../structures/clear";
import type { Rotation, Vec3 } from "../structures/registry";
import { ENGINE_ROTATION, ROTATIONS, rotateCardinal, toWorld } from "../structures/rotate";
import airshipTemplate, { AIRSHIP_ID, AIRSHIP_SIZE, CHESTS, DOORS, GONDOLA, SPAWNER } from "../structures/templates/airship";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const SIZE: Vec3 = [...AIRSHIP_SIZE];

const log = (msg: string): void => console.warn(`[gametest] ${msg}`);
const v = (p: Vec3): Vector3 => ({ x: p[0], y: p[1], z: p[2] });
const fmt = (p: Vec3): string => p.join(",");
const local = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];

const OPPOSITE: Record<string, string> = { north: "south", south: "north", east: "west", west: "east" };
/** Blocks between the two lower door halves in the template. */
const DOOR_GAP = Math.abs(DOORS[1].lower[0] - DOORS[0].lower[0]) + Math.abs(DOORS[1].lower[2] - DOORS[0].lower[2]);
const STEP: Record<string, Vec3> = { north: [0, 0, -1], east: [1, 0, 0], south: [0, 0, 1], west: [-1, 0, 0] };

function fillBox(dim: Dimension, box: Box, block: string): void {
  for (const s of sliceBox(box)) dim.fillBlocks(new BlockVolume(v(s.min), v(s.max)), block);
}

/** Block counts per name straight from the template source, air excluded. */
function templateCounts(): Map<string, number> {
  const t = airshipTemplate();
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

registerAsync("andrew", "airship_rotations", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  // Floating above the platform, as an Airship does; the rotated AABB fits a square of the long side.
  const side = Math.max(SIZE[0], SIZE[2]);
  const loc: Vec3 = [b.x - Math.floor(side / 2), b.y + 12, b.z - Math.floor(side / 2)];
  const box = boxOf(loc, [side, SIZE[1], side]);
  const unload = await loadBox(test, dim, "andrew_gt_airship_a", box);
  const expected = templateCounts();
  const verdicts: string[] = [];
  try {
    const unknown = [...expected.keys()].filter((n) => BlockTypes.get(n) === undefined);
    test.assert(unknown.length === 0, `template names the engine does not know: ${unknown.join(" ")}`);
    fillBox(dim, box, "minecraft:air");

    for (const rot of ROTATIONS) {
      world.structureManager.place(AIRSHIP_ID, dim, v(loc), { rotation: StructureRotation[ENGINE_ROTATION[rot]], includeEntities: false });
      const found = scan(dim, box);
      fillBox(dim, box, "minecraft:air");
      const problems: string[] = [];

      const counts = new Map<string, number>();
      for (const c of found) counts.set(c.typeId, (counts.get(c.typeId) ?? 0) + 1);
      for (const [name, n] of expected) if (counts.get(name) !== n) problems.push(`${name}: ${counts.get(name) ?? 0} in the world, ${n} in the template`);
      for (const [name, n] of counts) if (!expected.has(name)) problems.push(`${name}: ${n} in the world, none in the template`);

      const chests = found.filter((c) => c.typeId === "minecraft:chest");
      const chestAt = new Set(chests.map((c) => fmt(c.at)));
      if (chests.length !== 10) problems.push(`${chests.length} chests`);
      for (const c of CHESTS) if (!chestAt.has(fmt(toWorld(loc, local(c.at), SIZE, rot)))) problems.push(`no chest at template ${fmt(local(c.at))}`);

      const spawners = found.filter((c) => c.typeId === "minecraft:mob_spawner").map((c) => fmt(c.at));
      const wantSpawner = fmt(toWorld(loc, local(SPAWNER.at), SIZE, rot));
      if (spawners.length !== 1 || spawners[0] !== wantSpawner) problems.push(`spawners at ${spawners.join(" ")}, expected ${wantSpawner}`);

      // Doors: each where the template puts it, facing inward, and the two on opposite ends facing each other.
      const doors = found.filter((f) => f.typeId === "minecraft:wooden_door");
      const lowers: { at: Vec3; facing: string }[] = [];
      for (const d of DOORS) {
        const facing = rotateCardinal(d.facing, rot);
        for (const [label, p, upper] of [["lower", d.lower, false], ["upper", d.upper, true]] as const) {
          const w = fmt(toWorld(loc, local(p), SIZE, rot));
          const got = doors.find((f) => fmt(f.at) === w);
          if (got === undefined) problems.push(`door ${label}: none at ${w}`);
          else if (got.states.upper_block_bit !== upper || got.states["minecraft:cardinal_direction"] !== facing)
            problems.push(`door ${label} at ${w}: ${JSON.stringify(got.states)}, expected facing ${facing}`);
          else if (!upper) lowers.push({ at: got.at, facing });
        }
      }
      if (doors.length !== 4) problems.push(`${doors.length} door blocks`);
      if (lowers.length === 2) {
        const [a, c] = lowers;
        const delta: Vec3 = [c.at[0] - a.at[0], c.at[1] - a.at[1], c.at[2] - a.at[2]];
        const len = Math.abs(delta[0]) + Math.abs(delta[2]);
        const step = STEP[a.facing];
        const along = delta[0] === step[0] * len && delta[2] === step[2] * len && delta[1] === 0;
        if (OPPOSITE[a.facing] !== c.facing || !along || len !== DOOR_GAP) problems.push(`doors ${fmt(a.at)}→${a.facing} and ${fmt(c.at)}→${c.facing} are not on opposite ends facing each other`);
      }

      for (const p of problems) log(`airship rot=${rot * 90} MISMATCH ${p}`);
      verdicts.push(`${rot * 90}:${problems.length === 0 ? "ok" : `${problems.length} mismatch(es)`}`);
      log(`airship rot=${rot * 90}: chests=${chests.length} spawners=${spawners.length} doors=${lowers.map((d) => `${fmt(d.at)}→${d.facing}`).join(" ")} blocks=${found.length}`);
      await test.idle(1);
    }
    log(`airship rotations: ${verdicts.join(" ")}`);
    test.assert(verdicts.every((x) => x.endsWith(":ok")), `rotations: ${verdicts.join(" ")}`);
    test.succeed();
  } finally {
    fillBox(dim, box, "minecraft:air");
    for (const e of dim.getEntities({ location: v([loc[0] + side / 2, loc[1] + SIZE[1] / 2, loc[2] + side / 2]), maxDistance: side, type: "minecraft:item" })) e.remove();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

/** The Windmill's Lmax: the brightest block light a spawner cell may have and still spawn. */
const LMAX = 7;

registerAsync("andrew", "airship_spawner_light", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const b = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const loc: Vec3 = [b.x - Math.floor(SIZE[0] / 2), b.y + 12, b.z - Math.floor(SIZE[2] / 2)];
  const box = boxOf(loc, SIZE);
  // An opaque shell round the gondola keeps sky light out, so the combined level inside is block light alone.
  const shell: Box = { min: [loc[0] + GONDOLA.x0 - 1, loc[1] - 1, loc[2] + GONDOLA.z0 - 1], max: [loc[0] + GONDOLA.x1 + 1, loc[1] + GONDOLA.roofY + 1, loc[2] + GONDOLA.z1 + 1] };
  const faces: Box[] = [
    { min: shell.min, max: [shell.max[0], shell.max[1], shell.min[2]] },
    { min: [shell.min[0], shell.min[1], shell.max[2]], max: shell.max },
    { min: shell.min, max: [shell.min[0], shell.max[1], shell.max[2]] },
    { min: [shell.max[0], shell.min[1], shell.min[2]], max: shell.max },
    { min: shell.min, max: [shell.max[0], shell.min[1], shell.max[2]] },
    { min: [shell.min[0], shell.max[1], shell.min[2]], max: shell.max },
  ];
  const unload = await loadBox(test, dim, "andrew_gt_airship_l", { min: shell.min, max: [box.max[0], box.max[1], box.max[2]] });
  try {
    fillBox(dim, box, "minecraft:air");
    world.structureManager.place(AIRSHIP_ID, dim, v(loc), { rotation: StructureRotation[ENGINE_ROTATION[0]], includeEntities: false });
    for (const f of faces) fillBox(dim, f, "minecraft:stone");
    await test.idle(20);

    const at = (p: readonly number[]): Vec3 => toWorld(loc, local(p), SIZE, 0);
    const read = (p: Vec3): { l: number; sky: number } => ({ l: dim.getLightLevel(v(p)), sky: dim.getSkyLightLevel(v(p)) });
    const [sx, sy, sz] = SPAWNER.at;
    // Spawner reach: 4 horizontally, 1 vertically — the walkable corridor row over the spawner.
    const reach: Vec3[] = [];
    for (let x = GONDOLA.x0 + 1; x < GONDOLA.x1; x++) if (Math.abs(x - sx) <= 4) reach.push(at([x, sy + 1, sz]));
    const spawner = read(at(SPAWNER.at));
    const cells = reach.map((p) => ({ p, ...read(p) }));
    // Control: the cabin floor next to a lamp is lit, so a dark reading is not an engine that never computed light.
    const control = read(at([GONDOLA.x0 + 1, sy + 1, sz - 1]));
    log(
      `airship spawner light RESULT spawner ${spawner.l}/${spawner.sky}; corridor in reach ${cells.map((c) => `${fmt(c.p)}=${c.l}/${c.sky}`).join(" ")}; ` +
        `cabin control ${control.l}/${control.sky} (combined/sky)`
    );
    const worst = Math.max(spawner.l, ...cells.map((c) => c.l));
    test.assert([spawner, ...cells, control].every((c) => c.sky === 0), "sky light inside the shell: the reading is not block light alone");
    test.assert(control.l > LMAX, `cabin control ${control.l}: the lamps give no measurable light`);
    test.assert(worst <= LMAX, `block light ${worst} in the spawner reach > Lmax ${LMAX}`);
    test.succeed();
  } finally {
    fillBox(dim, box, "minecraft:air");
    for (const f of faces) fillBox(dim, f, "minecraft:air");
    for (const e of dim.getEntities({ location: v([loc[0] + SIZE[0] / 2, loc[1] + SIZE[1] / 2, loc[2] + SIZE[2] / 2]), maxDistance: SIZE[0], type: "minecraft:item" })) e.remove();
    unload();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

export const AIRSHIP_TESTS = ["airship_rotations", "airship_spawner_light"];

log(`registered ${AIRSHIP_TESTS.length} airship test(s): ${AIRSHIP_TESTS.join(" ")}`);
