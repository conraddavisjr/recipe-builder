"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { api } from "@/lib/client/api";
import { CART_CHANGED } from "@/lib/client/cartEvents";

/**
 * Basket icon with a count bubble: how many recipes are in the open cart.
 * Refreshes on load, on every navigation, whenever the cart changes in this
 * tab, and every 30 seconds in case it changed elsewhere (another device).
 */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const refresh = () => api<{ count: number }>("/api/shopping/count").then((d) => active && setCount(d.count)).catch(() => undefined);
    const t = setTimeout(refresh, 0);
    const poll = setInterval(refresh, 30_000);
    window.addEventListener(CART_CHANGED, refresh);
    return () => {
      active = false;
      clearTimeout(t);
      clearInterval(poll);
      window.removeEventListener(CART_CHANGED, refresh);
    };
  }, [pathname]);

  return (
    <Link href="/shop" className="btn btn-ghost btn-icon relative" aria-label={count ? `Shopping cart, ${count} recipe${count === 1 ? "" : "s"}` : "Shopping cart"} title="Shopping cart and history">
      <ShoppingBasket size={19} />
      {count ? (
        <span
          className="absolute -right-0.5 -top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full px-1 text-[0.65rem] font-semibold leading-none tabular-nums"
          style={{ background: "var(--ink)", color: "var(--accent-ink)" }}
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
