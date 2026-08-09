"use client";

import { Sun, Moon } from "lucide-react";

import { useThemeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { mounted, isDark, toggle } = useThemeToggle();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-hidden>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full border border-transparent hover:border-blue-500/40 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
      onClick={toggle}
      aria-label={isDark ? "Activate light mode" : "Activate dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-300 transition-transform duration-200" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600 transition-transform duration-200" />
      )}
    </Button>
  );
}
