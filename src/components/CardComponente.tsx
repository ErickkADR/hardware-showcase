import type { Componente } from '../types';

const ROTULO_CATEGORIA: Record<Componente['categoria'], string> = {
  processador: 'Processador',
  'placa-mae': 'Placa-mãe',
  memoria: 'Memória',
  video: 'Vídeo',
  armazenamento: 'Armazenamento',
  monitor: 'Monitor',
  fonte: 'Fonte',
  refrigeracao: 'Refrigeração',
  gabinete: 'Gabinete',
};

interface Props {
  componente: Componente;
}

export function CardComponente({ componente }: Props) {
  const { foto, specs, ocupacao, origem } = componente;
  const fotoExata = foto.fidelidade === 'exata';
  const declarado = origem === 'declarado';

  return (
    <article className="card">
      <div className="card-foto">
        {/* As fotos moram em public/. BASE_URL carrega o prefixo do GitHub Pages. */}
        <img
          src={`${import.meta.env.BASE_URL}${foto.src}`}
          alt={foto.alt}
          loading="lazy"
          decoding="async"
        />
        <span
          className={`selo-foto ${foto.fidelidade}`}
          title={
            fotoExata
              ? 'Fotografia do modelo exato instalado nesta máquina'
              : 'Fotografia real de hardware, de um modelo equivalente'
          }
        >
          {fotoExata ? 'modelo exato' : 'equivalente'}
        </span>
      </div>

      <div className="card-corpo">
        <div className="card-cabeca">
          <span className="card-categoria">{ROTULO_CATEGORIA[componente.categoria]}</span>
          <span
            className={`selo-origem ${origem}`}
            title={
              declarado
                ? 'Peça sem via de dados com a placa-mãe: nenhuma classe WMI a enumera, então a especificação veio do dono da máquina'
                : 'Especificação lida do sistema via WMI/CIM ou nvidia-smi'
            }
          >
            {declarado ? 'informado' : 'medido'}
          </span>
        </div>

        <h3>{componente.nome}</h3>
        <p className="card-fabricante">{componente.fabricante}</p>
        <p className="card-resumo">{componente.resumo}</p>

        <dl className="specs">
          {specs.map((spec) => (
            <div key={spec.rotulo} className={`spec${spec.alerta ? ' alerta' : ''}`}>
              <dt className="spec-rotulo">{spec.rotulo}</dt>
              <dd className="spec-valor">{spec.valor}</dd>
            </div>
          ))}
        </dl>

        {ocupacao && (
          <div className="ocupacao">
            <div
              className="ocupacao-trilha"
              role="meter"
              aria-valuenow={Math.round(ocupacao.usadoPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Ocupação do disco: ${Math.round(ocupacao.usadoPct)}% usado`}
            >
              <div
                className={`ocupacao-preenchida${ocupacao.usadoPct >= 80 ? ' critico' : ''}`}
                style={{ width: `${ocupacao.usadoPct}%` }}
              />
            </div>
            <div className="ocupacao-legenda">
              <span>{ocupacao.livreLabel}</span>
              <span>{ocupacao.totalLabel}</span>
            </div>
          </div>
        )}

        {foto.nota && (
          <p className="nota-foto">
            <strong>Sobre a foto:</strong> {foto.nota}
          </p>
        )}
      </div>
    </article>
  );
}
