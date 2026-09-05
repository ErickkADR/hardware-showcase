import { CPUS, GPUS, MINHA_MAQUINA, type Peca } from '../data/pontuacoes';

export interface Jogo {
  appid: number;
  nome: string;
  ano: string | null;
  capa: string | null;
  minimo: string;
  recomendado: string | null;
}

export type Situacao = 'passa' | 'aperta' | 'falha' | 'desconhecido';

export interface Criterio {
  rotulo: string;
  situacao: Situacao;
  exigido: string;
  disponivel: string;
  /** Razão entre o que a máquina tem e o que o jogo pede. 1 = empate. */
  razao?: number;
  observacao?: string;
}

export interface Avaliacao {
  nivel: 'minimo' | 'recomendado';
  situacao: Situacao;
  criterios: Criterio[];
}

export interface Resultado {
  jogo: Jogo;
  minimo: Avaliacao;
  recomendado: Avaliacao | null;
  /** Frase de veredito, já pronta para exibição. */
  veredito: string;
}

/**
 * Recorta o valor de um campo do texto da Steam.
 *
 * O formato vem como "Processor: Core i7-6700 or Ryzen 5 1600 | Memory: 12 GB RAM",
 * então o valor termina no próximo "|" ou no próximo rótulo conhecido.
 */
function campo(texto: string, ...rotulos: string[]): string | null {
  for (const rotulo of rotulos) {
    const re = new RegExp(`${rotulo}\\s*:\\s*([^|]+)`, 'i');
    const m = texto.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Acha as peças citadas num trecho e devolve a de menor score.
 *
 * Requisitos listam alternativas equivalentes ("i7-6700 or Ryzen 5 1600"), e basta
 * atender uma delas. Pegar a menor evita reprovar a máquina por causa da alternativa
 * mais cara que o desenvolvedor citou.
 *
 * A tabela é percorrida por chave mais longa primeiro para que "gtx 1060 6gb" case
 * antes de "gtx 1060".
 */
function acharPeca(trecho: string | null, tabela: Peca[]): Peca | null {
  if (!trecho) return null;
  const alvo = trecho.toLowerCase().replace(/[®™]/g, '').replace(/\s+/g, ' ');

  const achadas: Peca[] = [];
  for (const peca of tabela) {
    if (regexDaChave(peca.chave).test(alvo)) achadas.push(peca);
  }
  if (!achadas.length) return null;
  return achadas.reduce((menor, p) => (p.score < menor.score ? p : menor));
}

const cacheRegex = new Map<string, RegExp>();

/**
 * Transforma "i5-8400" numa regex que também casa "i5 8400" e "I5‑8400".
 *
 * A Steam não é consistente no separador: aparece "Core i3 6300" com espaço e
 * "FX-4350" com hífen, para o mesmo tipo de peça. A chave é quebrada em blocos de
 * letras e de dígitos, e entre eles aceita-se espaço, hífen ou nada.
 *
 * O `(?!\d)` no fim evita que "i5 750" case dentro de "i5-7500", que é outro
 * processador e bem mais rápido.
 */
function regexDaChave(chave: string): RegExp {
  const pronta = cacheRegex.get(chave);
  if (pronta) return pronta;

  const blocos = chave.match(/[a-z]+|\d+/g) ?? [];
  const re = new RegExp(blocos.join('[\\s\\-]*') + '(?!\\d)', 'i');
  cacheRegex.set(chave, re);
  return re;
}

/** Núcleos e clock quando o requisito não cita modelo ("Dual core 2.8 GHz"). */
function cpuGenerica(trecho: string | null): { nucleos: number | null; ghz: number | null } | null {
  if (!trecho) return null;
  const t = trecho.toLowerCase();

  const ghzM = t.match(/(\d+(?:[.,]\d+)?)\s*ghz/);
  const ghz = ghzM ? parseFloat(ghzM[1].replace(',', '.')) : null;

  let nucleos: number | null = null;
  if (/\bdual[\s-]*core\b/.test(t)) nucleos = 2;
  else if (/\bquad[\s-]*core\b/.test(t)) nucleos = 4;
  else if (/\bsix[\s-]*core\b/.test(t)) nucleos = 6;
  else if (/\boct(a|o)[\s-]*core\b/.test(t)) nucleos = 8;
  else {
    const n = t.match(/(\d+)\s*(?:hardware\s*)?(?:cpu\s*)?(?:core|thread)/);
    if (n) nucleos = parseInt(n[1], 10);
  }

  if (ghz === null && nucleos === null) return null;
  return { nucleos, ghz };
}

/** VRAM quando o requisito não cita modelo ("1GB dedicated VRAM", "256 mb video memory"). */
function vramGenerica(trecho: string | null): number | null {
  if (!trecho) return null;
  const t = trecho.toLowerCase();
  const gb = t.match(/(\d+(?:[.,]\d+)?)\s*gb/);
  if (gb) return parseFloat(gb[1].replace(',', '.'));
  const mb = t.match(/(\d+)\s*mb/);
  if (mb) return parseInt(mb[1], 10) / 1024;
  return null;
}

/** Primeiro número seguido de GB. */
function gigas(trecho: string | null): number | null {
  if (!trecho) return null;
  const m = trecho.match(/(\d+(?:[.,]\d+)?)\s*gb/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

/** Classifica uma razão "tenho / preciso" em situação. */
function porRazao(razao: number): Situacao {
  if (razao >= 1) return 'passa';
  if (razao >= 0.8) return 'aperta';
  return 'falha';
}

function avaliar(texto: string, nivel: 'minimo' | 'recomendado'): Avaliacao {
  const m = MINHA_MAQUINA;
  const criterios: Criterio[] = [];

  // Processador
  const trechoCpu = campo(texto, 'processor', 'cpu');
  const cpuPedida = acharPeca(trechoCpu, CPUS);
  if (cpuPedida) {
    const razao = m.cpu.score / cpuPedida.score;
    criterios.push({
      rotulo: 'Processador',
      situacao: porRazao(razao),
      exigido: cpuPedida.chave.toUpperCase(),
      disponivel: m.cpu.nome,
      razao,
    });
  } else {
    // O requisito não cita modelo. Sobra comparar núcleos e clock.
    const generica = cpuGenerica(trechoCpu);
    if (generica) {
      const okNucleos = generica.nucleos === null || m.cpu.nucleos >= generica.nucleos;
      const okGhz = generica.ghz === null || m.cpu.ghz >= generica.ghz;
      const pedido = [
        generica.nucleos ? `${generica.nucleos} núcleos` : null,
        generica.ghz ? `${generica.ghz} GHz` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      criterios.push({
        rotulo: 'Processador',
        situacao: okNucleos && okGhz ? 'passa' : 'aperta',
        exigido: pedido,
        disponivel: `${m.cpu.nucleos} núcleos · ${m.cpu.ghz} GHz`,
        observacao: 'O requisito não cita modelo, então a comparação é por núcleos e clock.',
      });
    } else {
      criterios.push({
        rotulo: 'Processador',
        situacao: 'desconhecido',
        exigido: trechoCpu ?? 'não informado',
        disponivel: m.cpu.nome,
        observacao: 'Nenhum modelo conhecido citado no requisito.',
      });
    }
  }

  // Vídeo
  const trechoGpu = campo(texto, 'graphics', 'video card', 'gpu');
  const gpuPedida = acharPeca(trechoGpu, GPUS);
  if (gpuPedida) {
    const razao = m.gpu.score / gpuPedida.score;
    const vramPedida = gigas(trechoGpu);
    criterios.push({
      rotulo: 'Placa de vídeo',
      situacao: porRazao(razao),
      exigido: gpuPedida.chave.toUpperCase(),
      disponivel: m.gpu.nome,
      razao,
      observacao:
        vramPedida && vramPedida > m.gpu.vramGb
          ? `O jogo pede ${vramPedida} GB de VRAM e a placa tem ${m.gpu.vramGb} GB.`
          : undefined,
    });
  } else {
    // Requisitos antigos costumam pedir só um volume de VRAM.
    const vram = vramGenerica(trechoGpu);
    if (vram !== null) {
      criterios.push({
        rotulo: 'Placa de vídeo',
        situacao: m.gpu.vramGb >= vram ? 'passa' : 'falha',
        exigido: `${vram >= 1 ? `${vram} GB` : `${Math.round(vram * 1024)} MB`} de VRAM`,
        disponivel: `${m.gpu.vramGb} GB (${m.gpu.nome})`,
        observacao: 'O requisito não cita modelo, então a comparação é só por VRAM.',
      });
    } else {
      criterios.push({
        rotulo: 'Placa de vídeo',
        situacao: 'desconhecido',
        exigido: trechoGpu ?? 'não informado',
        disponivel: m.gpu.nome,
        observacao: 'Nenhum modelo conhecido citado no requisito.',
      });
    }
  }

  // Memória
  const ramPedida = gigas(campo(texto, 'memory', 'ram'));
  if (ramPedida) {
    criterios.push({
      rotulo: 'Memória',
      situacao: m.ramGb >= ramPedida ? 'passa' : 'falha',
      exigido: `${ramPedida} GB`,
      disponivel: `${m.ramGb} GB`,
      razao: m.ramGb / ramPedida,
    });
  }

  // Armazenamento
  const discoPedido = gigas(campo(texto, 'storage', 'hard drive', 'hard disk space'));
  if (discoPedido) {
    const cabeNoSistema = m.discoSistemaLivreGb >= discoPedido;
    criterios.push({
      rotulo: 'Armazenamento',
      situacao: m.discoLivreGb >= discoPedido ? 'passa' : 'falha',
      exigido: `${discoPedido} GB`,
      disponivel: `${m.discoLivreGb} GB livres no E:`,
      razao: m.discoLivreGb / discoPedido,
      observacao: cabeNoSistema
        ? undefined
        : `Não cabe no C: (${m.discoSistemaLivreGb} GB livres). Instalar no E: ou D:.`,
    });
  }

  const pior = criterios.reduce<Situacao>((acc, c) => {
    if (c.situacao === 'falha' || acc === 'falha') return 'falha';
    if (c.situacao === 'aperta' || acc === 'aperta') return 'aperta';
    if (c.situacao === 'desconhecido' || acc === 'desconhecido') return 'desconhecido';
    return 'passa';
  }, 'passa');

  return { nivel, situacao: pior, criterios };
}

export function analisar(jogo: Jogo): Resultado {
  const minimo = avaliar(jogo.minimo, 'minimo');
  const recomendado = jogo.recomendado ? avaliar(jogo.recomendado, 'recomendado') : null;

  // Um critério ilegível não é o mesmo que um critério reprovado. Quando o resto
  // passa e só o texto do requisito era vago, dizer "vago" esconde a conclusão útil:
  // nada do que deu para medir ficou perto do limite.
  const soFaltouLer =
    minimo.situacao === 'desconhecido' &&
    minimo.criterios.every((c) => c.situacao === 'passa' || c.situacao === 'desconhecido');

  let veredito: string;
  if (minimo.situacao === 'falha') {
    veredito = 'Não atinge o mínimo.';
  } else if (recomendado?.situacao === 'passa') {
    veredito = 'Roda no recomendado.';
  } else if (recomendado?.situacao === 'aperta') {
    veredito = 'Roda acima do mínimo, perto do recomendado.';
  } else if (minimo.situacao === 'aperta') {
    veredito = 'Roda no limite do mínimo.';
  } else if (soFaltouLer) {
    veredito = 'Provavelmente roda: o que deu para medir passou.';
  } else if (minimo.situacao === 'desconhecido') {
    veredito = 'Requisito vago, veja os detalhes.';
  } else {
    veredito = 'Roda com folga no mínimo.';
  }

  return { jogo, minimo, recomendado, veredito };
}

/** Busca simples por substring, tolerante a acento, símbolo de marca e caixa. */
export function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®™:'’.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
