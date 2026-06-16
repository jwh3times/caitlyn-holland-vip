import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // ESLint React replaces eslint-plugin-react (flat-config native, TS-first).
      // "recommended-typescript" needs no type-checking/projectService.
      eslintReact.configs["recommended-typescript"],
    ],
    plugins: {
      "react-hooks": pluginReactHooks,
      "@next/next": pluginNext,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      "react-x": {
        version: "detect",
      },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  // Must come last so formatting rules are disabled (Prettier owns formatting).
  eslintConfigPrettier,
]);
