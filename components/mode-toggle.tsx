"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-hidden>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full border border-transparent hover:border-blue-500/40 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
      onClick={() => setTheme(isDark ? "light" : "dark")}
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
