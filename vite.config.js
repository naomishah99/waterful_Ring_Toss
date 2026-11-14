import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site from /<repo-name>/
  base: '/waterful_Ring_Toss/',
  // `npm run dev:phone` serves over HTTPS on your Wi-Fi network, because
  // phones only share tilt/shake sensors with HTTPS pages.
  plugins: mode === 'phone' ? [basicSsl()] : [],
}));
