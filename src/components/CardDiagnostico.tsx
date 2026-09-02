import type { Diagnostico } from '../types';

const ROTULO_SEVERIDADE: Record<Diagnostico['severidade'], string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  oportunidade: 'Oportunidade',
};

interface Props {
  diagnostico: Diagnostico;
}

export function CardDiagnostico({ diagnostico }: Props) {
  const { severidade, titulo, constatacao, acao, ressalva } = diagnostico;

  return (
    <article className={`diag ${severidade}`}>
      <div className="diag-topo">
        <span className={`tag ${severidade}`}>{ROTULO_SEVERIDADE[severidade]}</span>
        <h3>{titulo}</h3>
      </div>

      <div className="diag-linha">
        <span className="diag-chave">Medido</span>
        <p className="diag-valor">{constatacao}</p>
      </div>

      <div className="diag-linha">
        <span className="diag-chave">Ação</span>
        <p className="diag-valor">{acao}</p>
      </div>

      {ressalva && (
        <div className="diag-linha ressalva">
          <span className="diag-chave">Ressalva</span>
          <p className="diag-valor">{ressalva}</p>
        </div>
      )}
    </article>
  );
}
