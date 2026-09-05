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

## Este PC roda? (seção 02)

A página tem um teste que cruza os requisitos oficiais da Steam com o hardware medido.
Digite o nome do jogo e ele compara processador, vídeo, memória e espaço em disco.

```bash
npm run jogos               # monta a base a partir dos rankings públicos
LIMITE=500 npm run jogos    # mais títulos, se valer a espera
npm run testar:analise      # roda o parser contra a base inteira
```

### De onde vem a lista

O script não tem lista fixa de jogos populares, porque ela envelhece. Ele une seis fontes
públicas e deduplica:

| Fonte | O que traz |
|---|---|
| `ISteamChartsService/GetMostPlayedGames` | os 100 mais jogados agora |
| `store/api/featuredcategories` | top de vendas, novidades e promoções |
| `ISteamChartsService/GetTopReleasesPages` | lançamentos que entraram no top mensal |
| SteamSpy `top100in2weeks` | mais jogados nas duas últimas semanas |
| SteamSpy `top100forever` | mais jogados de todos os tempos |
| SteamSpy `top100owned` | mais vendidos de todos os tempos |

Uma lista fixa de clássicos entra na frente de todas, para que Cyberpunk, Elden Ring e
companhia não caiam fora quando saírem dos rankings.

### Os dois limites reais

**A Steam corta em torno de 200 chamadas por 5 minutos** no `appdetails` e responde 429.
Por isso existe uma pausa de 1,3 s entre requisições e um backoff que espera 30 s, 60 s,
90 s antes de desistir. É o que faz a coleta de algumas centenas de jogos levar minutos em
vez de segundos.

**O peso do arquivo.** A base é grande, e importá-la de `src/` a colocaria dentro do bundle
JavaScript: todo visitante baixaria centenas de KB de requisitos de jogos só para ler a
página. Por isso ela mora em `public/jogos.json` e é buscada por `fetch` quando a seção é
usada, ficando no cache do navegador depois.

### Por que a base é local e não uma consulta ao vivo

A Steam serve os requisitos em `store.steampowered.com/api/appdetails`, mas não devolve
`Access-Control-Allow-Origin`. Chamar de `erickkadr.github.io` é bloqueado pelo CORS do
navegador. Proxies públicos resolveriam, só que o `allorigins` responde 520 e o
`corsproxy.io` passou a exigir chave paga. Um site de portfólio que depende de proxy de
terceiro quebra sozinho, então os dados são buscados por script e versionados.

### Como a comparação funciona

Processador e placa de vídeo viram um PassMark aproximado (`src/data/pontuacoes.ts`) e o
resultado é a razão entre o que a máquina tem e o que o jogo pede. Quando o requisito cita
alternativas equivalentes ("i7-6700 or Ryzen 5 1600"), vale a de menor exigência, já que
basta atender uma delas.

Duas armadilhas que o parser trata:

- A Steam alterna o separador, escrevendo `Core i3 6300` com espaço e `FX-4350` com hífen.
  O casamento é por regex montada a partir da chave, e o `(?!\d)` no fim evita que
  `i5 750` case dentro de `i5-7500`, que é outro processador.
- Jogos antigos não citam modelo, só "Dual core 2.8 GHz" ou "1GB VRAM". Nesses casos a
  comparação cai para núcleos, clock e VRAM, e a linha avisa que foi por aí.

Quando um critério é ilegível mas todo o resto passa, o veredito diz "provavelmente roda"
em vez de "requisito vago": um requisito que não deu para ler não é o mesmo que um
requisito reprovado, e chamar os dois de vago esconde a conclusão útil.

São estimativas: separam "roda folgado" de "não roda", não preveem FPS. Na base atual de
277 títulos, 267 rodam em algum nível e 10 não atingem o mínimo, todos os dez barrados no
processador, o que é exatamente o gargalo apontado na seção de diagnóstico.

O resultado é compartilhável por link: `?jogo=1091500` (appid) ou `?jogo=elden ring`.

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
