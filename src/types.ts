/**
 * Modelo de dados do inventário de hardware.
 *
 * Os dados foram coletados via WMI/CIM (Win32_*, root\wmi) e nvidia-smi.
 * Identificadores pessoais (MAC address e números de série de RAM e monitor) são
 * deliberadamente omitidos: não ajudam em nenhuma decisão de upgrade e o repositório
 * é público. O que serve para upgrade (part number, socket, slots livres, revisão de
 * BIOS, largura do link PCIe) está todo aqui.
 *
 * Fonte, ventoinhas e gabinete são a exceção: nenhuma classe WMI os enumera, porque
 * não têm via de dados com a placa-mãe. Esses vieram do próprio dono da máquina, e o
 * campo `origem` registra essa diferença.
 */

/** Como a foto se relaciona com a peça realmente instalada. */
export type FotoFidelidade =
  /** Fotografia do modelo exato que está na máquina. */
  | 'exata'
  /** Fotografia real de hardware, mas de um modelo equivalente ou da mesma linha. */
  | 'equivalente';

/** De onde veio a especificação, já que nem todo componente é legível por software. */
export type Origem =
  /** Lido do sistema via WMI/CIM ou nvidia-smi. */
  | 'medido'
  /** Informado pelo dono: peça sem interface digital que o Windows possa consultar. */
  | 'declarado';

export interface Credito {
  autor: string;
  licenca: string;
  fonte: string;
}

export interface Foto {
  src: string;
  alt: string;
  fidelidade: FotoFidelidade;
  /** Texto curto explicando a relação, exibido quando a foto não é exata. */
  nota?: string;
  credito: Credito;
}

/** Uma linha de especificação técnica dentro do card. */
export interface Spec {
  rotulo: string;
  valor: string;
  /** Destaca a linha quando o valor medido está abaixo do que a peça entrega. */
  alerta?: boolean;
}

export type Categoria =
  | 'processador'
  | 'placa-mae'
  | 'memoria'
  | 'video'
  | 'armazenamento'
  | 'monitor'
  | 'fonte'
  | 'refrigeracao'
  | 'gabinete';

export interface Componente {
  id: string;
  categoria: Categoria;
  nome: string;
  fabricante: string;
  origem: Origem;
  /** Frase curta de posicionamento, exibida sob o nome. */
  resumo: string;
  foto: Foto;
  specs: Spec[];
  /** Métrica de ocupação (usada pelos discos). 0 a 100. */
  ocupacao?: { usadoPct: number; livreLabel: string; totalLabel: string };
}

export type Severidade = 'critico' | 'atencao' | 'oportunidade';

export interface Diagnostico {
  id: string;
  severidade: Severidade;
  titulo: string;
  /** O que foi medido, com o número que sustenta a conclusão. */
  constatacao: string;
  /** O que fazer a respeito. */
  acao: string;
  /** Ressalva honesta: onde a recomendação pode não se confirmar. */
  ressalva?: string;
}