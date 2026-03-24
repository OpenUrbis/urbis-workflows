/**
 * @open-urbis/map fixes for workflows embed:
 * - Strip per-coordinate console.log in UTM→WGS84 (was freezing the tab on large DWGs + re-renders).
 * - Memoize parseDataToFeatureCollection(data) so geometry work does not run every React render.
 *
 * Keep idempotent so upgrades / already-patched node_modules are safe.
 */
export function openUrbisMapWorkflowFixes() {
  return {
    name: "open-urbis-map-workflow-fixes",
    enforce: "pre",
    transform(code, id) {
      const norm = id.replace(/\\/g, "/");
      if (!norm.includes("node_modules/@open-urbis/map/")) return null;

      if (norm.endsWith("/utm-converter.ts")) {
        if (!code.includes("convertGeometryToWGS84: Exemplo")) return null;
        const next = code.replace(
          /\r?\n  console\.log\(\s*'convertGeometryToWGS84: Exemplo de coordenada convertida:',\s*\r?\n\s*raw\.coordinates\[0\]\[0\],\s*' -> ',\s*result\.coordinates\[0\]\[0\]\s*\);\s*/,
          "\n",
        );
        return next === code ? null : next;
      }

      if (
        norm.endsWith(
          "/MapDataIntegrationField/MapDataIntegrationField.tsx",
        )
      ) {
        let out = code;
        if (
          !out.includes("useMemo") &&
          /import React, \{ useState, useEffect \} from 'react';/.test(out)
        ) {
          out = out.replace(
            "import React, { useState, useEffect } from 'react';",
            "import React, { useState, useEffect, useMemo } from 'react';",
          );
        }
        if (!out.includes("const featureCollection = useMemo(")) {
          out = out.replace(
            /(window\.removeEventListener\('openFeatureModal', handleOpenFeatureModal\);\r?\n  \}, \[\]\);\r?\n\r?\n)(  const handleFileSelection)/,
            `$1  const featureCollection = useMemo(() => {\n    if (!data) return null;\n    return parseDataToFeatureCollection(data);\n  }, [data]);\n\n$2`,
          );
        }
        out = out.replace(
          /\r?\n    const featureCollection = parseDataToFeatureCollection\(data\);\r?\n    const mainGeometry/,
          "\n    const mainGeometry",
        );
        return out === code ? null : out;
      }

      return null;
    },
  };
}
