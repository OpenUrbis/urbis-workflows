/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
  /**
   * HTTP origin for `@open-urbis/map` (e.g. `…/maps/config/map`). Prefer this over a generic API name.
   * Not read by app source directly; `vite.config.js` sets `import.meta.env.VITE_API_URL` from this for the package.
   */
  readonly VITE_OPEN_URBIS_MAP_HTTP_BASE?: string;
  /** @deprecated Prefer `VITE_OPEN_URBIS_MAP_HTTP_BASE`. Still used as fallback in vite.config. */
  readonly VITE_BACK_END_MAP?: string;
  readonly VITE_BACK_END_API: string;
  readonly VITE_BACK_END_PDF: string;
  readonly VITE_BACK_END_FILES: string;
  readonly VITE_MAP: string;
  readonly VITE_ENV: string;
  readonly VITE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
