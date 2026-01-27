import convexConfig from "@opinion-scope/eslint-config/convex";
import convexPlugin from "@convex-dev/eslint-plugin";

/** @type {import("eslint").Linter.Config[]} */
export default [...convexConfig, ...convexPlugin.configs.recommended];
