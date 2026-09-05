import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O site é publicado em https://erickkadr.github.io/hardware-showcase/, então os
// assets precisam do prefixo do subdiretório.
//
// A base é fixa de propósito. Condicioná-la ao comando ("/" fora do build) faz
// `vite preview` servir na raiz enquanto o HTML já foi gerado apontando para
// /hardware-showcase/. Os assets caem no fallback de SPA e voltam como index.html
// com status 200, o que rende uma página em branco sem nenhum erro no console.
// Com a base fixa, dev e preview servem no mesmo caminho da produção.
export default defineConfig({
  plugins: [react()],
  base: '/hardware-showcase/',
});
