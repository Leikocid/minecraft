// The Dragon Katana module. Deviations from the spec: README.md (C-16).

import { registerKatanaInput } from "./activation";
import { registerFallProtection } from "./fall";
import { registerPetalTrail } from "./trail";

export { type Activation, type ActivationObserver, activate, observeActivations } from "./activation";

export function registerDragonKatana(): void {
  registerKatanaInput();
  registerFallProtection();
  registerPetalTrail();
  console.warn("[andrew] dragon katana armed (itemUse + itemStartUseOn)");
}
