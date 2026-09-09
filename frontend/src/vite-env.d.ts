/// <reference types="vite/client" />

// Typed access to our own env variables, so `import.meta.env.VITE_API_URL`
// is a `string` and not `any`.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
