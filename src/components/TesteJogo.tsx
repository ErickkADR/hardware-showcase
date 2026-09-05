import { useEffect, useMemo, useRef, useState } from 'react';
import { analisar, normalizar, type Jogo, type Avaliacao, type Situacao } from '../lib/analisar';

const SIMBOLO: Record<Situacao, string> = {
  passa: '✓',
  aperta: '!',
  falha: '✕',
  desconhecido: '?',
};

function Painel({ avaliacao }: { avaliacao: Avaliacao }) {
  return (
    <div className="teste-painel">
      <h5>{avaliacao.nivel === 'minimo' ? 'Requisito mínimo' : 'Requisito recomendado'}</h5>
      {avaliacao.criterios.map((c) => (
        <div className={`criterio ${c.situacao}`} key={c.rotulo}>
          <span className="criterio-marca" aria-hidden="true">
            {SIMBOLO[c.situacao]}
          </span>
          <div className="criterio-corpo">
            <div className="criterio-linha">
              <strong>{c.rotulo}</strong>
              {c.razao !== undefined && (
                <span className="criterio-razao">{c.razao.toFixed(1)}x</span>
              )}
            </div>
            <div className="criterio-valores">
              pede <em>{c.exigido}</em> · você tem <em>{c.disponivel}</em>
            </div>
            {c.observacao && <div className="criterio-obs">{c.observacao}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** O parâmetro ?jogo= aceita o appid ou o nome, e o nome é comparado normalizado. */
function acharNaUrl(lista: Jogo[]): Jogo | null {
  if (typeof window === 'undefined') return null;
  const bruto = new URLSearchParams(window.location.search).get('jogo');
  if (!bruto) return null;
  const alvo = normalizar(bruto);
  return (
    lista.find((j) => String(j.appid) === bruto) ??
    lista.find((j) => normalizar(j.nome) === alvo) ??
    lista.find((j) => normalizar(j.nome).includes(alvo)) ??
    null
  );
}

export function TesteJogo() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [carga, setCarga] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [termo, setTermo] = useState('');
  const [escolhido, setEscolhido] = useState<Jogo | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  // A base fica em public/ e não no bundle: são centenas de jogos, e quem não usa a
  // busca não deveria pagar esse download junto com o JavaScript da página.
  useEffect(() => {
    let vivo = true;
    fetch(`${import.meta.env.BASE_URL}jogos.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { jogos: Jogo[] }) => {
        if (!vivo) return;
        setJogos(d.jogos);
        setCarga('pronto');

        // Quem abriu um link com ?jogo= veio pelo resultado, não pelo topo da página.
        const daUrl = acharNaUrl(d.jogos);
        if (daUrl) {
          setEscolhido(daUrl);
          setTermo(daUrl.nome);
          // 'instant' porque o html tem scroll-behavior smooth, e animar a página
          // inteira faria quem abriu o link assistir ao percurso.
          requestAnimationFrame(() =>
            raiz.current?.scrollIntoView({ block: 'center', behavior: 'instant' }),
          );
        }
      })
      .catch(() => vivo && setCarga('erro'));
    return () => {
      vivo = false;
    };
  }, []);

  const sugestoes = useMemo(() => {
    const t = normalizar(termo);
    if (t.length < 2) return [];
    const casam = jogos.filter((j) => normalizar(j.nome).includes(t));
    // Quem começa com o termo digitado aparece primeiro.
    casam.sort((a, b) => {
      const ia = normalizar(a.nome).startsWith(t) ? 0 : 1;
      const ib = normalizar(b.nome).startsWith(t) ? 0 : 1;
      return ia - ib || a.nome.length - b.nome.length;
    });
    return casam.slice(0, 8);
  }, [termo, jogos]);

  const resultado = useMemo(() => (escolhido ? analisar(escolhido) : null), [escolhido]);

  return (
    <div className="teste" ref={raiz}>
      <div className="teste-busca">
        <input
          type="search"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setEscolhido(null);
          }}
          placeholder={
            carga === 'pronto'
              ? `Digite o nome do jogo, entre ${jogos.length} títulos`
              : 'Carregando a base de jogos...'
          }
          aria-label="Nome do jogo"
          autoComplete="off"
          disabled={carga !== 'pronto'}
        />

        {sugestoes.length > 0 && !escolhido && (
          <ul className="teste-sugestoes">
            {sugestoes.map((j) => (
              <li key={j.appid}>
                <button
                  type="button"
                  onClick={() => {
                    setEscolhido(j);
                    setTermo(j.nome);
                    const url = new URL(window.location.href);
                    url.searchParams.set('jogo', String(j.appid));
                    window.history.replaceState(null, '', url);
                  }}
                >
                  <span>{j.nome}</span>
                  {j.ano && <span className="teste-ano">{j.ano}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {carga === 'erro' && (
          <p className="teste-vazio">
            Não foi possível carregar a base de jogos. Recarregue a página.
          </p>
        )}

        {carga === 'pronto' && termo.trim().length >= 2 && sugestoes.length === 0 && !escolhido && (
          <p className="teste-vazio">
            Esse título não está entre os {jogos.length} da base. A lista é montada a partir
            dos rankings públicos da Steam e versionada, porque a Steam não libera consulta
            direta do navegador. Para incluir, adicione o appid em{' '}
            <code>scripts/atualizar-jogos.mjs</code> e rode <code>npm run jogos</code>.
          </p>
        )}
      </div>

      {resultado && (
        <div className="teste-resultado">
          <div className={`veredito ${resultado.minimo.situacao}`}>
            {resultado.jogo.capa && (
              <img src={resultado.jogo.capa} alt="" className="veredito-capa" loading="lazy" />
            )}
            <div>
              <h4>{resultado.jogo.nome}</h4>
              <p>{resultado.veredito}</p>
            </div>
          </div>

          <div className="teste-paineis">
            <Painel avaliacao={resultado.minimo} />
            {resultado.recomendado && <Painel avaliacao={resultado.recomendado} />}
          </div>
        </div>
      )}
    </div>
  );
}
