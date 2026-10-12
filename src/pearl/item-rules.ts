// Pure rules of the Pearl Rod as an item (spec v3 §6; L0-pear-ent1, L0-pear-pr01, L0-pear-ru04). Values in,
// values out: no engine call, so tests/pearl-item.test.mjs bundles this file with esbuild.

/** The recipe's output. A recipe cannot mark a vanilla rod, so it yields this and the swap turns it into one. */
export const TOKEN_ID = "andrew:pearl_rod_token";
export const ROD_ID = "minecraft:fishing_rod";
/** Item dynamic property: the rod's id. A fishing rod carrying it is a Pearl Rod; nothing else is. */
export const MARK_KEY = "andrew:pearl_rod";

// A real vanilla rod has no translation key of its own to point at, so the name and the lore are literal
// strings and read the same in every client language (xq12 item 2).
export const ROD_NAME = "Перовый сокровятель";
export const LORE_TITLE = "Pearl Rod";
export const LORE_UNBOUND = "unbound";

/** A use (cast or reel) is repaired in its own event and checked again this many ticks later. */
export const REPAIR_AFTER_USE_TICKS = 1;
/** The shared hand check. A ground reel costs 2 of the rod's 384 (probe Q7): no burst of uses between two checks breaks it. */
export const HAND_CHECK_TICKS = 20;

/** The two shapes the item rules read: what an ItemStack, or an item entity's stack, carries. */
export interface StackView {
  typeId: string;
  /** The value of MARK_KEY; undefined when the stack has none. */
  mark: unknown;
  /** `minecraft:durability` damage; undefined for an item without durability. */
  damage: number | undefined;
}

export function isToken(typeId: string | undefined): boolean {
  return typeId === TOKEN_ID;
}

export function isPearlRod(view: Pick<StackView, "typeId" | "mark">): boolean {
  return view.typeId === ROD_ID && typeof view.mark === "string" && view.mark.length > 0;
}

/** What the item module does with a stack it finds: swap a token, zero a worn Pearl Rod, or leave it alone. */
export type ItemAction = "swap" | "repair" | "none";

export function itemAction(view: StackView | undefined): ItemAction {
  if (view === undefined) return "none";
  if (isToken(view.typeId)) return "swap";
  if (isPearlRod(view) && view.damage !== undefined && view.damage > 0) return "repair";
  return "none";
}

/** A fresh rod id: unique enough per world, never empty. `rand` is Math.random on the engine. */
export function newRodId(now: number, rand: () => number): string {
  const tail = Math.floor(rand() * 36 ** 8)
    .toString(36)
    .padStart(8, "0");
  return `${Math.max(0, Math.floor(now)).toString(36)}-${tail}`;
}

/** The lore of a rod that carries no binding: the English title, then its state. */
export function unboundLore(): string[] {
  return [LORE_TITLE, LORE_UNBOUND];
}

/** Rods a token stack of `amount` turns into: one per token, never fewer than one. */
export function rodsFor(amount: number): number {
  return Number.isFinite(amount) && amount > 1 ? Math.floor(amount) : 1;
}
