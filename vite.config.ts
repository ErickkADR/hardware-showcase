import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O site é publicado em https://erickkadr.github.io/hardware-showcase/, então os
// assets precisam do prefixo do subdiretório por padrão.
//
// A base não é condicionada ao comando (dev/build/preview) -- isso fazia
// `vite preview` servir na raiz enquanto o HTML já tinha sido gerado apontando
// para /hardware-showcase/, e os assets caíam no fallback de SPA (200 com
// index.html), rendendo página em branco sem erro no console. Em vez disso,
// só uma env var explícita (VITE_BASE_PATH, setada apenas no projeto Vercel,
// que serve na raiz do domínio) sobrescreve o path fixo do GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/hardware-showcase/',
});
