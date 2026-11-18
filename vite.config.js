import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => el build funciona en cualquier ruta de cualquier hosting estático
// (raíz de un dominio, subcarpeta de GitHub Pages, Netlify, abrir con un servidor local…).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
