// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://tunaflow.dev',
  integrations: [react(), mdx()],
  vite: {
    resolve: {
      alias: {
        '~': new URL('./src/', import.meta.url).pathname,
      },
    },
  },
});
