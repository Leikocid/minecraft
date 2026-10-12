// The enchanting roller of spec §4 (L0-adr-enrl, L0-ench-roll): an item id, a table tier and a random source in, an
// enchantment list out. Pure and engine-free — every random number comes from the caller's `rng`, so the §5 statistics
// run under node with a seed. Nothing in the game calls it until xq11 approves an adapter.

import { forbiddenFor } from "../legendary/enchant-rules";
import {
  CURSES,
  EXTRA_CHANCE_PER_TIER,
  LEVEL_CHANCES,
  LEVEL_RULE_IDS,
  MAX_EXTRAS,
  MAX_LEVEL,
  RARE_CHANCE,
  TREASURE,
  type Tier,
  conflicts,
  eligibleFor,
  levelCap,
  specialLevel,
} from "./roll-rules";

/** Uniform in [0, 1). */
export type Rng = () => number;

export interface RollRequest {
  itemId: string;
  tier: Tier;
  rng: Rng;
}

export interface RolledEnchantment {
  id: string;
  level: number;
}

/** `none`: the item has no eligible treasure, so the generation does not count toward the 20 % (L0-ench-r004). */
export type RareStage = "hit" | "miss" | "none";

/** One draw of `rng`, in draw order. */
export interface TraceEntry {
  stage: "rare" | "count" | "pick" | "level";
  /** `pick`, `level`: the enchantment the draw was for. */
  id?: string;
  u: number;
  /** `rare`, `count` and the level rule's rungs: whether the draw passed. */
  success?: boolean;
  /** The level rule's rung; absent on a uniform level draw. */
  rung?: 1 | 2 | 3;
}

export interface EnchantRoll {
  enchantments: RolledEnchantment[];
  /** False when the table does not enchant the item at all; such a request is not a generation. */
  eligible: boolean;
  rareStage: RareStage;
  trace: TraceEntry[];
}

/**
 * Throws on a result §4 forbids: a curse, an id outside `eligible` or in `forbidden`, a duplicate, a conflicting pair,
 * a level outside 1..vanilla max. The roller calls it last and never repairs what it finds (L0-ench-roll step 6).
 */
export function assertValid(enchantments: readonly RolledEnchantment[], eligible: readonly string[], forbidden: readonly string[] = []): void {
  const seen: string[] = [];
  for (const { id, level } of enchantments) {
    if (CURSES.has(id)) throw new Error(`curse ${id} in a roll`);
    if (forbidden.includes(id)) throw new Error(`forbidden ${id} in a roll`);
    if (!eligible.includes(id)) throw new Error(`${id} is not eligible`);
    const max = MAX_LEVEL.get(id) ?? 0;
    if (!Number.isInteger(level) || level < 1 || level > max) throw new Error(`${id} level ${level} outside 1..${max}`);
    if (seen.includes(id)) throw new Error(`${id} twice in a roll`);
    const rival = seen.find((other) => conflicts(other, id));
    if (rival !== undefined) throw new Error(`${rival} and ${id} conflict`);
    seen.push(id);
  }
}

/**
 * One generation over an explicit eligible set — curses and forbidden ids already removed. rollEnchantments() is this
 * over the item's set; tests call it directly for a set with no treasure.
 */
export function rollFrom(eligible: readonly string[], tier: Tier, rng: Rng): EnchantRoll {
  if (tier !== 1 && tier !== 2 && tier !== 3) throw new RangeError(`tier ${String(tier)} is not 1, 2 or 3`);
  const trace: TraceEntry[] = [];
  if (eligible.length === 0) return { enchantments: [], eligible: false, rareStage: "none", trace };
  const next = (): number => {
    const u = rng();
    if (!(u >= 0 && u < 1)) throw new RangeError(`rng returned ${u}, outside [0, 1)`);
    return u;
  };
  const check = (stage: "rare" | "count", chance: number): boolean => {
    const u = next();
    trace.push({ stage, u, success: u < chance });
    return u < chance;
  };
  const pick = (pool: readonly string[]): string => {
    const u = next();
    const id = pool[Math.floor(u * pool.length)];
    trace.push({ stage: "pick", id, u });
    return id;
  };

  const rare = eligible.filter((id) => TREASURE.has(id));
  const standard = eligible.filter((id) => !TREASURE.has(id));
  const rareStage: RareStage = rare.length === 0 ? "none" : check("rare", RARE_CHANCE) ? "hit" : "miss";
  // A miss holds no treasure at all; otherwise the observed rate would exceed 20 % (L0-ench-r004).
  const allowed = rareStage === "hit" ? eligible : standard;
  const chosen: string[] = [];
  const open = (): string[] => allowed.filter((id) => !chosen.includes(id) && !chosen.some((c) => conflicts(c, id)));
  // The guaranteed treasure is chosen first, so no later pick can push it out (L0-ench-r002).
  if (rareStage === "hit") chosen.push(pick(rare));
  else if (standard.length > 0) chosen.push(pick(standard));
  for (let extra = 0; extra < MAX_EXTRAS; extra++) {
    const pool = open();
    if (pool.length === 0 || !check("count", EXTRA_CHANCE_PER_TIER * tier)) break;
    chosen.push(pick(pool));
  }

  const enchantments = chosen.map((id) => {
    const cap = levelCap(id, tier);
    if (!LEVEL_RULE_IDS.has(id)) {
      const u = next();
      trace.push({ stage: "level", id, u });
      return { id, level: 1 + Math.floor(u * cap) };
    }
    // All three rungs are drawn every time: §5 asks for independent checks, not a cascade.
    const draws = LEVEL_CHANCES.map((chance, i) => {
      const u = next();
      trace.push({ stage: "level", id, rung: (i + 1) as 1 | 2 | 3, u, success: u < chance });
      return u;
    });
    return { id, level: specialLevel([draws[0], draws[1], draws[2]], cap) };
  });

  assertValid(enchantments, eligible);
  return { enchantments, eligible: true, rareStage, trace };
}

export function rollEnchantments(request: RollRequest): EnchantRoll {
  const eligible = eligibleFor(request.itemId);
  const roll = rollFrom(eligible, request.tier, request.rng);
  assertValid(roll.enchantments, eligible, forbiddenFor(request.itemId));
  return roll;
}
