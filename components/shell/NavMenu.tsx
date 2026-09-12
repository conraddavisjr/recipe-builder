"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Camera, Clock, FolderOpen, LogOut, MessageSquareText, Settings, Sparkles, UserRound, X } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useShell } from "./ShellProvider";

const LINKS = [
  { href: "/", label: "Recipes", hint: "Your library", icon: BookOpen },
  { href: "/profile", label: "Taste profile", hint: "What you love and avoid", icon: UserRound },
  { href: "/groups", label: "Groups", hint: "Occasions with one shopping list", icon: FolderOpen },
  { href: "/inspirations", label: "Inspirations", hint: "Dishes you loved out", icon: Camera },
  { href: "/generator", label: "Recipe generator", hint: "Describe a craving", icon: Sparkles },
  { href: "/instructions", label: "Instructions", hint: "Truths and preferences", icon: MessageSquareText },
  { href: "/history", label: "History", hint: "Every run, explained", icon: Clock },
];

export function NavMenu() {
  const { menuOpen, setMenuOpen, setSettingsOpen } = useShell();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <AnimatePresence>
      {menuOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 backdrop-blur-[2px]" style={{ background: "var(--backdrop)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
          <motion.nav
            className="fixed inset-y-0 left-0 z-50 flex w-[340px] max-w-[88vw] flex-col bg-bg shadow-[var(--shadow-dialog)]"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            aria-label="Main navigation"
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="brand lowercase">{APP_NAME}<span className="brand-star" aria-hidden>✳</span></span>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <ul className="flex-1 px-6 py-2">
              {LINKS.map(({ href, label, hint, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      data-active={active}
                      className="menu-item"
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={17} className="shrink-0" style={{ color: active ? "var(--accent)" : "var(--muted)" }} />
                        <span className="flex flex-col leading-tight">
                          <span className={active ? "font-medium" : ""}>{label}</span>
                          <span className="text-xs text-muted">{hint}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 px-6 py-5">
              <button
                type="button"
                className="btn btn-ghost w-full text-muted"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  setMenuOpen(false);
                  router.push("/login");
                  router.refresh();
                }}
              >
                <LogOut size={15} /> Sign out
              </button>
              <button
                type="button"
                className="btn w-full"
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <Settings size={16} /> Settings
              </button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
