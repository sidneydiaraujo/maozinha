# Fatia 16 — Colar print no agente

Entrega: com um print na área de transferência, Ctrl+V dentro do quadro do agente cola a
imagem no Claude (aparece `[Image #1]` na caixa dele). Também tem o botão 📎 "Colar print"
no cabeçalho, e dá para arrastar um arquivo de imagem para o quadro.

Origem: avaliação de 19/10/2026, item "importar print". Decisão: D23.
**Achado que motiva:** no Windows o Claude cola imagem com **Alt+V**, não com Ctrl+V (lido
no `claude.exe` 2.1.304: `windows || wsl ? "alt+v" : "ctrl+v"`). Hoje a Lousa trata o
Ctrl+V e manda só texto, então o print não chega.
Depende de: nada. Pode vir antes ou depois da Fatia 15.

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md`, este arquivo, `componentes/teclas.ts`
(+ teste), `componentes/Terminal.tsx`, `lousa/QuadroNode.tsx`, o trecho `app:*` de
`src/shared/ipc.ts`, `src/main/handlers/` (só o arquivo do `app:colar`) e `src/preload/index.ts`.

## T16.0 Prova antes de codar

**Precisa do ok do Sidney:** abre um Claude de verdade numa pasta de teste. Não manda
mensagem nenhuma, então não gasta uso.

- Num terminal do node-pty (como `provas/apoio/conpty-osc/pai.mjs`), abrir `claude`, pôr
  uma imagem na área de transferência e mandar `\x1bv` (o que o xterm manda no Alt+V).
- Conferir se aparece `[Image #1]`. Conferir também o Ctrl+V cru (`\x16`).
- Arrastar: conferir se o caminho de um `.png` colado entre aspas vira anexo.
- Anotar no diário. Se `\x1bv` não colar, **pare** e registre em Bloqueios.

## T16.1 Ctrl+V com imagem e botão 📎

**Arquivos:** `src/shared/ipc.ts` (`app:temImagem`), handler do main, preload,
`componentes/teclas.ts` (+ teste), `Terminal.tsx`, `lousa/QuadroNode.tsx`, `estilos/quadro.css`.

**Interface:**
```ts
// main: clipboard.availableFormats() tem image/png ou image/bmp e nenhum texto
app: { temImagem(): Promise<boolean> }
// teclas.ts: decide o que o Ctrl+V manda ao terminal
export function colagem(temImagem: boolean, texto: string): { tipo: 'imagem' } | { tipo: 'texto'; texto: string } | null
```

**Regras:**
- Imagem e nenhum texto: manda `\x1bv` (o Alt+V). Com texto, cola o texto como hoje.
- O 📎 só aparece em quadro de agente vivo. Sem imagem na área de transferência, mostra
  "Copie um print primeiro (Win+Shift+S)" por 3 s.
- O Alt+V digitado pelo Sidney já passa direto pelo xterm: não mexer.
- O main nunca devolve a imagem para a tela: só sim ou não.

**Testes:** `colagem` nos 4 casos (imagem só, texto só, os dois, nenhum).

## T16.2 Arrastar imagem para o quadro

**Arquivos:** `Terminal.tsx` (ou `componentes/soltar.ts` + teste), `estilos/terminal.css`.

**Regras:**
- Soltar um ou mais arquivos `.png .jpg .jpeg .gif .webp` sobre o terminal **cola** os
  caminhos entre aspas, separados por espaço, sem Enter, com `term.paste` (o mesmo colar
  do Ctrl+V de texto). O Claude transforma o caminho colado em anexo, mas o digitado letra
  a letra fica como texto (T16.0, 19/10/2026).
- O caminho vem do `webUtils.getPathForFile` exposto pelo preload. Outro tipo de arquivo
  digita o caminho igual (útil para "leia este arquivo").
- Borda tracejada no quadro enquanto arrasta por cima (CSS, sem animação).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; cenário novo
`provas/cenarios/print.js` com o Claude falso respondendo a `\x1bv` ("IMAGEM OK") e
recebendo o caminho solto.

**Commit (T16.1 + T16.2):** `feat: paste a screenshot into the agent with Ctrl+V, the clip button or drag and drop`

## T16.3 Aceite

Itens 44 e 45: Win+Shift+S e depois Ctrl+V no agente → `[Image #1]`; arrastar um `.png`
do Explorador para o quadro.
