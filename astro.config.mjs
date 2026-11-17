// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://topendclub.org',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
