// The Dragon Katana module. Deviations from the spec: README.md (C-16).

import { registerKatanaInput } from "./activation";

export { type Activation, type ActivationObserver, activate, observeActivations } from "./activation";

export function registerDragonKatana(): void {
  registerKatanaInput();
  console.warn("[andrew] dragon katana armed (itemUse + itemStartUseOn)");
}
