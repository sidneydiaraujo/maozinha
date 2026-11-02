# Provas na janela real

Cenários que rodam **dentro da Lousa de verdade** (janela escondida), com terminais de
verdade, para provar o que teste de unidade não alcança: aviso do agente, links, copiar e
colar, árvore viva, desempenho da digitação. Nasceram nas provas das Fatias 8 e D17.

Nunca usam o seu estado nem as suas contas. Cada rodada cria, em `provas/saida/` (fora do
git), uma pasta de dados nova e uma cópia nova da `pasta-demo`. Nenhum cenário abre um
Claude de verdade, **salvo o `painel`, o `anel`, o `modelo`, o `time` e o `osc-saida`** (estado `agente`, conta Pessoal, pedem o ok
do Sidney; não mandam mensagem). O aviso do agente usa o "Claude falso" (`apoio/falso-claude.mjs`).

## Como rodar

```
node provas/rodar.mjs <cenario> [--sem-build] [opções do cenário]
```

- Sem `--sem-build`, monta o app antes (`electron-vite build`). Use `--sem-build` para
  rodar vários cenários seguidos.
- Opção `sem-claude` (`time`, `repasse`, `juntar-time`; 27/10): os agentes abrem só o
  PowerShell, sem o `claude.exe` de verdade, e o cenário usa o Claude falso. Rodada leve: com
  seis Claudes de verdade abertos de uma vez o PC ficou sem memória em 21/10.
- Se o app não sai até 30 s depois de gravar o resultado (ou passa de 12 min), o `rodar.mjs`
  encerra a árvore de processos (`taskkill /T`) e avisa. Às vezes o Electron cai **ao sair**
  (código -1073740791) com os terminais do cenário abertos: o resultado já foi gravado, e o
  `rodar.mjs` avisa para conferir o `ok`.
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
| `desempenho` | casa | Eco da tecla (mediana, p90, pior) e atraso da tela com a pasta do usuário aberta e um terminal soltando 1,3 MB e pingando. Opção `acumular`: 10 mil arquivos mudados chegam antes (30 min da pasta do usuário na versão antiga). Opção `brilho` (T21.2): o estado `casa` ganha t3 a t5, os 5 quadros recebem "trabalhando" pelo `prova.ipc` e a rodada mede **com** as animações (sem "reduzir movimento"): 4 com o brilho girando e o quinto com a borda parada | brilho (com a opção) |

| `copias` | git | Fatia 10: "Cópia separada" já marcada numa pasta com quadro, quadro `app ⑂ terminal-N` com pasta e branch próprias, fechar a cópia limpa apaga pasta e branch, fechar com arquivo novo mantém tudo, a cópia mantida aparece na janelinha, quadros novos não ficam um em cima do outro (T24.1) | 1..5 |
| `juntar` | git | Fatia 11: resumo "1 commit… para juntar em main", Juntar leva o arquivo para a original, fechar apaga cópia e branch, conflito desfaz o merge (original limpa), cópia com alteração sem commit avisa e o main recusa | 1..5 |
| `paleta` | git | Fatia 12: Ctrl+K de verdade com o terminal em foco, "api" leva a vista ao quadro fora da tela, "fatia" acha o arquivo da subpasta e não o de `node_modules` e abre no leitor, "novo api" abre a janelinha com api marcada (sem abrir agente sozinho), Ctrl+F conta 11 achados, começa no 11 e Enter sobe para o 10 (T24.2) | 1..5 |
| `envio` | git | Fatia 13: um quadro selecionado não mostra a barra, Ctrl+clique de verdade no segundo mostra "Para 2 quadros", Shift+Enter quebra a linha sem enviar, Enter chega aos dois e o terceiro não recebe | 1..2 |
| `notas` | git | Fatia 26: "+ Nota" nasce escrevendo e fora de cima dos quadros, o texto é salvo sem "Pronto", o markdown aparece, "➤ Mandar" escreve só no terminal clicado, Ctrl+K "Nova nota" cria outra, nota vazia apaga sem perguntar | 1..3 |
| `vistas` | git | Fatia 27: Ctrl+K guarda "foco", o q1 é arrastado com o mouse de verdade, "Vista: foco" devolve o q1 ao mesmo pixel e à mesma câmera (salvo no main), "apagar foco" apaga | 1..3 |
| `selecao` | demo | Correção D37: arrastar o mouse de verdade sobre uma linha com a lousa a 80% e a mais de 100% (⤢) pinta a seleção em cima do texto (desvio ≤ 4 px) e o Ctrl+C copia exatamente a linha arrastada (A1: a letra é redesenhada no zoom); o botão do meio por cima do terminal arrasta a lousa os mesmos 200 px do mouse, a 176% e a 59% | reduzida, ampliada |
| `ampliar` | demo | D38: ⤢ amplia, volta à vista exata, amplia de novo, amplia depois de arrastar a lousa com o botão do meio e passa para o outro quadro | 1..2 |
| `prontas` | git | Fatia 25: clique no terminal e Ctrl+K "Mandar: Rode os testes…" escreve só nele ("Enviado para 1 quadro"); o ★ da barra lista as três padrão, guarda, preenche e apaga | 1..3 |
| `aparencia` | demo | Fatia 15: a Aparência da engrenagem muda os terminais abertos na hora, sem reabrir (paleta Lousa → Abyss, fonte Consolas, letra 15, entrelinha maior); três cliques seguidos não se perdem; fica guardada; "Voltar ao padrão" volta tudo. Opção `webgl`: os terminais desenham em WebGL (sem texto no HTML) e, com o WebGL derrubado de propósito num deles, ele volta sozinho ao desenho normal enquanto o outro segue em WebGL | a-lousa, b-abyss; com `webgl`: c-webgl, d-webgl-abyss, e-caiu |
| `print` | demo | Fatia 16, com o `apoio/eco-print.mjs` no lugar do Claude: Ctrl+V com um print na área de transferência manda o Alt+V (ESC v); com texto, cola o texto marcado; vazia, segue o ^V cru. Arquivo arrastado por cima do terminal mostra a borda tracejada; soltar um arquivo sem caminho no disco não cola nada; arquivo solto na lousa não abre no lugar dela; terminal comum não tem o 📎. Usa a área de transferência (devolve o texto) | arrastando |
| `painel` | agente | Fatia 17, **com Claude de verdade**: o agente abre com `--settings` (arquivo da Lousa em `<dados>\agentes`), a linha de status grava o JSON e o `agentes:painel` chega com modelo, esforço e os limites de 5 h e 7 dias; o `ultimoPainel` devolve o mesmo. Sai com Ctrl+C, sem mandar mensagem. Para as Fatias 18 a 20, sem Claude: `prova.ipc('agentes:painel', { quadroId, painel })` | agente |
| `anel` | agente | Fatia 18: o `claude.exe` abre e o cenário responde "No, exit" na confiança da pasta (o Claude fecha sem mensagem; fica o PowerShell). Com painel e estado pelo `prova.ipc`: sem painel e com 30% no padrão o anel não aparece; "Sempre" na engrenagem vale na hora; 30 normal, 75 âmbar, 95 vermelho, com o balão "30% do contexto usado (60 mil de 200 mil)"; trabalhando o anel fica cinza, o clique não abre nada e o main recusa o `agentes:compactar`; parado, o clique pergunta "Compactar a conversa agora?" e o cenário cancela | 1-30, 2-75, 3-95, 4-trabalhando, 5-pergunta |
| `git-conta` | demo | C1 (D42): engrenagem → Pessoal → "Git e GitHub"; e-mail sem @ recusado sem gravar; salvo, o t2 reaberto recebe nome, e-mail, `GH_CONFIG_DIR` na pasta de dados da rodada e `GCM_NAMESPACE=lousa-pessoal`, e o `gh` dele não vê o login do PC; o t1 (Principal) não recebe nada | 1-formulario, 2-terminais |
| `uso` | demo | Fatia 20, sem Claude: o uso vem pelo `prova.ipc('perfis:usoMudou')`. Ao abrir, `perfis.uso()` vazio, nenhuma barra e "sem dado ainda" no balão; A4: por padrão o mostrador à vista ao lado do ícone ("sessão 42% 2h10", vermelho/âmbar na Pessoal, cinza com dado velho) e nenhuma barrinha; engrenagem → "Uso das contas" → "Só no clique" tira o mostrador e volta às barras; Principal 42%/18% com duas barras azuis e o balão "Sessão 42% · zera em 2h10", "Semana 18% · zera sex 09:00", "visto agora"; Pessoal 92%/75% visto há 2 h com vermelha e âmbar, mas em cinza | 0-mostrador, 0-engrenagem, 1-barras, 2-balao |
| `modelo` | agente | Fatia 19 refeita na D49: trocar modelo ou esforço **reabre** o agente com `--model`/`--effort` na mesma conversa; nunca digita `/model`. Claude de verdade na pergunta de confiança: Sonnet só fica guardado ("Vale quando o agente parar") e nada reabre; "No, exit" e o painel gravado pelo PowerShell em `<dados>\agentes\a1.json` (a primeira linha de status = pronto) reabrem com `--model sonnet`; com o falso `apoio/eco-modelo.mjs` (o node copiado como `claude.exe`) parado, "alto" reabre na hora com `--model sonnet --effort high`; trabalhando, Haiku só guarda e reabre ao parar; nada de `/model` ou `/effort` chega ao agente; "⚠ médio" e o salvo (haiku/high) como antes | 1-painel, 2-reaberto, 3-recusado |
| `juntar-time` | juntar-time | Fatia 31 (D44), Claude de verdade fechado na confiança ("No, exit", nenhuma mensagem); três cópias reais (git worktree) ligadas a1 → a2 → a3: menu da linha → "Juntar o time" lista c1, c2, c3; c1 entra, c2 (arquivo não salvo) fica de fora, c3 para no conflito com "Pedir ao agente de c3 para resolver"; a c1 fica sem nada a juntar e a c3 mantém o commit | 1-lista, 2-resultado |
| `zoom-de-cima` | demo | D46: clique no t1 e a lousa se afastando pelo "-": com a letra entre 6 e 9 px o t1 (ativo) redesenha nítido e o t2 fica na imagem; abaixo de 6 px o t2 para de desenhar e mostra a capa (nome grande), o t1 não pausa; de volta perto, ninguém pausado | 1-meio, 2-de-cima |
| `cabecalho` | demo | D47: cabeçalho do quadro com ~31 px a 100% (antes ~28), letra Bahnschrift, ⤢ e × com fundo azul e vermelho, borda do quadro 2 px (4 px em cima) | 1-cabecalho |
| `historico` | demo | D48: aba "Histórico" ao lado de "Pastas" lista t1 e t2; o clique no t2 leva a lousa até ele, ampliado (de novo: continua ampliado); fechar o t1 deixa ele no fim, apagado e sem clique; voltar para "Pastas" mostra a árvore como estava | 1-historico, 2-ampliado, 3-fechado |
| `tamanho` | demo | A14: o terminal cabe no recipiente (nada sob a barra de rolagem nem abaixo da borda) com a lousa a 80%; puxar o canto do quadro aumenta e diminui as colunas e o PowerShell concorda (uma linha de `#` da largura dele cabe numa linha só); o × pergunta "Tem certeza que deseja fechar?", Cancelar e Esc mantêm, Fechar fecha; A23: sem escolher o quadro, os quatro cantos existem, a borda direita responde numa faixa de 12 px para fora do quadro e puxar por ela alarga o quadro | 1-normal, 2-maior, 3-pergunta |
| `kanban` | time | Fatia 33 (D52), com `sem-claude`: abrir agentes cria um `KANBAN.md` em app e api com as sete etapas (Pendente a Concluído, com o bloqueio), fora do git (`git check-ignore` acha, `git status` não lista); a árvore mostra os dois; o leitor abre e acompanha sozinho o card criado e depois trocado pelo PowerShell do a1, com emoji e acento inteiros; o campo de papel aparece num agente fora de time ; A22: a caixa "Kanban do projeto" do Novo quadro vem marcada no projeto com kanban (`repos:temKanban`); desmarcada, o agente novo guarda `kanban: false` e nenhum `KANBAN.md` a mais aparece; A24: o botão "kanban" do cabeçalho mostra a escolha (a1 ligado, o novo desligado) e o clique liga e salva | 1-kanban, 2-movido, 3-novo, 4-cabecalho |
| `escrevendo` | time | A16 (D55), com `sem-claude`: o PowerShell do a1 grava `<dados>\agentes\a1.escrita.json` como o gancho `PostToolUse`; o settings do a1 tem o gancho; salvar em `docs/` põe a bolinha piscando na raiz `app`; num `pacotes/web` com `package.json`, a bolinha vai para `pacotes` (fechada) e, aberta, para `web`; uma só; `node_modules` não muda nada | 1-raiz, 2-fechada, 3-projeto |
| `pedir-colegas` | time | Fatia 34 (D56), com `sem-claude`: o settings do a1 libera `mcp__maozinha__criar_colegas` e o `a1.mcp.json` existe; o PowerShell do a1 chama `criar_colegas` com a url e a chave dele; a tela pergunta "Claude 1 quer criar 1 colega" e nada nasce antes do clique; "Criar o colega" cria o quadro ligado ao a1, na mesma conta, com o papel, e a resposta volta; num segundo pedido o Esc recusa; com `paralelo` (A21) a janela pergunta "Ver em quadros" / "Seguir no mesmo terminal" e o colega nasce na mesma pasta com a linha pausada; o ＋ do quadro (A20) abre um terminal livre na mesma pasta, sem linha | 1-pergunta, 2-criado, 3-paralelo, 4-mais |
| `prontos` | time | A26 (D59), com `ligados sem-claude` (a1 -> a2 no app, a3 no api): avisos pelo `prova.ipc`; o "terminou" sai do "esperando você" e vira a pílula verde com a mãozinha acenando (mesmo com as animações do Windows reduzidas); membro do time não entra e o líder espera o time parar; um pronto leva direto e sai da fila; dois abrem a lista do mais antigo ao mais novo com o projeto e "líder · 2 agentes"; a linha enquadra o quadro | 1-um-pronto, 2-fila, 3-depois |
| `repasse` | repasse | Fatia 30 (D43), Claude de verdade fechado na confiança ("No, exit", nenhuma mensagem) e depois o falso `apoio/eco-repasse.mjs` nos dois agentes já ligados a1 → a2: a1 termina 4 vezes seguidas; o a2 recebe 3 repasses com o que o a1 disse e a linha mostra "→ passou para Claude 2"; no quarto a linha pausa no main e diz "Limite de 3 repasses: Continuar?"; o clique retoma e passa (sem abrir o menu); "perguntar" mostra "▶ Passar para Claude 2" e só passa no clique; a2 encerrado: "Claude 2 está fechado" | 1-passou, 2-limite, 3-perguntar, 4-fechado |
| `time` | time | Fatias 28 e 29, **com Claude de verdade** (ok do Sidney em 21/10; "No, exit" na confiança, nenhuma mensagem), ou com a opção `sem-claude` (sem nenhum): bolinhas só nos agentes; soltar a linha no vazio cria colega; a1→a3 recusado (contas), a1→a2 âmbar, a volta recusada; clique na bolinha cria colega na cópia; menu (perguntar, pausar, tracejada); o rótulo também abre o menu; "Abrir o colega numa cópia"; salvo = tela; fechar quadro tira as linhas; papel "Construtor"; com só o PowerShell nada é digitado, nem com "parado" fingido; com o Claude falso (`apoio/eco-time.mjs`, o node copiado como `claude.exe`) a apresentação chega | 1..5 |
| `osc-saida` | agente | Investigação (T29.1): grava o OSC 7501 cru do `claude.exe` na confiança da pasta e depois do "No, exit". Em 21/10: só a pergunta `?`, nenhum estado | — |

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
