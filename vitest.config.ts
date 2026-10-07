import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    // These use node:test and FFmpeg; run them with the Node runner separately.
    exclude: [...configDefaults.exclude, 'services/storyteller-renderer/test/**'],
  },
});
