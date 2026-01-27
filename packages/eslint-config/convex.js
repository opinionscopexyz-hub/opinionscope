import baseConfig from "./base.js";
import convexPlugin from "@convex-dev/eslint-plugin";

/**
 * ESLint config for Convex backend
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    files: ["**/convex/**/*.ts"],
    plugins: {
      "@convex-dev": convexPlugin,
    },
    rules: convexPlugin.configs.recommended[0].rules,
  },
];
