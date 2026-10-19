# Estado da construção

**Próxima tarefa: T10.3** — quadros e canais da cópia separada (`docs/plano/fatia-10-copias-separadas.md`).
Em paralelo, com o Sidney: **T7.6 + T8.8** — testar com o instalador novo os itens 17 a 30 (com o 20b) do `docs/aceite/roteiro.md`.
A Fatia 9 (Codex/ChatGPT, T1.4b) espera o Sidney começar a usar o ChatGPT.

Atualize este arquivo no mesmo commit de cada tarefa: marque ✅, troque a
"Próxima tarefa" e escreva uma linha no diário.

## Tarefas

| Id | Tarefa | Status |
|---|---|---|
| T0 | Esqueleto: Electron + React + régua + `npm run smoke` | ✅ 13/10/2026 |
| T1.1 | Modelo compartilhado | ✅ 14/10/2026 |
| T1.2 | Detectar as contas do PC | ✅ 14/10/2026 |
| T1.3 | Montar o ambiente de um terminal | ✅ 14/10/2026 |
| T1.4 | Ler o status de login (Claude) | ✅ 14/10/2026 |
| T1.4b | Ler o status de login (Codex) | ⏸ adiada (v1 começa só com Claude; fazer antes de testar ChatGPT) |
| T1.5 | Guardar o estado | ✅ 14/10/2026 |
| T1.6 | Serviço e canais das contas | ✅ 14/10/2026 |
| T1.7 | Barra lateral de contas | ✅ 14/10/2026 |
| T1.8 | Nova conta (Claude ou Codex) | ✅ 18/10/2026 (dentro da engrenagem, T7.5) |
| T2.1 | Serviço de terminais | ✅ 14/10/2026 |
| T2.2 | node-pty real + teste de isolamento | ✅ 14/10/2026 |
| T2.3 | Canais dos terminais (login) | ✅ 14/10/2026 |
| T2.4 | Componente de terminal | ✅ 14/10/2026 |
| T2.5 | Botão "Entrar" | ✅ 14/10/2026 |
| T3.1 | Sugerir a conta de um repo | ✅ 14/10/2026 |
| T3.2 | Serviço e canais de repos | ✅ 14/10/2026 |
| T3.3 | Fluxo "Adicionar repositório" | ✅ 14/10/2026 |
| T3.4 | Lousa: molduras e quadros | ✅ 14/10/2026 |
| T3.5 | Salvar e reabrir a lousa | ✅ 14/10/2026 |
| T3.6 | Conta padrão do repo e remover | ✅ |
| T4.1 | Instalador | ✅ |
| T4.2 | Aceite da jornada (11 itens) | 🟡 parcial: teste de 14/10 aprovou duas contas em paralelo; resto vai na T5.4 |
| T5.1 | Modelo: pasta sem moldura, quadro com posição na lousa | ✅ 14/10/2026 |
| T5.2 | Lousa livre | ✅ 14/10/2026 |
| T5.3 | Um só jeito de criar | ✅ 14/10/2026 |
| T5.4 | Aceite com a lousa livre | 🟡 17/10: arrastar a lousa dentro da moldura falhava (versão antiga); vira a T6.6 |
| T6.1 | Conversa por quadro e trocar a conta mantendo a conversa | ✅ 17/10/2026 |
| T6.2 | Cabeçalho: pasta em destaque, selo da conta | ✅ 17/10/2026 |
| T6.3 | Barra só com contas; pastas no "Novo quadro" | ✅ 17/10/2026 |
| T6.4 | Login sem terminal, animado | ✅ 17/10/2026 |
| T6.5 | Emoji com largura certa no terminal | ✅ 17/10/2026 |
| T6.6 | Aceite | ✅ 18/10/2026 |
| T7.1 | Arquivos no main: listar, ler, abrir fora, vigia | ✅ 18/10/2026 |
| T7.2 | Barra de cima: engrenagem e ícones das contas | ✅ 18/10/2026 |
| T7.3 | Pastas na lateral, em cascata, com os alterados | ✅ 18/10/2026 |
| T7.4 | Leitor de md e código | ✅ 18/10/2026 |
| T7.5 | Nova conta (T1.8) | ✅ 18/10/2026 |
| T7.6 | Aceite | ⬜ |
| T8.1 | Aviso do agente no main (OSC 7501) + notificação do Windows | ✅ 18/10/2026 |
| T8.2 | Aviso na tela: brilho, selo, contador, minimapa | ✅ 18/10/2026 |
| T8.3 | Copiar, colar e links no terminal | ✅ 18/10/2026 |
| T8.4 | Histórico de 10 mil linhas, ampliar quadro, letra com Ctrl+roda | ✅ 18/10/2026 |
| T8.5 | Reabrir terminal encerrado | ✅ 18/10/2026 |
| T8.6 | Registros em arquivo | ✅ 18/10/2026 |
| T8.7 | Janela lembra tamanho e posição | ✅ 18/10/2026 |
| T8.9 | Digitação lenta e erro EPERM: vigia só das pastas abertas, histórico em pedaços (D17) | ✅ 19/10/2026 |
| T8.8 | Aceite | ⬜ |
| T10.1 | Cópia separada: modelo e regras puras | ✅ 19/10/2026 |
| T10.2 | Git de verdade e serviço de cópias | ✅ 19/10/2026 |
| T10.3 | Quadros e canais | ⬜ |
| T10.4 | Tela: opção na janelinha, selo da branch, aviso ao fechar | ⬜ |
| T10.5 | Aceite | ⬜ |

## Bloqueios

Nenhum.

## Bom saber antes de testar com contas reais

- Em 13/10/2026 as duas pastas de configuração (`~/.claude` e
  `~/.claude-pessoal`) estavam logadas no mesmo gmail pessoal. A conta da
  empresa só aparece depois de logar nela (`/login` no terminal "Empresa" ou,
  quando existir, o botão da T2.5).
- O `claude.exe` fica em `C:\Users\sidne\.local\bin`, fora do PATH do Windows.

## Diário

- **14/10/2026 (conta da empresa, Sonnet):** o Sidney definiu o teste da v1:
  duas contas distintas (Claude+Claude ou Claude+ChatGPT), no mesmo repo ou em
  repos diferentes. Plano ajustado antes de escrever código (D11): `provedor` na
  conta, conta por quadro, T1.4b (status Codex) e T1.8 (nova conta) novas,
  quadro `agente`. Codex não está instalado no PC; formato do status a confirmar.
- **13/10/2026 (conta pessoal, Opus):** repositório criado. Esqueleto com
  Electron 41, React 19, ESLint 10 com as regras do claude-pessoal, Vitest.
  Provado: `node-pty` 1.1.0 pré-compilado funciona no Node (`npm test`) e no
  Electron (`npm run smoke`), sem compilador C++. Achado: `kill()` em processo
  já encerrado gera "AttachConsole failed" (corrigido e anotado no CLAUDE.md).
  Plano completo em `docs/plano/`.
- **14/10/2026 (T1.1):** `src/shared/model.ts` criado a partir do bloco de tipos da ARQUITETURA (com `Provedor`, conta por quadro). `npm run check` verde.
- **14/10/2026 (T1.2):** `src/main/perfis/detectar.ts` com 9 testes. No PC do Sidney acha `principal` (~/.claude) e `pessoal` (~/.claude-pessoal, com a pasta pessoal como raiz). Dica: o TS usa `noUncheckedIndexedAccess`, então `arr[i]` pode ser `undefined`.
- **14/10/2026 (T1.3):** `src/main/perfis/ambiente.ts` (`montarAmbiente`, lista permitida, `CLAUDE_CONFIG_DIR` ou `CODEX_HOME` só em conta não padrão) com 10 testes. `npm run check` verde (23 testes).
- **14/10/2026 (T1.4):** `src/main/perfis/conta.ts` (localizarClaude, interpretarStatus, lerStatusConta, executarReal) com 12 testes. Conferido no PC: `principal` = plano team (e-mail da empresa), `pessoal` = plano pro (gmail), cada uma lida com o próprio ambiente. Atenção T1.4b: `executarReal` ainda não trata `.cmd`.
- **14/10/2026 (T1.5):** `src/main/estado/armazem.ts` (JSON atômico, schema zod, arquivo estragado vai para `.corrompido-<data>`) com 7 testes; 42 no total. Sidney decidiu começar só com duas contas Claude: T1.4b adiada, não removida.
- **14/10/2026 (T1.6 + T1.7):** `ServicoPerfis` (cache da conta, renomear grava só o nome), canais `perfis:listar/renomear/atualizarConta`, `contexto.ts`, barra lateral (`BarraContas`, `CartaoConta`). Conferido com captura de tela no PC do Sidney: Principal (team, e-mail da empresa) e Pessoal (pro, gmail), cores e etiqueta Claude. `npm run check` (48 testes) e `npm run smoke` verdes. Contas Codex mostram erro "ainda não disponível" até a T1.4b. Próxima: T1.8 (Nova conta) é opcional para Claude+Claude; seguir para a fatia 2 (T2.1) é o caminho mais curto até o login e a lousa.
- **14/10/2026 (T2.1–T2.3):** `ServicoTerminais` (idempotente, buffer 200 mil), `spawnReal`, `isolamento.test.ts` (4 casos em terminal real: principal, pessoal, Codex padrão e Codex extra; rodaram, não foram pulados), `resolverAlvo`/`comandos.ts`, canais `terminais:*` e eventos `terminais:dados/saiu`, `registrarCanais()` no `index.ts`. 66 testes e smoke verdes.
- **14/10/2026 (T2.4 + T2.5):** `Terminal.tsx` (xterm, assina eventos antes do `abrir` e ignora os que chegam antes da resposta, pois já estão no buffer), `JanelaLogin.tsx`, botão Entrar/Trocar login. Mudança em relação ao plano: o comando de login é `claude auth login; if ($?) { exit }`, porque o shell não fecha sozinho quando o `claude` termina (a tela só saberia que acabou se o shell saísse). Provado com captura de tela (comando trocado temporariamente por `claude auth status`, sem abrir navegador): o botão da conta Pessoal abre um terminal real cujo `claude` enxerga `.claude-pessoal` e o gmail. O login de verdade (navegador) ainda não foi exercitado: é o item para o Sidney validar.
- **14/10/2026 (T3.1 + T3.2):** `sugerir.ts` (raiz da conta, depois a última usada, depois a primeira; `pessoal-2` não casa com a raiz `pessoal`), `ServicoRepos` (um repo aparece uma vez; conta padrão por repo; remover leva os quadros), canais `repos:*` com o seletor de pasta do Windows no handler. `ServicoPerfis.detectados()` novo (lista sem ler login, rápido). 81 testes verdes.
- **14/10/2026 (T3.3):** `AdicionarRepo.tsx` + botão "+ Adicionar repositório". Captura de tela: `C:\Users\sidne\pessoal\lousa-ia` vem com Pessoal sugerida e focada (Enter confirma). Sem a lousa (T3.4) o único retorno é a linha verde "Adicionado: ..." na barra; provisório. T3.4 dividida em T3.4a (main: quadros, alvo, `lousa:carregar`) e T3.4b (tela React Flow).
- **14/10/2026 (T3.4a):** `ServicoQuadros` (conta fixa por quadro, título numerado por prefixo, grade de 2 colunas), `resolverAlvo` para quadros (pasta do repo, conta do quadro, `claude`/`codex` conforme o provedor), canais `quadros:criar/remover` e `lousa:carregar`. 91 testes. Teste chave: dois quadros do mesmo repo com contas diferentes resolvem perfis diferentes e a mesma pasta.
- **14/10/2026 (T3.4b):** `Lousa.tsx` (React Flow), `RepoNode` (moldura neutra, "+ Terminal" e "+ Agente" com ▾ para escolher a conta), `QuadroNode` (cor da conta do quadro, não do repo), `nos.ts` (+4 testes). 95 testes e smoke verdes. **Prova (captura de tela, pasta de dados temporária):** um repo com dois quadros `agente`, um na conta Principal (empresa) e outro na Pessoal, abriram dois Claude Code reais lado a lado, cada um com a sua cor. Layout ainda não é salvo ao arrastar/redimensionar (T3.5). Faltam também o menu "⋯" da moldura (conta padrão/remover) na T3.6.
- **14/10/2026 (T3.5):** `lousa/layout.ts` (`aplicarLayout` + schema zod: números finitos, tamanho mínimo 50, zoom 0,05 a 4, ids desconhecidos ignorados), canal `lousa:salvarLayout`, hook `useSalvarLayout` (debounce 500 ms ao soltar/redimensionar/mover a vista), a vista salva é restaurada ao abrir (`fitView` só enquanto a vista nunca foi mexida). 102 testes, lint sem avisos, smoke verde. Provado pelos canais reais (pasta de dados temporária): salvar → carregar devolve os valores novos, `ghost` ignorado, zoom 99 recusado, valores no `estado.json`. **Não provado:** o arrastar/redimensionar com o mouse chamando o salvar (a fiação React); o Sidney deve arrastar um quadro, fechar e abrir. Armadilha do ambiente: no Bash do Claude Code, `\` dentro de heredoc vira `\` (quebrou um caminho num teste); prefira o Write/Edit para arquivos com barras.
- **14/10/2026 (T3.6):** menu "⋯" na moldura (`MenuRepo`, em portal para não ficar sob os quadros): "Conta padrão" muda só os quadros novos; "Remover repositório…" pede confirmação, fecha os terminais do repo (`ServicoRepos.remover` agora recebe `fecharTerminal`, +1 asserção) e tira moldura e quadros, sem tocar nos arquivos. Ações da lousa extraídas para `useAcoesLousa`. **Prova (captura, pasta temporária):** menu aberto sobre os quadros mostrando ✓ Principal / Pessoal / Remover. Não provado por clique: confirmar a remoção e trocar a conta na tela.
- **14/10/2026 (T4.1):** `electron-builder 26.15.3` (`npm run dist`), NSIS por usuário, `asarUnpack` do node-pty, `npmRebuild: false` (sem compilador C++; o node-pty usa os binários prontos) e `signAndEditExecutable: false` (sem assinatura; hash em `release/SHA256.txt`). Gerou `release/Lousa.ia Setup 0.0.1.exe` (103 MB). **Prova:** `release/win-unpacked/Lousa.ia.exe --smoke` (mesmo conteúdo do instalador) terminou com código 0: node-pty e tela+preload+IPC ok. **Não instalei** no PC do Sidney; o item 1 do aceite (instalar e abrir pelo Menu Iniciar) fica com ele. Sem ícone próprio ainda (usa o do Electron).
- **14/10/2026 (T4.2, preparo):** README com "Instalar e usar" e `docs/aceite/roteiro.md` com os 11 itens (item 8, ChatGPT, adiado). A execução é do Sidney; o resultado com prints vira `docs/aceite/2026-xx-xx.md`.
- **14/10/2026 (teste do Sidney no instalador):** achados e correções. (1) Login reaproveitava o terminal antigo e abria preso no `^C`/`yes`: agora cada "Entrar" fecha o terminal de login anterior (`terminais:fecharLogin`) e começa limpo; há "Tentar de novo". (2) O navegador entrou na conta da empresa e a Pessoal ficou com o e-mail da Principal: a janela explica como usar janela anônima e o cartão avisa "Mesmo e-mail da conta X". (3) "⋯" e "+ Agente ▾" só aparecem depois de adicionar um repo (esperado). Resta o Sidney refazer o login da Pessoal com o gmail.
- **14/10/2026 (2º teste do Sidney):** (1) Trocar o login da Principal mudou o VSCode: a Principal é a conta padrão do PC (`~/.claude`, sem variável), compartilhada de propósito com VSCode/terminais; contas extras (pasta própria) não interferem. Correção: etiqueta "padrão do PC · compartilhada" no cartão e janela de confirmação antes de trocar o login dela. Solução de fundo (Lousa com contas próprias, independentes do VSCode) é a T1.8 "+ Nova conta". (2) Moldura invisível: o estado real tinha zoom 0,35 e posição fora da tela; a lousa agora enquadra sozinha se nenhum repo está visível e ao adicionar repo. Moldura vazia mostra botões grandes "+ Claude · <conta>" e "+ Terminal"; menu virou "Opções ⋯". Provado por captura com cópia do estado real.
- **14/10/2026 (3º teste do Sidney, três Claude):** funcionou. Claude 1 na Principal (login gmail, pro) respondeu sobre o Thunders Gestão com a memória de `~/.claude`; Claude 2 e 3 na Pessoal (login empresa, Team) responderam sobre o lousa-ia com a memória de `~/.claude-pessoal`. Isolamento e layout salvo confirmados. Achados: (a) logins cruzados — a pasta (memória/skills) segue o cartão e o login (quem paga) segue o e-mail escolhido; hoje o trabalho da empresa sai no plano pessoal e vice-versa; o Sidney vai refazer os dois logins. (b) Moldura do repo prende o canvas e "abrir um Claude" aparecia em três lugares: vira a Fatia 5 (D13).
- **14/10/2026 (T5.1–T5.3, um commit):** lousa livre. Modelo: `Repo` sem moldura (`perfilPadraoId` vira "última conta usada"), `Quadro.caixa` na lousa, estado versão 2 com migração da 1 (`estado/migrar.ts`: soma a posição da moldura; +4 testes, um com o retrato do estado real); `repos:adicionar` devolve a pasta existente em vez de recusar; `quadros:criar` exige conta e aceita posição; saem `repos:mudarPerfilPadrao` e `repos` do layout. Tela: só quadros (cabeçalho título · conta · pasta), janelinha "Novo quadro" (conta + pasta + "Abrir agente/terminal") com três portas — arrastar o cartão, duplo clique no vazio, "+ Agente" no cartão; barra lateral com "Pastas" (× fecha os quadros dela, não apaga arquivos). Saem `RepoNode`, `MenuRepo`, `AdicionarRepo`, `useAcoesLousa` e 27 regras de CSS mortas. 104 testes, lint zerado, smoke ok. **Prova (capturas com cópia do estado real v1):** quadros migrados sem moldura; duplo clique abriu a janelinha com a conta e a pasta marcadas. Não provado por clique real: soltar o cartão arrastado (o HTML5 drag não roda no modo escondido) e "Outra pasta…".
- **17/10/2026 (4º teste do Sidney, ainda na versão das 15:15, com moldura):** (1) dentro da moldura não dava para arrastar a lousa: some com a lousa livre; e o botão do meio do mouse agora arrasta a lousa em qualquer ponto, até sobre os quadros (`usePanoMeio`), porque com zoom alto os quadros cobrem a tela. Provado na janela real (cópia do estado): esquerdo no vazio move a vista, meio sobre o terminal move a vista, esquerdo no terminal não move (fica com a seleção de texto). (2)–(4) dúvidas sobre barra lateral, "conta padrão" e onde os arquivos ficam: respondidas; proposta de simplificação (pasta em destaque no quadro, trocar a conta do quadro sem perder a conversa, barra só com contas) aguardando o Sidney.
- **17/10/2026 (T6.1–T6.5, Fatia 6, D14):** pedido do Sidney depois de testar: pasta em destaque, conta só como "quem paga", trocar a conta sem perder o contexto, login sem códigos e texto quebrando no terminal. **Prova antes de codar** (CLI real, pasta de teste): conversa criada na Pessoal com `--session-id`; na Principal sem o arquivo, "No conversation found"; depois de copiar o `.jsonl`, continuou e lembrou a palavra combinada. Ficaram duas conversas de teste em `projects/*scratchpad-prova-sessao` nas duas contas (apagar foi bloqueado pela permissão). Código: `quadros/sessoes.ts` (+5 testes), `quadros:trocarConta`, `comSessao`, `comandoAgente` com `--resume`/`--session-id`, login via `powershell -Command` com `exit $LASTEXITCODE`, `ContaDoQuadro`, `PastasRecentes`, `useLogin`/`PassosLogin`/`login.ts` (+6 testes), `@xterm/addon-unicode11` 0.9.0. 125 testes, lint zerado, smoke ok. **Provado na janela real (estado de teste, login trocado por um falso para não abrir navegador):** cabeçalhos "📁 lousa-ia | Pessoal ▾" e "📁 lousa-ia 2 | terminal | Principal ▾"; menu → confirmação → troca (o agente reiniciou na Principal com o mesmo id); "+ Novo quadro" com pastas e "×"; login abrindo → navegador (link lido, "Copiar link" ativo) → conferindo → conectada (✓ + e-mail) → fecha sozinha; e falhou (✗ + detalhes só com a saída do CLI) → "Tentar de novo" → conectada; emoji ❌ 🟡 ✅ alinhados. Bugs achados e corrigidos na prova: classe da fase "navegador" igual à do desenho; largura da janela perdida para o CSS antigo; eco do comando nos detalhes. **Não provado:** trocar a conta de um quadro com conversa já existente (a cópia + `--resume` está provada no CLI e em teste de unidade, não na tela); login real pelo navegador e o "colar código".
- **18/10/2026 (T6.6):** Sidney testou com o instalador novo seguindo `docs/aceite/roteiro.md` (itens 3, 4, 7, 12, 14, 15, 16 inclusive): tudo funcionou como esperado. Fatia 6 aceita; push dos commits para o GitHub.
- **18/10/2026 (T7.1–T7.5 + T1.8, Fatia 7, D15):** pedido do Sidney depois do aceite da Fatia 6: contas como ícones numa barra no alto e a lateral virando um explorador de pastas como o do VSCode, para ver os arquivos que os terminais mexem e abrir md/código ao lado. **Engenharia reversa antes de codar:** REA (pela linha de comando; o servidor MCP não conectou) sobre `resources/app/out` do VSCode 1.142 instalado (evidência `ev_40ea7451…`), mais leitura direta do pacote `workbench.desktop.main.js` e `watcherMain.js`: padrões de `files.exclude`, ordem `explorer.sortOrder = default`, `fetchChildren` sob demanda, `FILE_CHANGES_HANDLER_DELAY = 75`, `files.watcherExclude`, marca do chat que sobe (`bubble: true`) e o teste de binário dos 512 bytes. Código: `src/main/arquivos/` (regras, serviço, vigia, disco; +23 testes), canais `arquivos:*` e `perfis:criar` (+4 testes, `slug.ts` +3), tela `topo/`, `explorador/`, `leitor/` (+16 testes). 170 testes, lint zerado, smoke ok. **Provado na janela real (estado de teste só com terminais comuns e uma pasta de exemplo):** barra com engrenagem e ícones (bolinha verde = logada); balão com o cartão; painel com os cartões e "+ Nova conta" recusando "Principal" ("Nome reservado"); árvore com `.git` escondido e `node_modules` visível; md formatado; o main escreveu em `roteiro.md` e criou `src/novo.ts`: "Alterados agora" listou os dois (e ignorou `node_modules` e `.git`), a marca subiu pelas pastas, o leitor recarregou com "atualizado agora" e a pasta `src` mostrou o arquivo novo; `<script>` do md virou texto; link relativo abriu o outro md; código com número de linha; binário → "não é texto" só com "Mostrar na pasta"; o main recusou `../../x.md`, abrir binário fora e link `file:`. Bug achado e corrigido: caixas `[ ]` não viravam ☐ em lista com linha em branco. **Não provado:** arrastar o ícone da conta para a lousa, "Abrir fora" de verdade (abriria um programa no PC) e criar uma conta de verdade (criaria uma pasta em `C:\Users\sidne`).
- **18/10/2026 (T8.1–T8.7, Fatia 8, D16):** pergunta do Sidney ("o que adiantar para trabalhar uma semana sem ajustes?") e "pode seguir com o recomendado".
  - **Engenharia reversa antes de codar:** lido no `claude.exe` instalado, sem rodar. O Claude só avisa (campainha/OSC 9) em iTerm2, kitty e Ghostty, mas tem o Program Status Protocol (OSC 7501, 2.1.295): pergunta `ESC]7501;?` e, se o terminal responder, manda `state=working|blocked|done|idle|error`.
  - **Provado com programa simulado no ConPTY:** a saída passa; a resposta crua some; a mesma resposta em teclas `win32-input-mode` chega (modo VT e modo cru).
  - **Código:**
    - `terminais/status.ts` (+8 testes) e `avisos/` (+3);
    - tela `lousa/atencao.ts` (+4);
    - `componentes/links.ts` (+12), `teclas.ts` (+3), `fonte.ts` (+2);
    - `log.ts` (+3), `registros.ts` (+3), `janela/estadoJanela.ts` (+5).
    - 215 testes, lint zerado, smoke ok.
  - **Provado na janela real**, com estado de teste, terminais comuns e um "Claude falso" que fala o OSC 7501:
    - a resposta passou pelo ConPTY ("RESPOSTA OK"); selo "pedindo permissão" com a frase no balão; borda âmbar; "● 1 esperando você"; minimapa âmbar; o main registrou "aviso do agente: esperando";
    - o botão do alto enquadrou o quadro;
    - ponteiro de link em caminho e URL; clicar em `docs/notas.md` abriu o leitor, e um caminho absoluto longo, quebrado em duas linhas, abriu `src/app.ts`;
    - Ctrl+V com tecla de verdade colou uma vez só; duplo clique + Ctrl+C copiou; botão direito sem seleção colou;
    - duplo clique no cabeçalho: zoom 2 e volta exata;
    - Ctrl+roda: letra 13 → 15 sem zoom na lousa, mantida depois de reabrir;
    - `exit` → "Terminal encerrado (código 0) · Reabrir" → prompt novo;
    - o agente terminou: selo "terminou" com "Pronto: src/app.ts atualizado"; clicar no quadro apagou o brilho;
    - o app de verdade (sem smoke), aberto e fechado pelo X três vezes:
      - criou `logs\lousa-2026-10-18.log` com "abriu" e "fechou";
      - gravou `janela.json`;
      - reabriu maximizado no lugar salvo;
      - com o lugar salvo fora das telas, voltou ao padrão.
  - **Bug achado e corrigido:** link de caminho quebrado em duas linhas abria um caminho errado.
  - **Não provado:**
    - a notificação do Windows aparecendo de fato (no teste a janela ficou escondida e sem o id do instalador);
    - o clique nela;
    - um Claude real mandando OSC 7501 (o "falso" copia o formato lido no executável);
    - o botão direito com o mouse físico (provado com o evento da tela).
- **19/10/2026 (T8.9, D17):** Sidney, usando o instalador da Fatia 8: digitação lenta e o erro "EPERM … stat … MSTeams … model.cat" no main. A pasta `C:\Users\sidne` estava salva, e o registro do dia tinha o erro inteiro.
  - **Medido:** vigia recursivo em `C:\Users\sidne` = 41 avisos/s parado e 1.055 arquivos diferentes em 2 min (AppData). O histórico de 1 MB por terminal custava 0,9 ms por pedaço de saída (0,2 ms com 200 KB).
  - **Código:** `terminais/historico.ts` (+5 testes); `arquivos/vigia.ts` por pasta e sem subpastas (8 testes), `disco.ts` sem `stat` no vigia; `arquivos:vigiar { pastas }`; tela `explorador/vigiar.ts` (+2) junta os pedidos da árvore e do leitor; saem `alterados.ts`, `useAlterados.ts` e "Alterados agora". 221 testes, lint zerado.
  - **Provado na janela** (estado de teste com `C:\Users\sidne` aberta, 1,6 MB num terminal pingando saída e 10 mil arquivos acumulados como 30 min):
    - versão anterior: eco mediana 86 ms (pior 245), 229 travadas somando 20,9 s em ~35 s;
    - versão nova: eco 20 ms (pior 33), nenhuma travada;
    - sem o acúmulo: mediana 21 → 21 ms e pior 116 → 33 ms;
    - a árvore mostrou arquivo criado e apagado pelo terminal (raiz e subpasta), e o leitor recarregou com a pasta fechada na árvore.
  - **Não provado:** o erro EPERM não foi reproduzido (depende do Teams escrever naquele arquivo); ele some por construção, porque o vigia não faz mais `stat`.
- **19/10/2026 (Etapa 0 e Fatia 10, D18):** Sidney pediu as etapas 0 e 2 do plano de retomada. Push dos 16 commits das Fatias 7 e 8; instalador `release/Lousa.ia Setup 0.0.1.exe` gerado para o aceite T7.6 + T8.8. Fatia 10 (cópia separada por agente, item D1) planejada em `docs/plano/fatia-10-copias-separadas.md`, depois de provar o `git worktree` numa pasta temporária.
  - **T10.1 + T10.2:** `Repo.copia`, `FimDaCopia`; `copias/regras.ts` (+6 testes), `copias/git.ts`, `copias/servico.ts` (+12 testes com git falso) e `copias/real.test.ts` (5 casos com git de verdade: criar, arquivo novo mantém, só ignorado apaga pasta e branch, commit guarda a branch, subpasta recusada); `ambienteBase` em `perfis/ambiente.ts`.
  - **Armadilha de novo:** heredoc do Bash transformou barra invertida dupla em simples em `regras.ts`; arquivos com barra invertida só pelo Write/Edit.
