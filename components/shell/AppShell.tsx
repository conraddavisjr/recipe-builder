"use client";

import { usePathname } from "next/navigation";
import { ShellProvider } from "./ShellProvider";
import { TopBar } from "./TopBar";
import { NavMenu } from "./NavMenu";
import { InstructionDrawer } from "./InstructionDrawer";
import { SettingsModal } from "./SettingsModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The login page stands alone: no chrome, no overlays.
  if (pathname === "/login") return <>{children}</>;
  return (
    <ShellProvider>
      <TopBar />
      <div className="flex-1">{children}</div>
      <NavMenu />
      <InstructionDrawer />
      <SettingsModal />
    </ShellProvider>
  );
}
