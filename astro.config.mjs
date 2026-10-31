// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough', // plain <img>, no Cloudflare Images binding needed
    imagesBindingName: false,
  }),
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // old static URLs keep working after the move
  redirects: {
    '/index.html': '/',
    '/stories.html': '/stories',
    '/menu.html': '/menu',
    '/shop.html': '/shop',
  },
});
