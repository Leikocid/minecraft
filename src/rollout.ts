// Which products this pack lets a player reach. The list itself is rollout.json
// at the repo root — the same file the build reads to leave a withheld product's
// recipe out of the archive (scripts/lib/rollout.mjs, docs/dev/rollout.md).
//
// A product that is not rolled out keeps all of its code here: it is withheld,
// not removed, and its tests and GameTest scenarios go on proving it.

import rollout from "../rollout.json";

export type ProductId = keyof typeof rollout.products;

/** False means main.ts must not register the product: the pack ships its code but offers no way in. */
export function isRolledOut(id: ProductId): boolean {
  const product: { enabled: boolean } = rollout.products[id];
  return product.enabled === true;
}
