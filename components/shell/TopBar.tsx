"use client";

import Link from "next/link";
import { Menu, MessageCircle, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useShell } from "./ShellProvider";

export function TopBar() {
  const { setMenuOpen, openDrawer, setSettingsOpen } = useShell();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="display text-xl leading-none">
          {APP_NAME}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Talk to the agent"
            title="Give the agent instructions"
            onClick={() => openDrawer()}
          >
            <MessageCircle size={20} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
