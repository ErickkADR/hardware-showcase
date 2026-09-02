import type { Componente, Diagnostico } from '../types';

/** Data da coleta dos dados via WMI/CIM. */
export const COLETADO_EM = '01/09/2026';

export const SISTEMA = {
  so: 'Windows 11 Pro',
  versao: '25H2',
  build: '26200.9168',
  arquitetura: '64 bits',
  instaladoEm: '21/04/2026',
  placa: 'Gigabyte B550M K',
  socket: 'AM4',
  bios: 'AMI FD (21/03/2024)',
};

const CREDITO_KABUM = {
  autor: 'KaBuM!',
  licenca: 'Imagem de divulgação do fabricante',
  fonte: 'kabum.com.br',
};

export const COMPONENTES: Componente[] = [
  {
    id: 'cpu',
    categoria: 'processador',
    nome: 'Ryzen 5 3350G',
    fabricante: 'AMD',
    resumo: 'APU Zen+ "Picasso" de 2019 — o gargalo real desta máquina.',
    foto: {
      src: 'images/cpu.jpg',
      alt: 'APU AMD Ryzen 5 da série 3000G, vista do encapsulamento e dos pinos AM4',
      fidelidade: 'equivalente',
      nota: 'Ryzen 5 3400G — mesmo die Picasso (Zen+ 12 nm) e mesmo socket AM4. O 3350G é peça OEM, sem fotografia oficial em acervo livre.',
      credito: { autor: 'Phiarc', licenca: 'CC BY-SA 4.0', fonte: 'Wikimedia Commons' },
    },
    specs: [
      { rotulo: 'Arquitetura', valor: 'Zen+ (Picasso, 12 nm)' },
      { rotulo: 'Núcleos / Threads', valor: '4 / 8' },
      { rotulo: 'Clock', valor: '3.600 MHz (base = máx.)' },
      { rotulo: 'Cache', valor: 'L2 2 MB · L3 4 MB' },
      { rotulo: 'Socket', valor: 'AM4' },
      { rotulo: 'Linhas PCIe p/ vídeo', valor: '8 x PCIe 3.0', alerta: true },
      { rotulo: 'Virtualização (SVM)', valor: 'Desativada no BIOS', alerta: true },
    ],
  },
  {
    id: 'mobo',
    categoria: 'placa-mae',
    nome: 'B550M K',
    fabricante: 'Gigabyte',
    resumo: 'Micro-ATX B550 — suporta Ryzen 5000, o caminho de upgrade está aberto.',
    foto: {
      src: 'images/motherboard.jpg',
      alt: 'Placa-mãe Gigabyte B550M K micro-ATX, socket AM4, quatro slots DDR4',
      fidelidade: 'exata',
      credito: CREDITO_KABUM,
    },
    specs: [
      { rotulo: 'Chipset', valor: 'AMD B550' },
      { rotulo: 'Formato', valor: 'Micro-ATX' },
      { rotulo: 'Socket', valor: 'AM4' },
      { rotulo: 'Slots DDR4', valor: '4 (todos ocupados)' },
      { rotulo: 'BIOS', valor: 'AMI FD — 21/03/2024' },
      { rotulo: 'Rede', valor: 'Realtek PCIe GbE' },
      { rotulo: 'Suporte a CPU', valor: 'Ryzen 3000 / 4000G / 5000' },
    ],
  },
  {
    id: 'ram',
    categoria: 'memoria',
    nome: '64 GB DDR4',
    fabricante: '4 x 16 GB',
    resumo: 'Muita memória, rodando bem abaixo do que os módulos entregam.',
    foto: {
      src: 'images/ram.png',
      alt: 'Módulo de memória DDR4 DIMM de 16 GB com dissipador',
      fidelidade: 'equivalente',
      nota: 'Módulo DDR4 de 16 GB equivalente. Os pentes instalados são de marca sem catálogo fotográfico público.',
      credito: { autor: 'PantheraLeo1359531', licenca: 'CC BY 4.0', fonte: 'Wikimedia Commons' },
    },
    specs: [
      { rotulo: 'Capacidade', valor: '64 GB (4 x 16 GB)' },
      { rotulo: 'Part number', valor: 'VAM4UX32C18AG-CVALW' },
      { rotulo: 'Velocidade nominal', valor: '3200 MHz CL18' },
      { rotulo: 'Rodando em', valor: '2400 MHz', alerta: true },
      { rotulo: 'Voltagem', valor: '1,20 V (JEDEC base)' },
      { rotulo: 'Canais', valor: 'Dual channel (2 por canal)' },
      { rotulo: 'Slots livres', valor: 'Nenhum — 4 de 4 ocupados' },
    ],
  },
  {
    id: 'gpu',
    categoria: 'video',
    nome: 'GeForce RTX 3050 8 GB',
    fabricante: 'MSI',
    resumo: 'A peça mais moderna do conjunto, limitada pela CPU e por 8 linhas PCIe.',
    foto: {
      src: 'images/gpu.jpg',
      alt: 'Placa de vídeo MSI GeForce RTX 3050 Ventus 2X com dois ventiladores',
      fidelidade: 'equivalente',
      nota: 'MSI RTX 3050 Ventus 2X — mesma fabricante (subsystem 1462) e mesma linha. A variante instalada é a de 8 GB (GA106).',
      credito: CREDITO_KABUM,
    },
    specs: [
      { rotulo: 'GPU', valor: 'GA106 (device 2507)' },
      { rotulo: 'VRAM', valor: '8 GB GDDR6' },
      { rotulo: 'Fabricante da placa', valor: 'MSI (subsystem 1462)' },
      { rotulo: 'Driver', valor: '610.74' },
      { rotulo: 'VBIOS', valor: '94.06.37.00.81' },
      { rotulo: 'Limite de potência', valor: '130 W' },
      { rotulo: 'Link PCIe', valor: 'x8 (limitado pela CPU)', alerta: true },
    ],
  },
  {
    id: 'ssd-boot',
    categoria: 'armazenamento',
    nome: 'Pichau Gaming PG256X',
    fabricante: 'SSD SATA · 256 GB · unidade C:',
    resumo: 'Disco de sistema — o ponto mais apertado da máquina hoje.',
    foto: {
      src: 'images/ssd-boot.jpg',
      alt: 'SSD SATA de 2,5 polegadas em carcaça metálica',
      fidelidade: 'equivalente',
      nota: 'SSD SATA 2,5 polegadas equivalente. As lojas que vendem o PG256X bloqueiam acesso automatizado às imagens.',
      credito: CREDITO_KABUM,
    },
    specs: [
      { rotulo: 'Interface', valor: 'SATA 6 Gb/s' },
      { rotulo: 'Formato', valor: '2,5 polegadas' },
      { rotulo: 'Capacidade', valor: '238 GB (237 GB formatado)' },
      { rotulo: 'Espaço livre', valor: '34,6 GB (14,6%)', alerta: true },
      { rotulo: 'Saúde', valor: 'Healthy' },
      { rotulo: 'Partições', valor: '3 (sistema + recuperação)' },
    ],
    ocupacao: { usadoPct: 85.4, livreLabel: '34,6 GB livres', totalLabel: '237,4 GB' },
  },
  {
    id: 'ssd-dados',
    categoria: 'armazenamento',
    nome: 'XrayDisk 1TB SSD',
    fabricante: 'SSD SATA · 1 TB · unidade E:',
    resumo: 'Volume de trabalho com folga — destino natural do que sair do C:.',
    foto: {
      src: 'images/ssd-sata.jpg',
      alt: 'SSD SATA de 2,5 polegadas, vista superior',
      fidelidade: 'equivalente',
      nota: 'SSD SATA 2,5 polegadas equivalente. XrayDisk é marca de venda direta, sem catálogo fotográfico acessível.',
      credito: CREDITO_KABUM,
    },
    specs: [
      { rotulo: 'Interface', valor: 'SATA 6 Gb/s' },
      { rotulo: 'Formato', valor: '2,5 polegadas' },
      { rotulo: 'Capacidade', valor: '954 GB' },
      { rotulo: 'Espaço livre', valor: '435,7 GB (45,7%)' },
      { rotulo: 'Saúde', valor: 'Healthy' },
      { rotulo: 'Partições', valor: '1' },
    ],
    ocupacao: { usadoPct: 54.3, livreLabel: '435,7 GB livres', totalLabel: '953,9 GB' },
  },
  {
    id: 'hdd',
    categoria: 'armazenamento',
    nome: 'WD Blue WD10JPVX',
    fabricante: 'Western Digital · 1 TB · unidade D:',
    resumo: 'HDD 5400 rpm de notebook — arquivo morto, não carga de trabalho.',
    foto: {
      src: 'images/hdd.jpg',
      alt: 'Disco rígido Western Digital WD10JPVX de 1 TB, 2,5 polegadas',
      fidelidade: 'exata',
      credito: {
        autor: 'Amirhossein Ashrafzadeh',
        licenca: 'CC BY-SA 4.0',
        fonte: 'Wikimedia Commons',
      },
    },
    specs: [
      { rotulo: 'Interface', valor: 'SATA 6 Gb/s' },
      { rotulo: 'Formato', valor: '2,5 polegadas · 9,5 mm' },
      { rotulo: 'Rotação', valor: '5.400 rpm' },
      { rotulo: 'Capacidade', valor: '932 GB' },
      { rotulo: 'Espaço livre', valor: '705,6 GB (76,6%)' },
      { rotulo: 'Saúde', valor: 'Healthy' },
    ],
    ocupacao: { usadoPct: 23.4, livreLabel: '705,6 GB livres', totalLabel: '920,9 GB' },
  },
  {
    id: 'monitor',
    categoria: 'monitor',
    nome: 'UltraGear 27GN60R-B',
    fabricante: 'LG',
    resumo: 'IPS 27 polegadas a 144 Hz — a saída está à altura do resto do conjunto.',
    foto: {
      src: 'images/monitor.jpg',
      alt: 'Monitor gamer LG UltraGear 27GN60R-B de 27 polegadas com base em V',
      fidelidade: 'exata',
      credito: {
        autor: 'LG Electronics',
        licenca: 'Imagem oficial do fabricante',
        fonte: 'lg.com',
      },
    },
    specs: [
      { rotulo: 'Tamanho', valor: '27 polegadas (60 x 34 cm medidos)' },
      { rotulo: 'Resolução', valor: '1920 x 1080' },
      { rotulo: 'Taxa de atualização', valor: '144 Hz (143 Hz ativos)' },
      { rotulo: 'Painel', valor: 'IPS' },
      { rotulo: 'Sincronia', valor: 'FreeSync Premium · G-Sync Compatible' },
      { rotulo: 'Fabricação', valor: 'Semana 3 de 2024' },
    ],
  },
];

export const DIAGNOSTICOS: Diagnostico[] = [
  {
    id: 'svm',
    severidade: 'critico',
    titulo: 'Virtualização desligada bloqueia WSL2, Docker e Hyper-V',
    constatacao:
      'VirtualizationFirmwareEnabled retorna False e HypervisorPresent também. O SLAT existe no processador, então é só a chave do firmware que está desligada.',
    acao:
      'Ativar SVM Mode em Advanced CPU Settings no BIOS. Sem isso, Docker Desktop e WSL2 não sobem — o que trava qualquer stack local de n8n ou Supabase.',
  },
  {
    id: 'disco-c',
    severidade: 'critico',
    titulo: 'O disco de sistema está com 14,6% livres',
    constatacao:
      'C: tem 34,6 GB livres de 237 GB, e é onde moram o Windows, a pasta de projetos e o stable-diffusion-webui — que sozinho passa de 20 GB entre checkpoints, LoRAs e venv.',
    acao:
      'Mover modelos do Stable Diffusion e node_modules pesados para o E: (435 GB livres) ou D: (705 GB livres). SSD abaixo de 15% livre também perde desempenho de escrita.',
  },
  {
    id: 'cpu-gargalo',
    severidade: 'oportunidade',
    titulo: 'A CPU é o gargalo — e a placa já aceita a solução',
    constatacao:
      'Um quad-core Zen+ de 2019 alimenta uma RTX 3050, e o APU Picasso só entrega 8 linhas PCIe 3.0 para vídeo, enquanto a B550 daria 4.0 x16 com um processador mais novo.',
    acao:
      'A B550M K com BIOS de 2024 aceita Ryzen 5000 direto. Um Ryzen 5 5600 ou 5700X dobra os núcleos, libera a GPU e destrava o link PCIe — sem trocar placa nem memória.',
    ressalva:
      'O 5600 não tem gráficos integrados: sem a RTX instalada, a máquina fica sem vídeo. Deixa de existir a saída de emergência que a iGPU oferece hoje.',
  },
  {
    id: 'ram-lenta',
    severidade: 'atencao',
    titulo: 'A memória roda 25% abaixo do que os módulos entregam',
    constatacao:
      'O part number VAM4UX32C18AG indica módulos de 3200 MHz CL18, mas os quatro rodam a 2400 MHz em 1,20 V — o perfil JEDEC base, com XMP/DOCP desligado no BIOS.',
    acao:
      'Ativar o perfil DOCP no BIOS. Num APU a memória alimenta a iGPU e o Infinity Fabric, então o ganho aparece além dos benchmarks sintéticos.',
    ressalva:
      'Com 4 DIMMs num controlador Zen+, 3200 MHz raramente estabiliza. Tente 2933 primeiro e valide com memtest antes de subir.',
  },
  {
    id: 'rede',
    severidade: 'atencao',
    titulo: 'A rede negocia 100 Mbps numa placa gigabit',
    constatacao:
      'A Realtek PCIe GbE suporta 1 Gb/s, mas o link subiu a 100 Mbps — um décimo do que a placa e o Windows entregam.',
    acao:
      'Verificar o cabo (Cat5 antigo ou crimpagem com pares faltando é a causa mais comum) e a porta do roteador ou switch.',
  },
];
