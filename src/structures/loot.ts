// Chest fill for placed structures (L0-loot): the custom table of
// loot-table.ts for the Windmill and the Airship, a vanilla table through
// `/loot insert` for the Warden City and the Bastion. Holds no state of its
// own: "filled" is the registry's `looted`, and the chest's contents are the
// loot. The engine comes in through LootEngineApi, so node tests drive the
// same code over a fake chest.

import type { Container, Dimension, EnchantmentType, ItemStack } from "@minecraft/server";
import { type LootStack, type Rng, rollChest, scatterSlots, seededRng } from "./loot-table";
import type { ChestCtx, PlaceHooks } from "./place";
import type { Vec3 } from "./registry";

/** The `table` a structure body names for the custom path. */
export const CUSTOM_TABLE = "andrew:custom";
export const ANCIENT_CITY = "chests/ancient_city";
export const BASTION_TREASURE = "chests/bastion_treasure";
export const BASTION_OTHER = "chests/bastion_other";
/** Unconditional and never empty: the control that proves a read hits the filled chest. */
export const CONTROL_TABLE = "chests/simple_dungeon";

/** The id shape `/loot insert` accepts, quoted, with no `loot_tables/` prefix or `.json` suffix. */
const VANILLA_ID = /^chests\/[a-z0-9_/]+$/;

export class LootError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LootError";
  }
}

export type LootContainer = Pick<Container, "size" | "getItem" | "setItem">;
export type LootDimension = Pick<Dimension, "getBlock" | "runCommand">;

export interface LootEngineApi {
  ItemStack: typeof ItemStack;
  EnchantmentType: typeof EnchantmentType;
}

const where = (p: Vec3): string => p.join(" ");

function containerAt(dim: LootDimension, pos: Vec3): LootContainer {
  const c = dim.getBlock({ x: pos[0], y: pos[1], z: pos[2] })?.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new LootError(`loot: no container at ${where(pos)}`);
  return c;
}

/** Occupied slots as "slot:typeId x amount", in slot order. */
export function contents(c: LootContainer): string[] {
  const out: string[] = [];
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s !== undefined) out.push(`${i}:${s.typeId}x${s.amount}`);
  }
  return out;
}

export function vanillaCommand(pos: Vec3, table: string): string {
  if (!VANILLA_ID.test(table)) throw new LootError(`loot: "${table}" is not a vanilla chest table id`);
  return `loot insert ${where(pos)} loot "${table}"`;
}

export class Loot {
  constructor(
    private readonly dim: LootDimension,
    private readonly api: LootEngineApi,
    private readonly log: (msg: string) => void = (m) => console.warn(m)
  ) {}

  private fail(msg: string): never {
    this.log(msg);
    throw new LootError(msg);
  }

  /**
   * A vanilla table into the empty chest at world `pos`. Returns the occupied
   * slot count read back from the container.
   *
   * `/loot insert` reports successCount=1 on a full chest and on an unknown
   * table alike while writing nothing, so both the precondition (empty) and
   * the result (non-empty) are read from the container.
   */
  fillVanilla(pos: Vec3, table: string): number {
    const command = vanillaCommand(pos, table);
    const c = containerAt(this.dim, pos);
    const before = contents(c);
    if (before.length > 0) {
      this.fail(`loot: chest at ${where(pos)} is occupied (${before.length} slots), refusing "${table}": the insert would be dropped`);
    }
    const r = this.dim.runCommand(command);
    const after = contents(c).length;
    if (after === 0) this.fail(`loot: "${command}" left the chest at ${where(pos)} empty (successCount=${r.successCount})`);
    return after;
  }

  /**
   * The custom table into the chest at world `pos`, one stack per attempt in
   * distinct scattered slots. With the same `rng` seed a repeat writes the same
   * slots, so a chest holding exactly its own planned stacks is refilled in
   * place; anything else in it is an occupied chest.
   */
  fillCustom(pos: Vec3, rng: Rng): LootStack[] {
    const c = containerAt(this.dim, pos);
    const stacks = rollChest(rng);
    const slots = scatterSlots(rng, c.size, stacks.length);
    const planned = new Map(slots.map((slot, i) => [slot, stacks[i]]));
    const foreign: string[] = [];
    for (let i = 0; i < c.size; i++) {
      const have = c.getItem(i);
      const want = planned.get(i);
      if (have !== undefined && (have.typeId !== want?.typeId || have.amount !== want.amount)) foreign.push(`${i}:${have.typeId}x${have.amount}`);
    }
    if (foreign.length > 0) this.fail(`loot: chest at ${where(pos)} is occupied (${foreign.join(" ")}), refusing the custom table`);

    stacks.forEach((s, i) => c.setItem(slots[i], this.stack(s)));
    return stacks;
  }

  private stack(s: LootStack): ItemStack {
    const item = new this.api.ItemStack(s.typeId, s.amount);
    if (s.enchants.length === 0) return item;
    const ench = item.getComponent("minecraft:enchantable");
    if (ench === undefined) this.fail(`loot: ${s.typeId} is not enchantable`);
    for (const e of s.enchants) {
      const enchantment = { type: new this.api.EnchantmentType(e.id), level: e.level };
      // The table already excludes rivals; the engine's own check is the final word (L0-loot-asm3).
      if (ench.canAddEnchantment(enchantment)) ench.addEnchantment(enchantment);
      else this.log(`loot: ${e.id} ${e.level} refused on ${s.typeId}, skipped`);
    }
    return item;
  }

  /** The Placer hook: dispatches on the chest's table; the custom path is seeded per instance and chest. */
  readonly hooks: PlaceHooks = {
    fillChest: (ctx: ChestCtx): void => {
      if (ctx.table === CUSTOM_TABLE) this.fillCustom(ctx.pos, seededRng(`${ctx.instance.id}#${ctx.index}`));
      else this.fillVanilla(ctx.pos, ctx.table);
    },
  };
}
