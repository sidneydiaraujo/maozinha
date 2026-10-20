# Provas na janela real

Cenários que rodam **dentro da Lousa de verdade** (janela escondida), com terminais de
verdade, para provar o que teste de unidade não alcança: aviso do agente, links, copiar e
colar, árvore viva, desempenho da digitação. Nasceram nas provas das Fatias 8 e D17.

Nunca usam o seu estado nem as suas contas. Cada rodada cria, em `provas/saida/` (fora do
git), uma pasta de dados nova e uma cópia nova da `pasta-demo`. Nenhum cenário abre um
Claude de verdade, **salvo o `painel`** (estado `agente`, conta Pessoal, pede o ok do Sidney;
não manda mensagem). O aviso do agente usa o "Claude falso" (`apoio/falso-claude.mjs`).

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

| `copias` | git | Fatia 10: "Cópia separada" já marcada numa pasta com quadro, quadro `app ⑂ terminal-N` com pasta e branch próprias, fechar a cópia limpa apaga pasta e branch, fechar com arquivo novo mantém tudo, a cópia mantida aparece na janelinha, quadros novos não ficam um em cima do outro (T24.1) | 1..5 |
| `juntar` | git | Fatia 11: resumo "1 commit… para juntar em main", Juntar leva o arquivo para a original, fechar apaga cópia e branch, conflito desfaz o merge (original limpa), cópia com alteração sem commit avisa e o main recusa | 1..5 |
| `paleta` | git | Fatia 12: Ctrl+K de verdade com o terminal em foco, "api" leva a vista ao quadro fora da tela, "fatia" acha o arquivo da subpasta e não o de `node_modules` e abre no leitor, "novo api" abre a janelinha com api marcada (sem abrir agente sozinho), Ctrl+F conta 11 achados, começa no 11 e Enter sobe para o 10 (T24.2) | 1..5 |
| `envio` | git | Fatia 13: um quadro selecionado não mostra a barra, Ctrl+clique de verdade no segundo mostra "Para 2 quadros", Shift+Enter quebra a linha sem enviar, Enter chega aos dois e o terceiro não recebe | 1..2 |
| `notas` | git | Fatia 26: "+ Nota" nasce escrevendo e fora de cima dos quadros, o texto é salvo sem "Pronto", o markdown aparece, "➤ Mandar" escreve só no terminal clicado, Ctrl+K "Nova nota" cria outra, nota vazia apaga sem perguntar | 1..3 |
| `prontas` | git | Fatia 25: clique no terminal e Ctrl+K "Mandar: Rode os testes…" escreve só nele ("Enviado para 1 quadro"); o ★ da barra lista as três padrão, guarda, preenche e apaga | 1..3 |
| `aparencia` | demo | Fatia 15: a Aparência da engrenagem muda os terminais abertos na hora, sem reabrir (paleta Lousa → Abyss, fonte Consolas, letra 15, entrelinha maior); três cliques seguidos não se perdem; fica guardada; "Voltar ao padrão" volta tudo. Opção `webgl`: os terminais desenham em WebGL (sem texto no HTML) e, com o WebGL derrubado de propósito num deles, ele volta sozinho ao desenho normal enquanto o outro segue em WebGL | a-lousa, b-abyss; com `webgl`: c-webgl, d-webgl-abyss, e-caiu |
| `print` | demo | Fatia 16, com o `apoio/eco-print.mjs` no lugar do Claude: Ctrl+V com um print na área de transferência manda o Alt+V (ESC v); com texto, cola o texto marcado; vazia, segue o ^V cru. Arquivo arrastado por cima do terminal mostra a borda tracejada; soltar um arquivo sem caminho no disco não cola nada; arquivo solto na lousa não abre no lugar dela; terminal comum não tem o 📎. Usa a área de transferência (devolve o texto) | arrastando |
| `painel` | agente | Fatia 17, **com Claude de verdade**: o agente abre com `--settings` (arquivo da Lousa em `<dados>\agentes`), a linha de status grava o JSON e o `agentes:painel` chega com modelo, esforço e os limites de 5 h e 7 dias; o `ultimoPainel` devolve o mesmo. Sai com Ctrl+C, sem mandar mensagem. Para as Fatias 18 a 20, sem Claude: `prova.ipc('agentes:painel', { quadroId, painel })` | agente |

**Desenho do terminal nas provas (T15.2):** o app usa o desenho WebGL, que não deixa o texto
no HTML. Por isso, numa rodada de prova, o main abre a tela com `?desenho=dom` e os terminais
ficam no desenho normal, que os cenários sabem ler (`.xterm-rows`). Só a opção `webgl` liga o
WebGL na rodada. Cada terminal diz o seu desenho em `.terminal[data-desenho="webgl"|"dom"]`.

Todo cenário devolve `"ok": true` quando tudo o que ele prova deu certo; o resto do
`resultado.json` mostra cada valor, para achar o que falhou.

Resultado de referência (19/10/2026, `desempenho acumular`): versão anterior ao D17 = eco
mediana 86 ms, pior 245 ms, tela travada 20,9 s em ~35 s; depois = 20 a 23 ms, nenhuma
travada.

**Estados** (`estados.mjs`):

- `demo`: dois terminais comuns na `pasta-demo`, um com a conta Principal e outro com a
  Pessoal, sem login.
- `casa`: a sua pasta de usuário salva na lateral, só para leitura, mais os dois
  terminais.
- `git`: dois repositórios git novos, `app` e `api`, criados na saída da rodada, com
  identidade própria e `core.autocrlf false`. Há três terminais: `q1` e `q3` em app e
  `q2` em api, longe, fora da tela. O `app` traz `docs/plano/fatia-12.md` e o mesmo nome
  dentro de `node_modules` (ignorado). Os dois nascem limpos, porque o Juntar recusa
  qualquer alteração pendente.
- `agente`: **um agente de verdade** (`a1`, `claude.exe` da conta Pessoal) na cópia da
  `pasta-demo`. A pasta é nova, então o Claude pergunta se confia nela, com a seta em "No,
  exit"; o cenário leva a seta ao "Yes".

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
| `imagemNaArea()` | O main põe um print de 1 ponto na área de transferência (a tela só copia texto) |

O que já ensinou a escrever cenário:

- **Linha quebrada:** o terminal quebra linhas longas, e o espaço no fim de uma linha
  quebrada some do texto da tela. Compare sem espaços.
- **Depois de Reabrir ou remontar:** o prompt antigo continua na tela. Espere a barra
  sumir **e** um prompt novo.
- **Botão direito:** o clique injetado pelo main não gera `contextmenu`. Dispare o evento
  na `.xterm-screen`.
- **Fotos:** saem sem animação (o smoke liga "reduzir movimento"), e cada foto é tirada
  duas vezes, porque a primeira às vezes vem com a tela anterior.
- **Conferir o disco ou o git:** a tela não lê arquivos. Pergunte a um terminal do
  cenário com `perguntar(id, expressão)` (ver `copias.js`): a resposta vem entre marcas
  `<R1>…</R1>`, montadas com concatenação para não casar com o eco do comando. Depois de
  mandar um comando, pergunte `'pronto'` **no mesmo terminal** antes de conferir em outro:
  é isso que garante que o comando terminou.
- **Campo de texto do React:** mude o valor pelo setter nativo e dispare `input` (ver
  `preencher`). Tecla injetada sem `{ type: 'char' }` não escreve nada: Shift+Enter só
  quebra a linha com o `char`.
- **Ctrl+clique para selecionar:** o React Flow só soma a seleção se receber um `keyDown`
  de `Control` antes do clique.
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
| `apoio/print-claude.mjs <pasta-vazia> <imagem.png>` | Prova da T16.0, **com Claude de verdade** (conta Pessoal; pede o ok do Sidney). Abre o `claude.exe` num ConPTY, escolhe "Yes" na confiança da pasta e tenta quatro jeitos de anexar um print, sem mandar mensagem. Usa a área de transferência e devolve o texto que estava nela. `SAIDA_TEXTO=<arquivo>` guarda a tela, com e-mail mascarado. Roda como o `conpty-osc` |
| `apoio/eco-print.mjs` | No lugar do Claude, no cenário `print`: diz o que o terminal recebeu (`IMAGEM OK` para ESC v, `CTRL-V CRU`, `COLADO=...` para o colar marcado). Sai com `q` |

A `pasta-demo` guarda o `.git` e o `node_modules` como `_git` e `_node_modules`, porque o
git não aceita guardar os dois. O `rodar.mjs` devolve os nomes certos na cópia de cada
rodada.
