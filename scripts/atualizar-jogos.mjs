/**
 * Baixa os requisitos de sistema da Steam e grava public/jogos.json.
 *
 * Por que um script e não uma chamada do navegador: a Steam serve os requisitos em
 * store.steampowered.com/api/appdetails, mas não devolve Access-Control-Allow-Origin.
 * Chamar de erickkadr.github.io é bloqueado pelo CORS do browser. Proxies públicos
 * resolveriam, só que o allorigins vive fora do ar e o corsproxy.io passou a exigir
 * chave paga. Como o site é estático, buscar aqui e versionar o JSON deixa a página
 * sem dependência externa em tempo de execução.
 *
 * O arquivo vai para public/ e não para src/: importado em src/ ele entraria no bundle
 * JavaScript, e com algumas centenas de jogos isso dobra o peso do site para quem nem
 * usa a busca. Em public/ ele é baixado sob demanda e fica no cache do navegador.
 *
 * Uso: npm run jogos
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, '..', 'public', 'jogos.json');

/** Quantos jogos entram na base. */
const LIMITE = Number(process.env.LIMITE ?? 300);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Clássicos que podem não estar em ranking nenhum hoje, mas que alguém provavelmente
 * vai digitar na busca. Entram primeiro para sobreviver ao corte do LIMITE.
 */
const FIXOS = [
  1091500, 1245620, 271590, 292030, 1174180, 1086940, 990080, 1817070, 1888930, 2050650,
  1774580, 2344520, 1240440, 1172620, 892970, 739630, 1145360, 427520, 294100, 1222670,
  413150, 322330, 275850, 108600, 251570, 582010, 1364780, 594650, 306130, 1332010,
  648800, 39210, 220, 620, 400, 8930, 289070, 255710, 105600, 4000,
  550, 236390, 252490, 1966720, 1794680, 2183900, 1203220, 2195250, 1085660, 359550,
];

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Cada fonte devolve appids; falha de uma não derruba as outras. */
const FONTES = [
  {
    nome: 'mais jogados agora',
    async ids() {
      const j = await json('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/');
      return (j.response?.ranks ?? []).map((x) => x.appid);
    },
  },
  {
    nome: 'top de vendas e novidades',
    async ids() {
      const j = await json('https://store.steampowered.com/api/featuredcategories?cc=br');
      return Object.values(j)
        .filter((v) => v && Array.isArray(v.items))
        .flatMap((v) => v.items.map((i) => i.id))
        .filter(Boolean);
    },
  },
  {
    nome: 'lançamentos do top mensal',
    async ids() {
      const j = await json('https://api.steampowered.com/ISteamChartsService/GetTopReleasesPages/v1/');
      return (j.response?.pages ?? []).flatMap((p) => (p.item_ids ?? []).map((i) => i.appid));
    },
  },
  {
    nome: 'SteamSpy: jogados nas 2 semanas',
    async ids() {
      return Object.keys(await json('https://steamspy.com/api.php?request=top100in2weeks')).map(Number);
    },
  },
  {
    nome: 'SteamSpy: mais jogados de sempre',
    async ids() {
      return Object.keys(await json('https://steamspy.com/api.php?request=top100forever')).map(Number);
    },
  },
  {
    nome: 'SteamSpy: mais vendidos de sempre',
    async ids() {
      return Object.keys(await json('https://steamspy.com/api.php?request=top100owned')).map(Number);
    },
  },
];

/** A Steam devolve os requisitos como HTML solto. Vira texto de uma linha. */
function limparHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' | ')
    .replace(/<\/(li|p|div)>/gi, ' | ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\s*\|\s*)+/g, ' | ')
    .trim();
}

/**
 * Busca um jogo, respeitando o limite de requisições da Steam.
 *
 * O appdetails corta em torno de 200 chamadas por 5 minutos e responde 429. Quando isso
 * acontece, esperar e repetir é suficiente: a janela é curta e o backoff cresce a cada
 * tentativa.
 */
async function buscar(appid, tentativa = 0) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  });

  if (resp.status === 429 || resp.status === 403) {
    if (tentativa >= 4) throw new Error(`bloqueado (HTTP ${resp.status})`);
    const espera = 30000 * (tentativa + 1);
    console.log(`      limite atingido, esperando ${espera / 1000}s...`);
    await dormir(espera);
    return buscar(appid, tentativa + 1);
  }
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const entrada = (await resp.json())[String(appid)];
  if (!entrada?.success || !entrada.data) throw new Error('sem dados');

  const d = entrada.data;
  if (d.type !== 'game') throw new Error(`não é jogo (${d.type})`);

  const pc = d.pc_requirements;
  // Jogos só de Mac/Linux devolvem pc_requirements como array vazio.
  if (!pc || Array.isArray(pc)) throw new Error('sem requisitos de PC');

  const minimo = limparHtml(pc.minimum);
  if (!minimo) throw new Error('requisito minimo vazio');

  return {
    appid,
    nome: d.name,
    ano: d.release_date?.date?.match(/\d{4}/)?.[0] ?? null,
    capa: d.header_image ?? null,
    minimo,
    recomendado: limparHtml(pc.recommended) || null,
  };
}

console.log('Montando a lista a partir dos rankings públicos...\n');

const vistos = new Set();
const APPIDS = [];
for (const id of FIXOS) {
  if (!vistos.has(id)) {
    vistos.add(id);
    APPIDS.push(id);
  }
}

for (const fonte of FONTES) {
  try {
    const ids = await fonte.ids();
    let novos = 0;
    for (const id of ids) {
      if (!vistos.has(id)) {
        vistos.add(id);
        APPIDS.push(id);
        novos++;
      }
    }
    console.log(`  ${String(ids.length).padStart(4)} de "${fonte.nome}" (${novos} inéditos)`);
  } catch (erro) {
    console.log(`  falhou "${fonte.nome}": ${erro.message}`);
  }
}

const alvo = APPIDS.slice(0, LIMITE);
console.log(`\n${vistos.size} appids únicos, consultando ${alvo.length}.\n`);

const jogos = [];
const falhas = [];

for (const [i, appid] of alvo.entries()) {
  try {
    const jogo = await buscar(appid);
    jogos.push(jogo);
    console.log(`[${i + 1}/${alvo.length}] ok    ${jogo.nome}`);
  } catch (erro) {
    falhas.push({ appid, motivo: erro.message });
    console.log(`[${i + 1}/${alvo.length}] pula  ${appid}: ${erro.message}`);
  }
  await dormir(1300);
}

jogos.sort((a, b) => a.nome.localeCompare(b.nome));

await writeFile(
  SAIDA,
  JSON.stringify({ atualizadoEm: new Date().toISOString().slice(0, 10), jogos }),
  'utf8',
);

console.log(`\n${jogos.length} jogos gravados em public/jogos.json`);
if (falhas.length) {
  const porMotivo = {};
  for (const f of falhas) porMotivo[f.motivo] = (porMotivo[f.motivo] ?? 0) + 1;
  console.log('Descartados:', JSON.stringify(porMotivo));
}
