# Provas na janela real

Cenários que rodam **dentro da Lousa de verdade** (janela escondida), com terminais de
verdade, para provar o que teste de unidade não alcança: aviso do agente, links, copiar e
colar, árvore viva, desempenho da digitação. Nasceram nas provas das Fatias 8 e D17.

Nunca usam o seu estado nem as suas contas. Cada rodada cria, em `provas/saida/` (fora do
git), uma pasta de dados nova e uma cópia nova da `pasta-demo`. Nenhum cenário abre um
Claude de verdade: o aviso do agente usa o "Claude falso" (`apoio/falso-claude.mjs`).

## Como rodar

```
node provas/rodar.mjs <cenario> [--sem-build] [opções do cenário]
```

- Sem `--sem-build`, monta o app antes (`electron-vite build`). Use `--sem-build` para
  rodar vários cenários seguidos.
- Ao final, mostra o `resultado.json`. As fotos ficam em
  `provas/saida/<cenario>-<data>/`.
- `Error: AttachConsole failed` no fim do log é ruído do node-pty ao fechar a janela com
  terminais abertos. Não afeta o resultado.
- Só funciona fora do instalador: o `--cenario` do smoke é ignorado no app empacotado.

## Cenários

| Cenário | Estado | O que prova | Fotos |
|---|---|---|---|
| `fatia8` | demo | Aviso do agente pelo OSC 7501, "● 1 esperando você" enquadra o quadro, links de arquivo e de site, Ctrl+V, Ctrl+C, botão direito, ampliar e voltar, Ctrl+roda na letra, terminal encerrado + Reabrir, "terminou" e o brilho apaga, botão de registros | a..i |
| `colar-e-reabrir` | demo | Botão direito sem seleção cola, área de transferência vazia, `exit` mostra "Terminal encerrado" e Reabrir traz um prompt novo | reaberto |
| `vivo` | demo | Árvore mostra arquivo criado e apagado pelo terminal (raiz e subpasta); leitor recarrega com a pasta fechada na árvore; não existe "Alterados agora" (D17) | leitor |
| `desempenho` | casa | Eco da tecla (mediana, p90, pior) e atraso da tela com a pasta do usuário aberta e um terminal soltando 1,3 MB e pingando. Opção `acumular`: 10 mil arquivos mudados chegam antes (30 min da pasta do usuário na versão antiga) | — |

Resultado de referência (19/10/2026, `desempenho acumular`): versão anterior ao D17 = eco
mediana 86 ms, pior 245 ms, tela travada 20,9 s em ~35 s; depois = 20 a 23 ms, nenhuma
travada.

**Estados** (`estados.mjs`):

- `demo`: dois terminais comuns na `pasta-demo`, um com a conta Principal e outro com a
  Pessoal, sem login.
- `casa`: a sua pasta de usuário salva na lateral, só para leitura, mais os dois
  terminais.

**Cuidados:**

- `fatia8` e `colar-e-reabrir` usam a área de transferência do PC e devolvem o **texto**
  que estava nela. Uma imagem copiada se perde.
- `desempenho` faz a Lousa vigiar a raiz da sua pasta de usuário, só para leitura.

## Escrever um cenário novo

Um arquivo `cenarios/<nome>.js`:

- **Primeira linha:** `// estado: demo` ou `// estado: casa`.
- **Corpo:** `;(async () => { ...; return resultado })()`.
- **Onde roda:** dentro da tela, com `window.lousa`, `document` e o `prova`, que o smoke
  injeta (`src/main/cenario.ts`).

| `prova.` | Faz |
|---|---|
| `dados.pastaDemo`, `dados.apoio`, `dados.opcoes` | Caminhos desta rodada e as opções da linha de comando |
| `espera(ms)` | Espera |
| `foto(nome)` | O main fotografa a janela em `<saida>/<nome>.png` |
| `eventos([...])` | O main manda teclas e mouse de verdade (`sendInputEvent`): `{ type: 'keyDown', keyCode: 'V', modifiers: ['control'] }`, `{ type: 'mouseDown', x, y, button, clickCount }` |
| `ipc(canal, dados)` | O main manda um evento para a tela, como se viesse dele (ex.: `arquivos:mudou`) |

O que já ensinou a escrever cenário:

- **Linha quebrada:** o terminal quebra linhas longas, e o espaço no fim de uma linha
  quebrada some do texto da tela. Compare sem espaços.
- **Depois de Reabrir ou remontar:** o prompt antigo continua na tela. Espere a barra
  sumir **e** um prompt novo.
- **Botão direito:** o clique injetado pelo main não gera `contextmenu`. Dispare o evento
  na `.xterm-screen`.
- **Fotos:** saem sem animação (o smoke liga "reduzir movimento"), e cada foto é tirada
  duas vezes, porque a primeira às vezes vem com a tela anterior.
- **Classes que mudam:** quando a tela muda um nome de classe (`.selo-agente`,
  `.quadro-encerrado`, `.topo-chamadas`...), o cenário que usa esse nome precisa ser
  atualizado junto.

## Apoio

| Arquivo | Para quê |
|---|---|
| `apoio/falso-claude.mjs` | "Claude falso": fala o OSC 7501 igual ao `claude.exe` 2.1.295+ (pergunta, trabalhando, pedindo permissão, terminou) e espera um `s` para seguir. Sem conta nem rede |
| `apoio/abrir-e-fechar.mjs` | App de verdade (sem smoke): abre, fecha como o X e mostra `janela.json` e o registro do dia (T8.6, T8.7). Rode 2 ou 3 vezes com a mesma pasta |
| `apoio/medir-vigia.mjs` | Quanto um vigia recursivo de uma pasta receberia: avisos por segundo, caminhos diferentes, erros EPERM (D17) |
| `apoio/medir-historico.mjs` | Custo de guardar o histórico do terminal: copiar sempre × em pedaços (D17) |
| `apoio/conpty-osc/pai.mjs` + `filho.mjs` | Prova do ConPTY (D16): a resposta crua ao OSC 7501 some e a resposta em teclas `win32-input-mode` chega. Roda com `ELECTRON_RUN_AS_NODE=1` e `node_modules\electron\dist\electron.exe` (o node-pty do projeto é o do Electron) |

A `pasta-demo` guarda o `.git` e o `node_modules` como `_git` e `_node_modules`, porque o
git não aceita guardar os dois. O `rodar.mjs` devolve os nomes certos na cópia de cada
rodada.
