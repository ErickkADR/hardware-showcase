/**
 * Confere a análise contra a base inteira de jogos.
 *
 * Serve para pegar dois problemas: requisito que o parser não entendeu (vira
 * "desconhecido") e veredito que destoa do senso comum sobre o jogo.
 *
 * Uso: npm run testar:analise
 */

import dados from '../public/jogos.json' with { type: 'json' };
import { analisar, type Jogo } from '../src/lib/analisar';

const jogos = dados.jogos as Jogo[];
const contagem: Record<string, number> = {};
const semCpu: string[] = [];
const semGpu: string[] = [];

for (const jogo of jogos) {
  const r = analisar(jogo);
  contagem[r.veredito] = (contagem[r.veredito] ?? 0) + 1;

  const cpu = r.minimo.criterios.find((c) => c.rotulo === 'Processador');
  const gpu = r.minimo.criterios.find((c) => c.rotulo === 'Placa de vídeo');
  if (cpu?.situacao === 'desconhecido') semCpu.push(jogo.nome);
  if (gpu?.situacao === 'desconhecido') semGpu.push(jogo.nome);
}

console.log(`Base: ${jogos.length} jogos\n`);
console.log('Vereditos:');
for (const [v, n] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${v}`);
}

console.log(`\nCPU não reconhecida em ${semCpu.length}: ${semCpu.slice(0, 8).join(', ')}`);
console.log(`GPU não reconhecida em ${semGpu.length}: ${semGpu.slice(0, 8).join(', ')}`);

console.log('\nAmostra:');
for (const nome of ['Cyberpunk 2077', 'ELDEN RING', 'Counter-Strike 2', 'Baldur’s Gate 3']) {
  const jogo = jogos.find((j) => j.nome === nome);
  if (!jogo) continue;
  const r = analisar(jogo);
  console.log(`\n  ${jogo.nome}: ${r.veredito}`);
  for (const c of r.minimo.criterios) {
    const razao = c.razao ? ` (${c.razao.toFixed(2)}x)` : '';
    console.log(`    [${c.situacao.padEnd(12)}] ${c.rotulo}: pede ${c.exigido}${razao}`);
  }
}
