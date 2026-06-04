"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("jeyjo-theme", next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className="grid h-10 w-10 place-items-center rounded-md text-text hover:bg-surface-muted"
    >
      {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

/**
 * Inline script that applies the persisted theme before paint to avoid a
 * flash of the wrong theme. Rendered in <head> via `next/script` strategy
 * "beforeInteractive" is overkill here; a raw script tag is fine.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('jeyjo-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;
