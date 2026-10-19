# Fatia 13 — A mesma mensagem para vários quadros

Entrega: selecionar dois quadros ou mais (Ctrl+clique no cabeçalho, ou
Shift+arrastar no vazio da lousa) mostra uma barra no pé da lousa, "Para N
quadros", que manda a mesma mensagem para todos: "rode os testes", "faça
commit"... Junto com as cópias separadas (Fatias 10 e 11), vários agentes, cada
um na sua branch, recebem a mesma ordem.

Origem: "faça as 4" (19/10/2026), item B8 de `FUNCIONALIDADES.md`. Decisão: D21.

## T13.1 Barra de envio

**Arquivos:** `src/renderer/src/lousa/envio.ts` (+ teste), `BarraEnvio.tsx`,
`Lousa.tsx`, `QuadroNode.tsx` (dica no cabeçalho), `estilos/envio.css`.

**Regras:**
- Só aparece com 2 ou mais quadros selecionados. Enter envia; Shift+Enter quebra a linha.
- Para cada quadro: o texto e, 150 ms depois, o Enter (`\r`). Texto com várias
  linhas vai como colagem (bracketed paste), para não virar várias mensagens.
- Usa o canal que a tela já tinha (`terminais:escrever`): nenhum canal novo e
  nenhuma permissão nova. Terminal encerrado ignora.
- Aviso "Enviado para N quadros" por 4 s.

## Aceite

Item 40 do `docs/aceite/roteiro.md`.
