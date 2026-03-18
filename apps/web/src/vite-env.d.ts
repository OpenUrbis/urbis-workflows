/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
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
