import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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
  const openUrbisMapHttpBase =
    env.VITE_OPEN_URBIS_MAP_HTTP_BASE ||
    env.VITE_BACK_END_MAP ||
    "https://api.mapa.urbis.sampa.br";

  return {
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(openUrbisMapHttpBase),
    },
    plugins: [
      react({
        babel: {
          plugins: [["module:@preact/signals-react-transform"]],
        },
      }),
    ],
    resolve: {
      /** One React instance app-wide (invalid hook call / `dispatcher.useRef` if duplicated). */
      dedupe: ["react", "react-dom"],
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
    /**
     * Pre-bundle @open-urbis/map (as in d2c38fd). Serving it raw triggers Safari:
     * SyntaxError: Importing binding name 'default' cannot be resolved by star export entries.
     */
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@preact/signals-react",
        "@preact/signals-core",
        "@open-urbis/map",
        "@open-urbis/map-auth",
      ],
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
