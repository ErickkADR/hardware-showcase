import { CardComponente } from './components/CardComponente';
import { CardDiagnostico } from './components/CardDiagnostico';
import { COMPONENTES, DIAGNOSTICOS, SISTEMA, COLETADO_EM } from './data/hardware';

const NUMEROS = [
  { valor: '64 GB', rotulo: 'Memória DDR4', acento: false },
  { valor: '4C / 8T', rotulo: 'Núcleos e threads', acento: false },
  { valor: '8 GB', rotulo: 'VRAM (RTX 3050)', acento: false },
  { valor: '2,1 TB', rotulo: 'Armazenamento total', acento: false },
  { valor: '144 Hz', rotulo: 'Taxa do monitor', acento: false },
  { valor: '2400 MHz', rotulo: 'RAM abaixo do nominal', acento: true },
];

/** Um crédito por combinação autor + fonte, preservando a ordem de aparição. */
function creditosUnicos() {
  const vistos = new Set<string>();
  return COMPONENTES.flatMap((c) => {
    const chave = `${c.foto.credito.autor}|${c.foto.credito.fonte}`;
    if (vistos.has(chave)) return [];
    vistos.add(chave);
    return [{ ...c.foto.credito, chave }];
  });
}

export default function App() {
  const criticos = DIAGNOSTICOS.filter((d) => d.severidade === 'critico').length;

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
          <span className="hero-etiqueta">
            Inventário coletado via WMI · {COLETADO_EM}
          </span>
          <h1>
            A máquina, peça por peça —<br />
            <em>e onde ela trava.</em>
          </h1>
          <p>
            Inventário completo de um desktop {SISTEMA.socket} rodando {SISTEMA.so}{' '}
            {SISTEMA.versao} (build {SISTEMA.build}). Cada número desta página foi lido do
            hardware real através de <code>Win32_*</code>, <code>root\wmi</code> e{' '}
            <code>nvidia-smi</code> — nada foi digitado à mão. Ao final, {criticos} achados
            críticos e o caminho de upgrade que a placa já aceita.
          </p>

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
            <span className="secao-numero">01 — COMPONENTES</span>
            <h2>Oito peças, oito fotografias</h2>
            <p>
              Cada card traz uma fotografia real do hardware. O selo indica se a imagem é do
              modelo exato instalado ou de um equivalente próximo — três são exatas, e onde
              não há foto pública do modelo, o card diz qual peça está na imagem e por quê.
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
            <span className="secao-numero">02 — DIAGNÓSTICO</span>
            <h2>O que os números revelam</h2>
            <p>
              Cinco achados, cada um ancorado no valor que o sistema reportou. Onde a
              recomendação tem um custo escondido, a ressalva está escrita junto.
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
            números de série da memória e do monitor. Nada disso está neste repositório —
            são dados identificáveis que não ajudam em nenhuma decisão de upgrade. O que
            serve para decidir uma troca (part number, socket, slots livres, revisão de BIOS
            e largura do link PCIe) está todo publicado acima.
          </div>

          <h4>Créditos das imagens</h4>
          <div className="creditos">
            {creditosUnicos().map((c) => (
              <div key={c.chave}>
                <strong>{c.autor}</strong> — {c.licenca}
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
