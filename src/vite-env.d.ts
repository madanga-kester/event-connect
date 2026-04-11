/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  //  other env variables here when needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}