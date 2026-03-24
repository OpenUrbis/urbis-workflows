import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { openUrbisMapWorkflowFixes } from "./vite-plugin-open-urbis-map-fixes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Package root without resolving `pkg/package.json` (many packages omit that from "exports").
 */
function resolvePkgRoot(pkgName) {
  const entry = require.resolve(pkgName);
  let dir = path.dirname(entry);
  for (;;) {
    const pkgJson = path.join(dir, "package.json");
    if (fs.existsSync(pkgJson)) {
      try {
        const { name } = JSON.parse(fs.readFileSync(pkgJson, "utf8"));
        if (name === pkgName) return dir;
      } catch {
        /* continue */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not resolve package root for ${pkgName}`);
    }
    dir = parent;
  }
}

const reactRoot = resolvePkgRoot("react");
const reactDomRoot = resolvePkgRoot("react-dom");
const signalsReactRoot = resolvePkgRoot("@preact/signals-react");
const signalsCoreRoot = resolvePkgRoot("@preact/signals-core");

// Same strategy as map-data-integration-demo: @open-urbis/map is authored for Preact
// (preact/hooks, preact/compat) but runs inside React — alias Preact → React.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  /**
   * App-facing base URL for @open-urbis/map HTTP routes (`/maps/config/map`, intersections, etc.).
   * The package only reads `import.meta.env.VITE_API_URL`; we cannot rename that without forking it.
   * This `define` is the localized bridge: your .env uses `VITE_OPEN_URBIS_MAP_HTTP_BASE` (specific),
   * and only bundled `@open-urbis/map` code sees `VITE_API_URL`.
   */
  const openUrbisMapHttpBase =
    env.VITE_OPEN_URBIS_MAP_HTTP_BASE ||
    env.VITE_BACK_END_MAP ||
    "https://api.mapa.urbis.sampa.br";

  return {
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(openUrbisMapHttpBase),
    },
    plugins: [
      openUrbisMapWorkflowFixes(),
      react({
        babel: {
          plugins: [["module:@preact/signals-react-transform"]],
        },
      }),
    ],
    resolve: {
      alias: {
        react: reactRoot,
        "react-dom": reactDomRoot,
        "@preact/signals-react": signalsReactRoot,
        "@preact/signals-core": signalsCoreRoot,
        "@preact/signals": signalsReactRoot,
        "preact/hooks": reactRoot,
        "preact/compat": reactRoot,
        preact: reactRoot,
      },
    },
    optimizeDeps: {
      include: ["@preact/signals-react", "@preact/signals-core"],
      /** So vite-plugin-open-urbis-map-fixes runs on source (not a pre-bundled blob). */
      exclude: ["@open-urbis/map"],
    },
    server: {
      port: 5176,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
