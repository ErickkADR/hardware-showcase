# hardware-showcase

Inventário de um desktop AMD AM4, lido do hardware real e apresentado como página em
React + TypeScript. Doze componentes, cada um com fotografia, especificações e um
diagnóstico do que está limitando a máquina.

**Site:** https://erickkadr.github.io/hardware-showcase/

## Como os dados foram coletados

| Fonte | O que forneceu |
|---|---|
| `Win32_Processor`, `Win32_BaseBoard`, `Win32_BIOS` | CPU, socket, placa-mãe, revisão de BIOS |
| `Win32_PhysicalMemory` | Part number, clock nominal vs. configurado, voltagem, slots |
| `Win32_DiskDrive` + `Get-PhysicalDisk` | Modelo, tipo (SSD/HDD), barramento, saúde |
| `Win32_LogicalDisk` | Capacidade e espaço livre por volume |
| `root\wmi` → `WmiMonitorID`, `WmiMonitorBasicDisplayParams` | Modelo e dimensões físicas do monitor |
| `Win32_PnPEntity` (subsystem PCI) | Fabricante real da placa de vídeo |
| `nvidia-smi` | VRAM real, VBIOS, limite de potência, largura do link PCIe |

Dois valores só apareceram por cruzamento de fontes:

- **O fabricante da GPU.** O WMI reporta apenas "NVIDIA GeForce RTX 3050". O subsystem ID
  `SUBSYS_C9791462` identifica o fabricante da placa, e `1462` é MSI.
- **O tamanho do monitor.** O EDID informa só "LG ULTRAGEAR". As dimensões físicas
  (60 × 34 cm) dão 27 polegadas de diagonal, o que descarta o modelo de 24".

## O que o software não consegue ler

Quatro peças aparecem no site com o selo `informado` em vez de `medido`: a fonte, as quatro
ventoinhas, o water cooler e o gabinete. Nenhuma classe WMI as enumera, e a razão é
elétrica, não do Windows.

Uma fonte comum entrega 12V, 5V e 3,3V pelo cabo ATX e não tem via de dados com a
placa-mãe, então não existe nada a consultar. `Win32_Fan` retorna vazio nesta máquina pelo
mesmo motivo: ventoinhas ligadas em header giram por PWM sem se identificar. Só fontes
digitais topo de linha (Corsair com iCUE, NZXT com CAM) expõem modelo e consumo, e ainda
assim por USB interno.

Essas especificações vieram do dono da máquina, e o campo `origem` no modelo de dados
registra a diferença para que ninguém confunda as duas coisas.

## O que não está versionado

A coleta original incluía endereço MAC e números de série da memória e do monitor. **Nada
disso foi versionado**, porque são dados identificáveis, o repositório é público, e nenhum
deles ajuda numa decisão de upgrade. O que serve para decidir uma troca (part number,
socket, slots livres, revisão de BIOS, largura do link PCIe) está todo publicado.

O dump bruto, com os identificadores, fica em `inventario-completo.local.json`, que está no
`.gitignore` e nunca sai da máquina. Para regerá-lo antes de decidir um upgrade:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\coletar-inventario.ps1
```

## Sobre as fotografias

Cada componente tem uma fotografia real de hardware, com um selo indicando a relação com a
peça instalada:

- **`modelo exato`**: fotografia do modelo que está na máquina. São seis, entre elas a
  placa-mãe B550M K, o HDD WD10JPVX, o monitor LG 27GN60R-B e o gabinete Rise Mode Glass 06X.
- **`equivalente`**: fotografia real de um modelo da mesma linha ou geração, usada quando
  não existe foto pública do modelo exato. É o caso das peças OEM (Ryzen 5 3350G) e das de
  marca regional ou de venda direta (Pichau PG256X, XrayDisk, Asgard Valkyrie), cujas lojas
  bloqueiam acesso automatizado. Cada card diz qual peça aparece na imagem e por quê.

Créditos e licenças de cada imagem estão no rodapé da página.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173/hardware-showcase/
npm run build
npm run preview
```

O `base` do Vite é fixo em `/hardware-showcase/`, inclusive em desenvolvimento. Isso é
deliberado: condicionar a base ao comando faz o `preview` servir na raiz enquanto o HTML já
foi gerado apontando para o subdiretório, e os assets caem no fallback de SPA, voltando como
`index.html` com status 200. O sintoma é uma página em branco sem nenhum erro no console.

## Deploy

```bash
npm run deploy
```

Publica `dist/` na branch `gh-pages` via CLI. **Não há GitHub Actions de propósito:** o token
`gh` desta conta não tem o escopo `workflow`, então qualquer commit em `.github/workflows/`
seria rejeitado no push. Para habilitar: `gh auth refresh -s workflow`.

## Stack

React 19 · TypeScript · Vite 8 · CSS puro (sem framework de UI)
