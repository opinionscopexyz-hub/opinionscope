import baseConfig from "./base.js";
import nextConfig from "eslint-config-next";

/**
 * ESLint config for Next.js applications
 * Extends base config + Next.js recommended rules
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  ...nextConfig,
  {
    rules: {
      // Relax some rules for development
      "@next/next/no-img-element": "warn",
    },
  },
];
