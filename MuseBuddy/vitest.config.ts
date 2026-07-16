import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@modules': fileURLToPath(new URL('./modules', import.meta.url)),
      '@schema': fileURLToPath(new URL('./src/schema', import.meta.url)),
    },
  },
});
