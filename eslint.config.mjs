import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const webFiles = ["apps/web/**/*.{ts,tsx}"];

export default defineConfig([
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({ ...config, files: webFiles })),
  ...nextTypeScript.map((config) => ({ ...config, files: webFiles })),
  {
    files: webFiles,
    settings: { next: { rootDir: "apps/web" }, react: { version: "19.2" } },
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "**/dist/**",
    "apps/api/generated/**",
    "node_modules/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
