"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Global UI state for the overlays that any page can open:
 *  - the navigation menu (hamburger)
 *  - the instruction drawer (chat icon on any recipe card or detail page)
 *  - the settings modal
 *
 * Kept in one provider so a card deep in the grid can open the drawer with
 * recipe context without prop-drilling.
 */

export interface DrawerContext {
  recipeId?: string;
  recipeTitle?: string;
}

interface ShellState {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  drawer: { open: boolean; context: DrawerContext };
  openDrawer: (context?: DrawerContext) => void;
  closeDrawer: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  /** The recipe currently on screen, so the nav chat bubble opens the drawer about it. */
  setContextRecipe: (context: DrawerContext | null) => void;
}

const Ctx = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawer, setDrawer] = useState<{ open: boolean; context: DrawerContext }>({ open: false, context: {} });
  const [contextRecipe, setContextRecipe] = useState<DrawerContext | null>(null);

  const openDrawer = useCallback(
    (context?: DrawerContext) => {
      setMenuOpen(false);
      setDrawer({ open: true, context: context ?? contextRecipe ?? {} });
    },
    [contextRecipe],
  );
  const closeDrawer = useCallback(() => setDrawer((d) => ({ ...d, open: false })), []);

  const value = useMemo<ShellState>(
    () => ({ menuOpen, setMenuOpen, drawer, openDrawer, closeDrawer, settingsOpen, setSettingsOpen, setContextRecipe }),
    [menuOpen, drawer, openDrawer, closeDrawer, settingsOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}
