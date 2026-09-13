"use client";

import { useState } from "react";
import { Check, LoaderCircle, ShoppingBasket } from "lucide-react";
import { api } from "@/lib/client/api";
import { announceCartChange } from "@/lib/client/cartEvents";

/** Toggle a recipe in the open gather cart. */
export function AddToCartButton({ recipeId, cartId, initialInCart }: { recipeId: string; cartId: string; initialInCart: boolean }) {
  const [inCart, setInCart] = useState(initialInCart);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await api(`/api/shopping/${cartId}/recipes`, { method: inCart ? "DELETE" : "POST", json: { recipe_id: recipeId } });
      setInCart((v) => !v);
      announceCartChange();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="btn btn-sm" data-active={inCart} aria-pressed={inCart} onClick={toggle} disabled={busy} title={inCart ? "In your shopping cart. Click to remove." : "Add this recipe's ingredients to the shopping cart"}>
      {busy ? <LoaderCircle size={15} className="animate-spin" /> : inCart ? <Check size={15} /> : <ShoppingBasket size={15} />}
      <span className="hidden sm:inline">{inCart ? "In shopping" : "Add to shopping"}</span>
    </button>
  );
}
