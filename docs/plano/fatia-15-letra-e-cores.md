# Fatia 15 — Letra e cores com cara de VSCode

Entrega: o terminal de cada quadro fica com a letra e as cores de quem passa o dia no
VSCode (tema Abyss): fonte à escolha, entrelinha maior, paleta própria da Lousa puxada
do Abyss e o desenhista WebGL do xterm (o mesmo do VSCode), que deixa a letra nítida e
desenha mais rápido.

Origem: avaliação da evolução do terminal (19/10/2026), item "fonte elegante". Decisão: D23.
Depende de: nada. Mexe em `Terminal.tsx`: comece só com o outro terminal fora desse arquivo.

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md` (tabela + último dia do diário), este
arquivo, `componentes/Terminal.tsx`, `componentes/fonte.ts` (+ teste), `topo/PainelContas.tsx`,
`estilos/terminal.css` e `provas/README.md`. Não leia `docs/ARQUITETURA.md` inteiro nem o
diário inteiro. Saída de `npm run check` e das provas: só o fim (`| tail -30`).

## T15.1 Tema e fonte do terminal

**Arquivos:** `src/renderer/src/componentes/tema.ts` (+ `tema.test.ts`), `fonte.ts`,
`Terminal.tsx`, `src/renderer/src/topo/Aparencia.tsx` (seção nova no painel da
engrenagem), `PainelContas.tsx`, `estilos/terminal.css`.

**Interface:**
```ts
export type NomeFonte = 'Cascadia Code' | 'Cascadia Mono' | 'Consolas'
export type NomePaleta = 'lousa' | 'abyss'
export interface Aparencia { fonte: NomeFonte; tamanho: number; entrelinha: number; paleta: NomePaleta }
export const APARENCIA_PADRAO: Aparencia // Cascadia Code, 14, 1.2, 'lousa'
export function temaDoXterm(paleta: NomePaleta): ITheme   // fundo, texto, cursor, seleção e as 16 cores ANSI
export function lerAparencia(): Aparencia                  // localStorage 'lousa.aparencia'; valor ruim volta ao padrão
export function guardarAparencia(a: Aparencia): void
```

**Regras:**
- `abyss` = as cores de `abyss-color-theme.json` do VSCode (fundo `#000c18`). `lousa` =
  o mesmo desenho, com fundo ardósia e texto cor de giz (a identidade da Fatia 21 parte daqui).
- A fonte sempre termina em `, Consolas, monospace` (Cascadia Code pode não estar instalada).
- O Ctrl+roda (T8.4) continua por quadro; o tamanho da Aparência vale só para quadro sem
  tamanho guardado. `FONTE_PADRAO` passa a vir da Aparência.
- Mudar a Aparência aplica na hora em todos os terminais abertos (`term.options` + `fit`),
  sem reabrir o terminal.
- Preferência do PC, não da conta: fica no `localStorage`, como a letra (sem canal novo).

**Testes:** `temaDoXterm` tem as 16 cores nas duas paletas; `lerAparencia` com JSON
estragado, fonte desconhecida e tamanho fora de 9–24 volta ao padrão.

**Pronto quando:** `npm run check` verde; `node provas/rodar.mjs fatia8` sem erros (a
foto mostra a letra nova); foto do painel "Aparência" com as duas paletas.

**Commit:** `feat: terminal font, line height and color palette like VSCode`

## T15.2 Desenhista WebGL

**Arquivos:** `package.json` (`@xterm/addon-webgl`), `Terminal.tsx` (ou
`componentes/desenhista.ts` se o Terminal passar de 168 linhas para perto do teto),
`src/main/cenario.ts` (marca de prova), `provas/cenarios/aparencia.js` (novo),
`provas/README.md`, `docs/DECISOES.md` (D23, a dependência).

**Regras:**
- Versão fixa, a que pede `@xterm/xterm` 6.0.0 (conferir `peerDependencies` no
  `node_modules` antes de instalar). Só JavaScript: nada nativo.
- O Chromium segura no máximo 16 desenhos WebGL ao mesmo tempo. Com mais quadros, ou se o
  WebGL cair (`onContextLoss`), aquele terminal volta ao desenho normal sozinho, sem erro.
- **Provas:** com WebGL o texto não fica no HTML (`.xterm-rows`), e os cenários leem a tela
  por ele. Na rodada de prova (o smoke com `--cenario`), o terminal usa o desenho normal,
  salvo `node provas/rodar.mjs aparencia webgl`. O cenário `aparencia` confere o
  `canvas` do WebGL e a volta ao desenho normal quando o contexto cai.

**Pronto quando:** `npm run check` verde; os cenários `fatia8`, `vivo` e `desempenho
acumular` passam (o eco não piora: mediana ≤ 25 ms); `aparencia webgl` passa.

**Commit:** `feat: WebGL terminal renderer with automatic fallback`

## T15.3 Aceite

Itens novos 42 e 43 no `docs/aceite/roteiro.md`: trocar fonte e paleta na engrenagem e ver
mudar na hora; abrir 6 quadros e digitar sem atraso.
