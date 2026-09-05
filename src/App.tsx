import { CardComponente } from './components/CardComponente';
import { CardDiagnostico } from './components/CardDiagnostico';
import { COMPONENTES, DIAGNOSTICOS, SISTEMA, COLETADO_EM } from './data/hardware';

const NUMEROS = [
  { valor: '64 GB', rotulo: 'Memória DDR4', acento: false },
  { valor: '4C / 8T', rotulo: 'Núcleos e threads', acento: false },
  { valor: '8 GB', rotulo: 'VRAM (RTX 3050)', acento: false },
  { valor: '2,1 TB', rotulo: 'Armazenamento total', acento: false },
  { valor: '750 W', rotulo: 'Fonte 80 Plus Gold', acento: false },
  { valor: '6', rotulo: 'Ventoinhas no gabinete', acento: false },
  { valor: '144 Hz', rotulo: 'Taxa do monitor', acento: false },
  { valor: '2400 MHz', rotulo: 'RAM abaixo do nominal', acento: true },
];

/** Um crédito por combinação autor e fonte, preservando a ordem de aparição. */
function creditosUnicos() {
  const vistos = new Set<string>();
  return COMPONENTES.flatMap((c) => {
    const chave = `${c.foto.credito.autor}|${c.foto.credito.fonte}`;
    if (vistos.has(chave)) return [];
    vistos.add(chave);
    return [{ ...c.foto.credito, chave }];
  });
}

/** Escrito por extenso porque o número aparece em texto corrido, não em tabela. */
const POR_EXTENSO: Record<number, string> = {
  4: 'quatro',
  5: 'cinco',
  6: 'seis',
  7: 'sete',
  8: 'oito',
  9: 'nove',
  10: 'dez',
  11: 'onze',
  12: 'doze',
};

function extenso(n: number) {
  return POR_EXTENSO[n] ?? String(n);
}

export default function App() {
  const criticos = DIAGNOSTICOS.filter((d) => d.severidade === 'critico').length;
  const total = COMPONENTES.length;
  const exatas = COMPONENTES.filter((c) => c.foto.fidelidade === 'exata').length;
  const declarados = COMPONENTES.filter((c) => c.origem === 'declarado').length;

  return (
    <div className="casca">
      <header className="topo">
        <div className="container topo-conteudo">
          <div className="marca">
            <span className="marca-pulso" aria-hidden="true" />
            hardware-showcase
          </div>
          <nav className="topo-nav">
            <a href="#pecas">Peças</a>
            <a href="#diagnostico">Diagnóstico</a>
            <a href="#creditos">Créditos</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="container hero">
          <div className="hero-grade">
            <div className="hero-texto">
              <span className="hero-etiqueta">
                Inventário coletado via WMI · {COLETADO_EM}
              </span>
              <h1>
                A máquina, peça por peça,
                <br />
                <em>e onde ela trava.</em>
              </h1>
              <p>
                Inventário completo de um desktop {SISTEMA.socket} rodando {SISTEMA.so}{' '}
                {SISTEMA.versao} (build {SISTEMA.build}). Quase todo número desta página
                foi lido do hardware real através de <code>Win32_*</code>,{' '}
                <code>root\wmi</code> e <code>nvidia-smi</code>. Ao final,{' '}
                {extenso(criticos)} achados críticos e o caminho de upgrade que a placa já
                aceita.
              </p>
            </div>

            <figure className="hero-foto">
              <img
                src={`${import.meta.env.BASE_URL}images/pc.jpg`}
                alt="O desktop montado: gabinete Rise Mode Glass 06X com as seis ventoinhas iluminadas em vermelho, radiador de 240 mm no topo e a RTX 3050 da MSI visível pelo vidro lateral"
                width={1536}
                height={1536}
                decoding="async"
                fetchPriority="high"
              />
              <figcaption>A máquina de onde saiu cada número desta página.</figcaption>
            </figure>
          </div>

          <div className="regua">
            {NUMEROS.map((n) => (
              <div className="regua-item" key={n.rotulo}>
                <div className={`regua-valor${n.acento ? ' acento' : ''}`}>{n.valor}</div>
                <div className="regua-rotulo">{n.rotulo}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container secao" id="pecas">
          <div className="secao-cabeca">
            <span className="secao-numero">01 · COMPONENTES</span>
            <h2>
              {extenso(total).charAt(0).toUpperCase() + extenso(total).slice(1)} peças,{' '}
              {extenso(total)} fotografias
            </h2>
            <p>
              Cada card traz uma fotografia real do hardware. O selo de imagem diz se a foto
              é do modelo exato instalado ou de um equivalente próximo, e {exatas} das{' '}
              {total} são exatas. Onde não há foto pública do modelo, o card explica qual
              peça está na imagem e por quê.
            </p>
            <p>
              O segundo selo separa o que foi <strong>medido</strong> do que foi{' '}
              <strong>informado</strong>. {extenso(declarados).charAt(0).toUpperCase() +
                extenso(declarados).slice(1)}{' '}
              peças não aparecem em nenhuma classe WMI porque não têm via de dados com a
              placa-mãe: a fonte entrega 12V, 5V e 3,3V pelo cabo ATX sem se identificar, e
              as ventoinhas giram por PWM no header sem responder nada de volta. Essas vieram
              do dono da máquina.
            </p>
          </div>

          <div className="grade">
            {COMPONENTES.map((c) => (
              <CardComponente componente={c} key={c.id} />
            ))}
          </div>
        </section>

        <section className="container secao" id="diagnostico">
          <div className="secao-cabeca">
            <span className="secao-numero">02 · DIAGNÓSTICO</span>
            <h2>O que os números revelam</h2>
            <p>
              {extenso(DIAGNOSTICOS.length).charAt(0).toUpperCase() +
                extenso(DIAGNOSTICOS.length).slice(1)}{' '}
              achados, cada um ancorado no valor que o sistema reportou. Onde a recomendação
              tem um custo escondido, a ressalva está escrita junto.
            </p>
          </div>

          <div className="lista-diag">
            {DIAGNOSTICOS.map((d) => (
              <CardDiagnostico diagnostico={d} key={d.id} />
            ))}
          </div>
        </section>
      </main>

      <footer className="rodape" id="creditos">
        <div className="container">
          <div className="aviso-privacidade">
            <strong>Sobre privacidade:</strong> a coleta original incluía endereço MAC e
            números de série da memória e do monitor. Nada disso está neste repositório,
            porque são dados identificáveis que não ajudam em nenhuma decisão de upgrade. O
            que serve para decidir uma troca (part number, socket, slots livres, revisão de
            BIOS e largura do link PCIe) está todo publicado acima.
          </div>

          <h4>Créditos das imagens</h4>
          <div className="creditos">
            {creditosUnicos().map((c) => (
              <div key={c.chave}>
                <strong>{c.autor}</strong>, {c.licenca}
                <br />
                {c.fonte}
              </div>
            ))}
          </div>

          <div className="rodape-fim">
            <span>
              Dados de hardware lidos em {COLETADO_EM} · {SISTEMA.placa} · BIOS{' '}
              {SISTEMA.bios}
            </span>
            <span>
              Construído com React + TypeScript + Vite por{' '}
              <a href="https://github.com/ErickkADR" target="_blank" rel="noreferrer">
                @ErickkADR
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
