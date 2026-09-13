/** Fired by anything that changes the gather cart so the top-bar badge updates at once. */
export const CART_CHANGED = "palate:cart-changed";

export function announceCartChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_CHANGED));
}
