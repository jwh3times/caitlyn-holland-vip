# Theme access goes through useThemeToggle(), not next-themes directly

`components/theme-provider.tsx` owns the whole `next-themes` surface. A children-only `Theme` provider holds the fixed configuration, and `useThemeToggle()` is the only way a component reads or changes the theme. It returns `{ mounted, isDark, toggle }`, folding the mounted guard into the hook so no consumer has to remember it.

The obvious alternative — calling `useTheme()` wherever the theme is needed — spreads the library across the codebase and makes every consumer responsible for the hydration guard. `next-themes` reads `localStorage` on the client only, so a component that renders theme-dependent markup before mount produces a hydration mismatch.

## Consequences

- Consumers must render server-matching fallback UI until `mounted` is true.
- Importing `useTheme` from `next-themes` anywhere outside `theme-provider.tsx` is a regression, not a shortcut.
