# hardware-showcase

Página que apresenta o inventário de hardware do PC pessoal do Erick, lido via WMI/CIM e
`nvidia-smi`, com um teste que cruza os requisitos da Steam com esse hardware.

Publicado em https://erickkadr.github.io/hardware-showcase/

Stack: React 19, TypeScript, Vite 8, CSS puro. Sem framework de UI, sem lib de estado.

## Comandos

```bash
npm run dev                # http://localhost:5173/hardware-showcase/
npm run build
npm run deploy             # build + gh-pages -d dist
npm run jogos              # remonta public/jogos.json a partir dos rankings da Steam
LIMITE=500 npm run jogos   # base maior, leva mais tempo por causa do rate limit
npm run testar:analise     # roda o parser de requisitos contra a base inteira

powershell -ExecutionPolicy Bypass -File scripts\coletar-inventario.ps1
```

O último regera `inventario-completo.local.json`, que está no `.gitignore` porque contém
MAC e números de série. Rodar antes de decidir um upgrade e comparar com o que o site
publica.

## Decisões deliberadas

Estas contrariam o que o código sugere à primeira vista. Não "corrigir" sem ler o motivo.

**`base` do Vite é fixa em `/hardware-showcase/`, inclusive em dev.** Condicionar ao
comando (`command === 'build'`) faz o `vite preview` servir na raiz enquanto o HTML já foi
gerado apontando para o subdiretório. Os assets caem no fallback de SPA e voltam como
`index.html` **com status 200**. O sintoma é página em branco e nenhum erro no console, e
uma checagem por status code não pega. Isso já aconteceu uma vez.

**`jogos.json` mora em `public/`, não em `src/`.** Importado de `src/` ele entra no bundle
JavaScript, e são 218 KB que todo visitante baixaria, inclusive quem nem abre a busca. Por
`fetch` a partir de `public/`, o bundle ficou em 225 KB em vez de 278 KB.

**Não existe GitHub Actions de propósito.** O token `gh` desta conta não tem escopo
`workflow`, então commit em `.github/workflows/` é rejeitado no push. Deploy é
`npm run deploy` via CLI. Para habilitar: `gh auth refresh -s workflow`.

**Fonte, ventoinhas, water cooler e gabinete têm `origem: 'declarado'`.** Não é dado
faltando: nenhuma classe WMI as enumera, porque não têm via de dados com a placa-mãe. A
fonte entrega 12V, 5V e 3,3V pelo cabo ATX sem se identificar, e `Win32_Fan` retorna vazio
nesta máquina porque ventoinhas em header giram por PWM sem responder nada. O selo
medido/informado na UI existe para não confundir as duas coisas.

**MAC e números de série nunca são versionados.** O repositório é público e esses dados não
ajudam em decisão de upgrade nenhuma. Part number, socket, slots livres, revisão de BIOS e
largura do link PCIe são publicados justamente porque servem.

## Armadilhas já encontradas

**A Steam não devolve CORS.** `store.steampowered.com/api/appdetails` tem os requisitos mas
não manda `Access-Control-Allow-Origin`, então o navegador bloqueia a chamada vinda do
GitHub Pages. Proxies não resolvem de forma confiável: `allorigins` responde 520 e
`corsproxy.io` passou a exigir chave paga. Por isso a base é montada por script e
versionada. Não tentar consulta ao vivo de novo sem antes checar se algo mudou.

**Rate limit do `appdetails`:** cerca de 200 chamadas por 5 minutos, depois 429. O script
tem pausa de 1,3 s e backoff de 30/60/90 s. Não baixar a pausa.

**Wikimedia só serve larguras de thumbnail que ele mesmo gera.** Pedir `1024px` ou `1100px`
direto na URL devolve HTTP 400 com "Use thumbnail sizes listed on...". O caminho certo é
pedir a `thumburl` pela API (`prop=imageinfo&iiurlwidth=N`) e baixar exatamente a URL
retornada, que às vezes aponta para `thumb.wikimedia.org` em vez de `upload.wikimedia.org`.

**`ConvertTo-Json` do PowerShell serializa coleção de um item como objeto, não array.** Uma
GPU só, uma placa de rede só, e quem lê o JSON quebra ao indexar `[0]`. Todas as coleções
em `coletar-inventario.ps1` são montadas dentro de `@(...)` por isso.

**Fotos de produto do Kabum podem ser de anúncio combo.** A primeira imagem do anúncio do
gabinete Rise Mode Glass 06X era a ventoinha que vinha junto, não o gabinete. Conferir a
imagem antes de usar, não confiar no slug da URL.

**O parser de requisitos tem dois casos que já quebraram:** a Steam alterna separador
(`Core i3 6300` com espaço, `FX-4350` com hífen), por isso o casamento é regex montada da
chave; e o `(?!\d)` no fim impede `i5 750` de casar dentro de `i5-7500`. Ao mexer em
`src/lib/analisar.ts`, rodar `npm run testar:analise` antes e depois e comparar a
distribuição de vereditos.

## Preferência de escrita

**Nada de travessão nem hífen como pontuação**, em nenhum texto do site, README, commit ou
comentário. Usar vírgula, dois pontos, parênteses ou ponto. Hífen dentro de nome próprio ou
termo técnico é normal (`placa-mãe`, `gh-pages`, `27GN60R-B`). O Erick pediu isso
explicitamente, porque travessão denuncia texto gerado por IA.

## Pendências

- **Potência da fonte não confirmada.** Está publicada como "750 W (a confirmar)" porque o
  Erick não tinha certeza entre 750 e 850 (a XPG Core Reactor não tem versão de 800 W). O
  número está na etiqueta lateral. A foto também está como `equivalente` e não `exata`,
  porque usamos a Core Reactor II VE sem confirmar a geração.
- **Sem foto real da RAM Asgard Valkyrie e dos dois SSDs** (Pichau PG256X, XrayDisk). As
  lojas que os vendem bloqueiam acesso automatizado. Se o Erick fotografar, é trocar o
  arquivo em `public/images/` e mudar `fidelidade` para `'exata'` em
  `src/data/hardware.ts`.
- **Os scores em `src/data/pontuacoes.ts` são PassMark aproximados digitados à mão.** O do
  Ryzen 5 3350G é estimado, porque sendo peça OEM ele não tem entrada própria no PassMark.
  Servem para separar "roda folgado" de "não roda", não para prever FPS.
