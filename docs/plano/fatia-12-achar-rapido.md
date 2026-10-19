# Fatia 12 — Achar as coisas rápido

Entrega: **Ctrl+K** abre uma caixa de busca para ir a um quadro, abrir um quadro
novo numa pasta ou abrir um arquivo das pastas da lista. **Ctrl+F** dentro de um
terminal procura no que ele escreveu (até 10 mil linhas).

Origem: "faça as 4" (19/10/2026). Decisão: D20.

## T12.1 Ctrl+K

**Arquivos:** `src/shared/pontuar.ts` (+ teste), `src/main/arquivos/busca.ts`
(+ teste), `regras.ts` (`entraNaBusca`), canal `arquivos:buscar`,
`src/renderer/src/paleta/` (`itens.ts` + teste, `Paleta.tsx`, `usePaleta.ts`),
`estilos/paleta.css`, `lousa/foco.ts` (`pedirNovoQuadro`), `App.tsx`, `Lousa.tsx`,
`useNovoQuadro.ts` e `NovoQuadro.tsx` (`repoInicial`).

**Regras:**
- Ctrl+K pega a tecla na fase de captura, antes do xterm: o terminal não recebe.
- Pontuação: trecho no começo > trecho no meio > letras na ordem (no máximo 2
  saltos por letra), sem diferenciar maiúscula nem acento.
- Sem texto: os quadros e depois as pastas ("Novo quadro em <pasta>"). Arquivos
  só com 2 letras ou mais, pedidos ao main 150 ms depois da última tecla.
- Busca de arquivos no main: em largura, pulando git, dependências, builds e
  `AppData`; teto de 20 mil itens visitados (dividido entre as pastas, valendo
  também dentro de uma pasta enorme) e 30 resultados.
- A paleta para o Enter que usou: a janelinha "Novo quadro" abre no mesmo Enter
  e criaria um agente sozinha (achado na prova).

## T12.2 Ctrl+F no terminal

**Arquivos:** `componentes/procurar.ts` (+ teste), `BuscaTerminal.tsx`,
`teclas.ts` (atalho `buscar`), `Terminal.tsx`, `estilos/terminal.css`.

**Regras:** começa pela ocorrência mais nova; Enter vai para a próxima, Shift+Enter
volta, Esc fecha e devolve o foco; mostra "3 de 12". Linha por linha (um texto
quebrado entre duas linhas não é achado) e a coluna pode ficar deslocada depois
de um emoji largo.

## Aceite

Itens 37 a 39 do `docs/aceite/roteiro.md`.
