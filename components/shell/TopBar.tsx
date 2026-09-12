"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useShell } from "./ShellProvider";
import { CookingIndicator } from "./CookingIndicator";

const LINKS = [
  { href: "/", label: "Recipes" },
  { href: "/groups", label: "Groups" },
  { href: "/inspirations", label: "Inspirations" },
  { href: "/generator", label: "Generator" },
  { href: "/profile", label: "Taste profile" },
];

/**
 * Top bar: wordmark with the brand star, inline nav on wide screens, the
 * hamburger for everything else, and the two agent controls on the right.
 */
export function TopBar() {
  const { setMenuOpen, openDrawer, setSettingsOpen } = useShell();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center gap-3 px-[5%]">
        <Link href="/" className="brand lowercase" aria-label={`${APP_NAME} home`}>
          {APP_NAME}<span className="brand-star" aria-hidden>✳</span>
        </Link>
        <nav className="ml-8 hidden items-center gap-6 md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" || pathname.startsWith("/recipes") : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className="nav-link" aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <CookingIndicator />
          <button type="button" className="btn btn-sm hidden sm:inline-flex" onClick={() => openDrawer()} title="Give the agent instructions">
            <MessageCircle size={14} /> Talk to the agent
          </button>
          <button type="button" className="btn btn-ghost btn-icon sm:hidden" aria-label="Talk to the agent" onClick={() => openDrawer()}>
            <MessageCircle size={19} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={19} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
