import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// Staging deployment. The site is NOT approved for publication — see
// docs/PLACEHOLDERS.md. The noindex meta in src/layouts/Base.astro and the
// red placeholder banner (chambers.json "_placeholder": true) must stay in
// place until the advocate has signed off on real particulars.
if (process.argv.includes('dev')) {
  process.env.NETLIFY_DEV = 'true';
}

export default defineConfig({
  site: 'https://example.invalid',
  build: { format: 'directory' },
  adapter: netlify(),
  devToolbar: {
    enabled: false,
  },
});
