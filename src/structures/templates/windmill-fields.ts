// The Windmill plot around the building (§4.4): a fixed ~35×35 layout of
// mostly mature wheat, water ditches, dirt paths, abandoned patches and an old
// fence with gaps. Pure data, no @minecraft/server: scripts/build-structures.mjs
// evaluates it in node.

export type StateValue = string | number | boolean;

/** One cell of a declarative template — the legend entry shape of scripts/lib/mcstructure.mjs compileTemplate. */
export interface TemplateBlock {
  name: string;
  states?: Record<string, StateValue>;
  waterlogged?: boolean;
  chest?: { items?: { name: string; count?: number; slot?: number }[] };
  spawner?: { entity: string };
}

export const PLOT = 35;

/** The building footprint and the one-block path ring around it, template-local x/z. */
export const BUILDING = { x0: 10, x1: 24, z0: 11, z1: 25 } as const;

/** Deterministic noise in [0, 1): the plot must be identical on every build. */
export function noise(x: number, y: number, z: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + salt * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const inBuilding = (x: number, z: number): boolean =>
  x >= BUILDING.x0 && x <= BUILDING.x1 && z >= BUILDING.z0 && z <= BUILDING.z1;

const onRing = (x: number, z: number): boolean =>
  !inBuilding(x, z) && x >= BUILDING.x0 - 1 && x <= BUILDING.x1 + 1 && z >= BUILDING.z0 - 1 && z <= BUILDING.z1 + 1;

const onBorder = (x: number, z: number): boolean => x === 0 || z === 0 || x === PLOT - 1 || z === PLOT - 1;

/** The four paths from the ring to the fence; the north one leads straight out of the door. */
function onPath(x: number, z: number): boolean {
  const midX = x >= 16 && x <= 18;
  const midZ = z >= 17 && z <= 18;
  return (midX && (z < BUILDING.z0 - 1 || z > BUILDING.z1 + 1)) || (midZ && (x < BUILDING.x0 - 1 || x > BUILDING.x1 + 1));
}

// Every farmland cell is within 4 blocks of one of these lines: vanilla hydration range.
const onDitch = (x: number, z: number): boolean => x === 4 || x === 30 || z === 5 || z === 30;

const FENCE: TemplateBlock = { name: "minecraft:oak_fence" };
const MATURE_WHEAT: TemplateBlock = { name: "minecraft:wheat", states: { growth: 7 } };

const FARMLAND: TemplateBlock = { name: "minecraft:farmland", states: { moisturized_amount: 7 } };
const GRASS: TemplateBlock = { name: "minecraft:grass_block" };
const DIRT: TemplateBlock = { name: "minecraft:dirt" };
const PATH: TemplateBlock = { name: "minecraft:grass_path" };
const COARSE: TemplateBlock = { name: "minecraft:coarse_dirt" };
const WATER: TemplateBlock = { name: "minecraft:water", states: { liquid_depth: 0 } };
const TUFT: TemplateBlock = { name: "minecraft:short_grass" };
const WEB: TemplateBlock = { name: "minecraft:web" };

/** Field cobwebs close to the building (§4.4), y=1 on field cells. */
const FIELD_WEBS = new Set(["8,12", "26,23", "12,8", "22,28"]);

export interface FieldCell {
  /** y = 0, the plot surface. */
  ground: TemplateBlock;
  /** y = 1, a crop, a fence post or decor. */
  above?: TemplateBlock;
}

/** The plot cell at (x, z); undefined inside the building footprint. */
export function fieldCell(x: number, z: number): FieldCell | undefined {
  if (inBuilding(x, z)) return undefined;
  if (onBorder(x, z)) {
    // Path exits and a sixth of the posts are missing: the fence keeps nothing in.
    const gap = onPath(x, z) || noise(x, 1, z, 7) < 0.16;
    return { ground: GRASS, above: gap ? undefined : FENCE };
  }
  if (onRing(x, z) || onPath(x, z)) return { ground: noise(x, 0, z, 3) < 0.2 ? COARSE : PATH };
  if (onDitch(x, z)) return { ground: WATER };

  if (FIELD_WEBS.has(`${x},${z}`)) return { ground: FARMLAND, above: WEB };
  // Trampled patches come in 3×3 blocks, so they read as bald spots, not noise.
  if (noise(Math.floor(x / 3), 0, Math.floor(z / 3), 11) < 0.1 && noise(x, 0, z, 12) < 0.8) return { ground: DIRT };
  const r = noise(x, 0, z, 5);
  if (r < 0.04) return { ground: GRASS, above: TUFT };
  if (r < 0.09) return { ground: FARMLAND };
  if (r < 0.2) return { ground: FARMLAND, above: { name: "minecraft:wheat", states: { growth: 1 + Math.floor(noise(x, 1, z, 6) * 5) } } };
  return { ground: FARMLAND, above: MATURE_WHEAT };
}
