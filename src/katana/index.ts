// The Dragon Katana module. Deviations from the spec: README.md (C-16).

import { registerKatanaInput } from "./activation";
import { registerFallProtection } from "./fall";

export { type Activation, type ActivationObserver, activate, observeActivations } from "./activation";

export function registerDragonKatana(): void {
  registerKatanaInput();
  registerFallProtection();
  console.warn("[andrew] dragon katana armed (itemUse + itemStartUseOn)");
}
