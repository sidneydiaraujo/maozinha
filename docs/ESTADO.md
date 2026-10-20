# Estado da construção

**Próxima tarefa: T21.3 (versão 0.2.0 e instalador)**, pelo `docs/plano/fatia-21-identidade-visual.md`. O Sidney pediu as Fatias 20 e 21 seguidas e testa tudo instalando de novo no fim. As Fatias 15, 16, 18, 19, 20 e 21 esperam o aceite (itens 42 a 49).
Com o Sidney, em paralelo: aceite das Fatias 7, 8 e 10 a 14 (T7.6, T8.8, T10.5, T11.3, T12.3, T13.2, T14.2) — ele instala `release/Lousa.ia Setup 0.1.0.exe` e testa os itens 17 a 41 (com o 20b) do `docs/aceite/roteiro.md`.
A Fatia 9 (Codex/ChatGPT, T1.4b) espera o Sidney começar a usar o ChatGPT.
Fatias 15 a 21 (terminal com cara de VSCode, dados do agente, identidade visual): começadas em 19/10 a pedido do Sidney, antes do aceite acima, na ordem do `docs/plano/README.md`, cada uma numa sessão nova. D23 e D24 aprovadas, e também as provas com Claude de verdade (T16.0, T17.0).

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
| T10.3 | Quadros e canais | ✅ 19/10/2026 |
| T10.4 | Tela: opção na janelinha, selo da branch, aviso ao fechar | ✅ 19/10/2026 |
| T10.5 | Aceite | ⬜ |
| T11.1 | Juntar: resumo e merge no main | ✅ 19/10/2026 |
| T11.2 | Juntar: botão e janela | ✅ 19/10/2026 |
| T11.3 | Aceite | ⬜ |
| T12.1 | Ctrl+K: quadro, pasta e arquivo | ✅ 19/10/2026 |
| T12.2 | Ctrl+F no terminal | ✅ 19/10/2026 |
| T12.3 | Aceite | ⬜ |
| T13.1 | Barra "Para N quadros" | ✅ 19/10/2026 |
| T13.2 | Aceite | ⬜ |
| T14.1 | Ícone próprio e versão 0.1.0 | ✅ 19/10/2026 |
| T14.2 | Aceite | ⬜ |
| T15.1 | Tema e fonte do terminal | ✅ |
| T15.2 | Desenhista WebGL | ✅ |
| T15.3 | Aceite | ⬜ (itens 42 e 43 escritos no roteiro; espera o Sidney) |
| T16.0 | Prova: Alt+V cola print no Claude | ✅ |
| T16.1 | Ctrl+V com imagem e botão 📎 | ✅ |
| T16.2 | Arrastar imagem para o quadro | ✅ |
| T16.3 | Aceite | ⬜ (itens 44 e 45 escritos no roteiro; espera o Sidney) |
| T17.0 | Prova: linha de status com Claude de verdade | ✅ |
| T17.1 | Leitor puro do JSON da linha de status | ✅ |
| T17.2 | Linha de status em cada agente + canal `agentes:painel` | ✅ |
| T18.1 | Anel de contexto e compactar | ✅ 20/10/2026 |
| T18.2 | Configurar o anel na engrenagem | ✅ 20/10/2026 |
| T18.3 | Aceite | ⬜ (item 46 escrito no roteiro; espera o Sidney) |
| T19.1 | Modelo e esforço no quadro (main) | ✅ 20/10/2026 |
| T19.2 | Seletores no cabeçalho | ✅ 20/10/2026 |
| T19.3 | Aceite | ⬜ (item 47 escrito no roteiro; espera o Sidney) |
| T20.1 | Uso por conta (main) | ✅ 20/10/2026 |
| T20.2 | Barras de uso no alto | ✅ 20/10/2026 |
| T20.3 | Aceite | ⬜ (item 48 escrito no roteiro; espera o Sidney) |
| T21.0 | Protótipo visual para aprovar | ✅ (A · Ardósia e giz, D36) |
| T21.1 | Cores como variáveis | ✅ 20/10/2026 |
| T21.2 | Quadro, barra de cima e brilho de trabalho | ✅ 20/10/2026 |
| T21.3 | Aceite e instalador 0.2.0 | ⬜ |
| T22.1 | Ver a diferença de um arquivo antes de juntar (`copias:diff`) | ✅ |
| T23.1 | Juntar ignora arquivo fora do git na original e explica a recusa | ✅ |
| T23.2 | "Pedir ao agente para resolver" no conflito | ✅ (aceite: item 61) |
| T24.1 | Quadro novo em espaço livre | ✅ |
| T24.2 | Enter do Ctrl+F sobe | ✅ |
| T25.1 | Mensagens prontas (main) | ✅ |
| T25.2 | Mensagens prontas na barra e no Ctrl+K | ✅ |
| T26.1 | Nota na lousa (main) | ✅ |
| T26.2 | Nota na lousa (tela) | ✅ |
| T27.1 | Vistas salvas (main) | ✅ |
| T27.2 | Vistas salvas no Ctrl+K | ✅ |

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
  - **T10.3:** `ServicoQuadros.criarEmCopia` (a cópia vira pasta da lista, nome `app ⑂ claude-1`; cópia de cópia usa a original) e `remover` assíncrono que limpa a cópia ao fechar o último quadro dela (mantida = continua na lista); `ServicoRepos.remover` limpa a cópia tirada da lista. Canais: `quadros:criar` com `separado` devolve `{ quadro, repo }`; `quadros:remover` e `repos:remover` devolvem `FimDaCopia`. +6 testes (250), lint zerado, smoke ok.
  - **T10.4:** caixa "Cópia separada (branch própria)" no "Novo quadro", marcada sozinha quando a pasta já tem quadro (`lousa/copia.ts`, +4 testes; `useEscolhas` tirado do componente para caber na régua); cabeçalho mostra `app ⑂ apelido` e a branch ao passar o mouse; aviso no alto que some em 10 s. 254 testes, lint zerado, smoke ok.
  - **Provado na janela real** (dados de teste com um repositório git de exemplo e um terminal aberto nele, conduzido por script): caixa marcada com a frase; "Abrir terminal" criou `app.copias\terminal-2` na branch `lousa/terminal-2`; um terminal escreveu `novo.txt` noutra cópia; fechar a cópia limpa → "Cópia separada apagada", pasta e branch sumiram (o terminal recém-fechado não prendeu a pasta); fechar a cópia com `novo.txt` → "Cópia mantida em …", pasta e arquivo ficaram, e ela segue na lista e na lateral.
  - **Não provado:** agente Claude de verdade numa cópia (a primeira abertura numa pasta nova pede para confiar na pasta) e o caminho "commit na cópia → branch guardada" pela tela (provado no teste com git real).
- **19/10/2026 (Fatia 11, D19):** Sidney pediu mais 4 etapas antes de instalar ("faça as 4"): Fatias 11 (juntar), 12 (Ctrl+K e busca), 13 (mensagem para vários) e 14 (ícone e versão).
  - **T11.1 + T11.2:** `copias/juntar.ts` (`resumirCopia`, `juntarCopia`, `acharPrincipal`, `lerNumstat`), canais `copias:resumo` e `copias:juntar`, `JanelaJuntar.tsx`, botão "Juntar" no quadro de cópia, `frasesDoResumo` (+2 testes). `juntar.test.ts` com git real (+5: resumo, junta e depois apaga, conflito desfaz, pendência recusa). 261 testes, lint zerado.
  - **Provado na janela real** (repositório de exemplo, terminais comuns fazendo os commits como um agente faria): "1 commit da branch lousa/terminal-2, 1 arquivo (+1 −0), para juntar em main" com `novo.txt +1 −0`; "Juntar em main" → `novo.txt` na original; "Fechar o quadro e apagar a cópia" → pasta e branch sumiram; conflito em `leia.md` → mensagem, original intacta e `git status` limpo. Texto do aviso de cópia apagada trocado ("todo o trabalho dela já estava na pasta original"), porque depois de juntar "não tinha trabalho novo" enganava.
- **19/10/2026 (Fatia 12, D20):** Ctrl+K e Ctrl+F.
  - **Código:** `shared/pontuar.ts` (+5 testes), `arquivos/busca.ts` (+5) e canal `arquivos:buscar`, `paleta/` (+3), `componentes/procurar.ts` (+3), `BuscaTerminal.tsx`, atalho `buscar` em `teclas.ts` (+2 asserções). 277 testes, lint zerado, smoke ok.
  - **Provado na janela real** (duas pastas git de exemplo, um terminal em cada, um deles fora da tela; teclas de verdade): Ctrl+K com o terminal em foco abre a paleta; "api" lista só o quadro e a pasta de api e Enter enquadra o quadro; "fatia" acha `docs/plano/fatia-12.md` (a cópia dentro de `node_modules` fica de fora) e abre no leitor; "Novo quadro em api" abre a janelinha com api marcada; Ctrl+F no terminal: "linha 1" → "11 de 11", Enter → "1 de 11", Esc fecha.
  - **Bugs achados na prova e corrigidos:** (1) o Enter da paleta chegava à janelinha recém-aberta, que criava um agente sozinha; (2) letras soltas demais ("api" achava "app · Terminal 1"); (3) o teto da busca só valia entre pastas (uma pasta enorme era lida inteira); (4) item escolhido no `mousedown` (agora no clique).
- **19/10/2026 (Fatia 13, D21):** `lousa/envio.ts` (+4 testes), `BarraEnvio.tsx`, dica "Ctrl+clique seleciona vários" no cabeçalho. 281 testes, lint zerado.
  - **Provado na janela real** (três terminais comuns; Ctrl de verdade segurado e cliques de mouse): um selecionado não mostra a barra; Ctrl+clique no segundo mostra "Para 2 quadros"; `'enviado-' + (2 * 21)` + Enter → "Enviado para 2 quadros"; os dois selecionados escreveram `enviado-42` e o terceiro nada.
  - **Não provado:** um Claude de verdade recebendo (a pausa de 150 ms antes do Enter vem de como o Claude Code trata colagem; confirmar no aceite, item 40).
- **19/10/2026 (Fatia 14, D22):** `scripts/gerar-icone.mjs` → `build/icon.png` e `build/icon.ico`; `electron-builder.yml` com o ícone e `signAndEditExecutable: true`; versão 0.1.0. `npm run dist` gerou `release/Lousa.ia Setup 0.1.0.exe` (hash em `release/SHA256.txt`). **Conferido:** ícone extraído do `.exe` e do instalador é o novo; versão do arquivo 0.1.0; `NotSigned` nos dois (nada foi assinado); `win-unpacked\Lousa.ia.exe --smoke` → código 0. **Não provado:** instalar de verdade e ver o atalho do Menu Iniciar (fica no aceite, item 41).
- **19/10/2026 (provas/, pedido do Sidney: guardar o cenário de testes):** as provas na janela real saem da pasta temporária da sessão e viram `provas/`.
  - **O que tem:** cenários `fatia8`, `colar-e-reabrir`, `vivo` e `desempenho` (com a opção `acumular`); o executor `rodar.mjs` (estado de teste e cópia da `pasta-demo` novos em `provas/saida/`, fora do git); o "Claude falso"; o abrir-e-fechar do app; os medidores do D17; e a prova do ConPTY do D16.
  - **Como roda:** o smoke aceita `--cenario` e `--saida` (`src/main/cenario.ts`, +4 testes, ignorados no instalador). Nada mais reescreve `src/main/smoke.ts` para injetar roteiro.
  - **Rodado agora, com a versão atual:**
    - `vivo`: tudo verdadeiro;
    - `colar-e-reabrir`: tudo verdadeiro;
    - `fatia8`: sem erros, depois de corrigir três falhas do próprio roteiro (contagem com quebra de linha, espera do Reabrir e botão direito pelo evento da tela);
    - `desempenho acumular`: eco com mediana de 23 ms e nenhuma travada;
    - ConPTY: `win32` chega e `bruto`/`st` somem.
  - **Não rodado de novo:** `apoio/abrir-e-fechar.mjs` (abre uma janela na tela; provado em 18/10, aqui só ganhou caminhos sem pasta temporária).
- **19/10/2026 (provas das Fatias 10 a 13 guardadas):** as provas que estavam na pasta temporária da sessão viram cenários de `provas/`:
  - `copias`, `juntar`, `paleta` e `envio`;
  - novo estado `git`, com os repositórios `app` e `api` criados limpos a cada rodada;
  - cada cenário devolve `"ok"`.
  - **Rodados agora, os quatro com `ok: true`.**
  - **O que as provas mostraram para a fila de ideias:**
    - o Juntar recusa quando a pasta original tem até um arquivo novo que não está no git;
    - o Ctrl+F começa no achado mais recente, e o Enter dá a volta para o mais antigo;
    - o quadro novo nasce por cima de outro.
- **19/10/2026 (plano das Fatias 15 a 21, D23 e D24 propostas):** pedido do Sidney: plano de ação da evolução do terminal avaliada hoje, em fatias de no máximo 35% de contexto. Lidas antes as Fatias 10 a 14 do outro terminal. Sete fatias, cada uma com a lista do que ler; as provas com Claude de verdade (T16.0, T17.0) pedem o ok do Sidney. Achado de plano: com o desenhista WebGL o texto some do HTML, que é por onde os cenários de `provas/` leem a tela; por isso as provas ficam no desenho normal (T15.2).
- **19/10/2026 (T15.1, Fatia 15 começada antes do aceite a pedido do Sidney; D23 e D24 aprovadas):**
  - `componentes/tema.ts`:
    - paletas `abyss` (as 16 cores ANSI do `abyss-color-theme.json` do VSCode, fundo `#000c18`) e `lousa` (o mesmo desenho, com fundo ardósia `#131c27` e texto cor de giz);
    - `aparenciaDe`: um valor ruim volta ao padrão só no próprio campo;
    - `aoMudarAparencia`: os terminais abertos mudam na hora, sem reabrir.
  - `fonte.ts`: `fontePadrao()` vem da Aparência. O padrão passou de 13 para 14, e o Ctrl+roda continua por quadro.
  - Seção "Aparência do terminal" no painel da engrenagem. O CSS ficou em `estilos/aparencia.css`, à parte, para o `topo.css` não crescer.
  - O fundo do quadro e do terminal segue a paleta pela variável `--terminal-fundo`.
  - 10 testes novos; `npm run check` verde (295).
  - Cenário novo `aparencia`: `ok: true`, fotos a-lousa e b-abyss. A primeira rodada pegou cliques seguidos que se perdiam (cada clique partia do valor de antes); corrigido.
  - `fatia8` sem erros com a letra nova (14px → 16px).
    - O `colarCtrlV` já oscilava entre 0 e 1 antes desta mudança, por causa da espera de 0,9 s.
    - O Ctrl+V cola: a foto e-colado mostra `colado-ok`.
- **19/10/2026 (T15.2 + itens 42 e 43 do roteiro):**
  - `@xterm/addon-webgl` 0.19.0, que saiu junto com o xterm 6.0.0. Fica registrado na D23.
  - `componentes/desenhista.ts`:
    - liga o WebGL depois do `term.open`;
    - no máximo 14 ao mesmo tempo;
    - `onContextLoss` devolve o terminal ao desenho normal.
  - Cada `.terminal` diz `data-desenho="webgl"|"dom"`.
  - O main abre a tela com `?desenho=dom` na rodada de prova (`window.ts`, `cenario.ts` `desenhoDasOpcoes`), salvo a opção `webgl`.
  - `npm run check` verde (297).
  - `npm run smoke`: a primeira rodada FALHOU na tela, com "Unable to create cache"; a segunda passou.
    - Causa provável: o smoke usa a mesma pasta de dados da Lousa instalada (`%APPDATA%\lousa-ia`), que estava aberta.
    - Corrigido no commit seguinte.
  - Provas, todas com `ok` ou sem erros:
    - `aparencia webgl`: os dois terminais em WebGL, sem texto no HTML. Derrubado o contexto do t2 de propósito, ele voltou ao desenho normal com o prompt, e o t1 seguiu em WebGL.
    - Achado ao escrever essa prova: o terminal em WebGL tem 2 canvas, e só um tem o contexto WebGL.
    - `aparencia` normal, `fatia8` (desta vez `colarCtrlV: 1`) e `vivo` passaram.
    - `desempenho acumular`: eco com mediana de 21 ms, p90 de 28 ms, pior de 143 ms e nenhuma travada. Mede o desenho normal, porque a prova lê o texto pelo HTML.
  - **Não provado na janela:** o limite de 14 (abrir 15 quadros). Fica para o item 43 do aceite.
- **19/10/2026 (correção do smoke, fora do plano):** o `npm run smoke` usava a mesma pasta de dados da Lousa instalada (`%APPDATA%\lousa-ia`).
  - Ele abria escondido o estado de verdade do Sidney: quadros e terminais, por alguns segundos.
  - Com o app aberto, brigava pela pasta ("Unable to create cache"), e a tela falhava às vezes.
  - Agora, sem `--user-data-dir`, usa `%TEMP%\lousa-ia-smoke` (`pastaDoSmoke` em `cenario.ts`, + 2 testes).
  - Conferido: o `estado.json` real ficou com a mesma data depois do smoke.
  - `npm run check` (299) e `npm run smoke` verdes.
- **19/10/2026 (T16.0, com Claude de verdade, ok do Sidney):** `provas/apoio/print-claude.mjs`, `claude.exe` 2.1.304, conta Pessoal, pasta de teste vazia, nenhuma mensagem mandada.
  - **Resultado:**
    - `ESC v` (o Alt+V do xterm) com print na área de transferência: anexa (`[Image #1]`);
    - Ctrl+V cru (`\x16`): nada;
    - caminho do `.png` colado (bracketed paste): anexa (`[Image #2]`, depois de "Pasting…");
    - o mesmo caminho digitado letra a letra: fica como texto.
    - Por isso a T16.2 cola o caminho com `term.paste`; o plano foi ajustado.
  - **Achados ao escrever a prova:**
    - pasta nova abre a pergunta de confiança com a seta em "No, exit", e Enter fecha o Claude;
    - o ConPTY desenha `[Image#2]` sem o espaço;
    - outro programa segurou a área de transferência por alguns minutos (nenhum processo do teste sobrou), e o script tenta 10 vezes.
  - **Efeito fora do repo:** o próprio Claude anotou as pastas de teste como confiáveis no `.claude.json` da conta Pessoal. A Lousa não escreveu nada lá.
- **19/10/2026 (T16.1 + T16.2):**
  - Canal `app:temImagem`: o main só diz se há `image/*` na área de transferência; a imagem nunca vai para a tela.
  - `teclas.ts`, `colagem`:
    - Ctrl+V com texto cola como antes;
    - só com print, manda `ESC v`;
    - vazio, segue o `^V` cru.
  - Botão 📎 (`lousa/BotaoPrint.tsx`):
    - só em agente com o terminal aberto; o `CorpoQuadro` avisa o cabeçalho quando o terminal encerra;
    - sem print copiado, mostra "Copie um print primeiro (Win+Shift+S)" por 3 s.
  - `componentes/soltar.ts`:
    - arrastar arquivos cola os caminhos entre aspas com `term.paste`, pelo `webUtils.getPathForFile` do preload;
    - borda tracejada enquanto arrasta por cima.
  - **Fora do plano, achado ao ler o código:** um arquivo solto fora de um terminal abriria NO LUGAR da Lousa, porque o `will-navigate` aceita qualquer `file://`. Agora `impedirAbrirArquivoSolto` barra isso no começo da tela.
  - `npm run check` verde (306) e `npm run smoke` verde.
  - Provas:
    - cenário novo `print`, com `apoio/eco-print.mjs` no lugar do Claude e o pedido novo `prova.imagemNaArea()`: `ok: true` de primeira;
    - `colar-e-reabrir` passou;
    - `fatia8` sem erros.
  - O `colarCtrlV` e o `colarDireito` do `fatia8` oscilam entre 0 e 1 desde antes de hoje: já davam 0 e 0 na rodada das 00:01 UTC. O colado chega depois da espera de 0,9 s da prova.
  - **Não provado na janela:**
    - o 📎 num agente de verdade;
    - o arrastar com caminho real, porque um arquivo criado na tela não tem caminho no disco.
    - Os dois ficam para os itens 44 e 45 do aceite.
- **19/10/2026 (T17.0, com Claude de verdade, ok do Sidney):** `provas/apoio/status-claude.mjs`, `claude.exe` 2.1.304, conta Pessoal, pasta de teste, nenhuma mensagem mandada.
  - **Medida** (15 vezes, JSON de exemplo, sem Claude): `findstr` com mediana de 155 ms, Electron como Node 338 ms, PowerShell 530 ms. Os três gravaram certo.
  - **Com o Claude:**
    - as duas primeiras rodadas não gravaram nada: no Windows o Claude roda a linha de status pelo Git Bash, e o bash troca o `/d /c` do `cmd` por caminhos. A tela mostrou o prompt de um `cmd` interativo;
    - com `findstr "^" > "C:/…"`, o JSON chegou 5 s depois de abrir, sem mensagem, com modelo, esforço, contexto de 1 milhão e os limites de 5 h (24%) e 7 dias (31%), com a hora de zerar;
    - `used_percentage` do contexto vem `null` até a primeira mensagem;
    - parado, rodou 1 vez em 25 s.
  - **Precedência:** a linha concorrente, posta nas configurações do projeto (a pasta de teste), não rodou: o `--settings` vence. Nenhuma conta do PC tem linha própria, e a pasta da conta não se toca.
  - **Pasta da conta:** o `settings.json` não mudou. Mudaram `.claude.json`, `sessions`, `state`, `backups`, `plugins` e, na 1ª rodada, `.credentials.json`; são gravações do próprio Claude ao abrir.
  - Regras novas na T17.2 do plano e na D24.
- **19/10/2026 (T17.1):** `src/main/agentes/painel.ts` e os tipos `PainelAgente`, `Limite` e `Esforco` em `shared/model.ts`.
  - `lerPainel`, com zod 4: cada campo estranho vira `null` sozinho (`.catch(null)`), e campo novo é ignorado.
  - Contexto `null` até a 1ª mensagem.
  - `resets_at` vem em segundos e vira ms; se já vier em ms, fica como está.
  - Percentuais presos em 0-100. Acima de 64 KB → `null`.
  - `textoDoArquivo` aceita UTF-8 e UTF-16 com BOM.
  - 9 testes, um deles confere que nenhum caminho, sessão ou custo passa para o painel.
  - `npm run check` verde (315), sem aviso.
- **19/10/2026 (T17.2):**
  - **`agentes/ponte.ts` (`PonteAgentes`):**
    - `preparar` grava `<userData>\agentes\<id>.settings.json` com a linha de status da T17.0;
    - um vigia só da pasta lê o `<id>.json` 250 ms depois do último aviso e manda `agentes:painel`;
    - guarda o último painel de cada quadro (`agentes:ultimoPainel`, para a tela remontada);
    - `esquecer` apaga os dois arquivos quando o main fecha o terminal do quadro (removido, repo fechado, troca de conta);
    - ao abrir o app, apaga os arquivos de quadros que não existem mais.
  - `agentes/disco.ts` é o disco de verdade, separado para a ponte ser testada com disco falso.
  - `comandoAgente` ganhou `--settings '<arquivo>'` em texto literal do PowerShell; só o agente Claude pede.
  - Caminho com `$`, crase, `%`, `!` ou aspas: o agente abre sem painel, em vez de arriscar o comando.
  - `registrarHandlersTerminais` passou a receber os serviços num objeto, porque o 5º serviço passaria do teto de 4 parâmetros.
  - 11 testes novos; `npm run check` verde (326) e `npm run smoke` verde.
  - **Desvio do plano:**
    - a prova não usou o Claude falso: o PowerShell do quadro põe o `claude.exe` de verdade na frente do PATH, e trocá-lo exigiria um desvio só para teste no app;
    - em vez disso, o cenário `painel` usa o estado novo `agente` (conta Pessoal, pasta de teste, ok do Sidney, sem mensagem).
  - **Resultado do `painel`:** `ok: true`.
    - O agente abriu com `--settings`, e a confiança na pasta foi aceita.
    - O painel chegou com "Opus 5.5 (1M context)", esforço medium, 5 h a 34%, 7 dias a 32% e contexto `null`.
    - O `ultimoPainel` bate com o evento, e nenhum `claude.exe` ficou aberto.
    - A foto mostra o 📎 no cabeçalho do agente vivo.
  - `colar-e-reabrir` passou com a ponte ligada.
  - Para as Fatias 18 a 20, os cenários mandam o painel com `prova.ipc('agentes:painel', …)`, sem Claude.
- **20/10/2026 (Fatias 22 e 23, D30 e D31, branch `evolucoes-22-27`):** plano em `docs/plano/fatia-22-a-27-evolucoes.md`, feito em paralelo às Fatias 18 a 21 da outra sessão (divisão combinada: decisões D30+, roteiro 60+, só acréscimos nos arquivos compartilhados).
  - **Código:** `diffDoArquivo`, `lerDiff`, `explicarRecusa` (+7 testes, git de verdade); `VistaDiff.tsx`; `resolver.ts` (+2 testes); `escrever.ts`, que agora também é usado pelo `BarraEnvio`.
  - **Provado na janela real** (cenário `juntar`, `ok: true`): com `rascunho.txt` solto na original, o Juntar entra; clicar em `novo.txt` mostra `+oi`; "← Arquivos" volta; o conflito continua deixando a original limpa.
  - **Não provado:** o botão "Pedir ao agente para resolver" com um Claude de verdade (item 61).
- **20/10/2026 (Fatia 24, D32):** `quadros/lugar.ts` (`lugarLivre`, +4 testes), ligado no `ServicoQuadros.criar`; Enter do Ctrl+F sobe. **Provado na janela real:** cenário `copias` com dois quadros novos abertos pelo centro da vista, nenhum por cima de outro (`ok: true`); cenário `paleta` com "11 de 11" e, depois de Enter, "10 de 11" (`ok: true`).
- **20/10/2026 (Fatia 25, D33):** `mensagens/servico.ts` (+5 testes) e `handlers/mensagens.ts`, ligados no `index.ts`; `alvos.ts` (+3 testes), `useMensagens`, `MensagensProntas` (★ na barra), `mandar.ts`; item "Mandar: …" no Ctrl+K.
  - **Provado na janela real** (cenário `prontas`, `ok: true`): clicar no terminal q3 e Ctrl+K "Mandar: Rode os testes…" escreve só no q3 e mostra "Enviado para 1 quadro"; com dois selecionados, o ★ lista as três padrão, guarda, preenche a barra e apaga. O `envio` continua `ok`.
  - **Achado da prova:** na janela escondida, `.focus()` sozinho não dispara `focusin`; o cenário usa um clique de verdade.
- **20/10/2026 (Fatia 26, D34):**
  - **Main:** `notas/servico.ts` (+4 testes), `handlers/notas.ts`; `notas` no schema do armazém, no `lousa:carregar` e no `aplicarLayout` (+1 teste).
  - **Tela:** `notas.ts` (+3 testes), `NotaNode.tsx`, `useNotas.ts`, "+ Nota" e Ctrl+K "Nova nota"; testes da paleta para mensagens e ações (+3).
  - **Provado na janela real** (cenário `notas`, `ok: true`):
    - a nota nasce escrevendo, fora de cima dos quadros;
    - o texto fica salvo sem clicar em "Pronto";
    - "Pronto" mostra o título e o ☐;
    - clicar no terminal q3 e "➤ Mandar" escreve só nele;
    - o Ctrl+K cria a segunda nota;
    - apagar a nota vazia não pede confirmação.
  - **Defeito que a prova pegou:** o salvamento 500 ms depois da última tecla não acontecia. O relógio reiniciava a cada redesenho do nó. Corrigido com uma referência.
- **20/10/2026 (Fatia 27, D35):** `vistas/servico.ts` (+4 testes), `handlers/vistas.ts`; `vistas` no schema e no `lousa:carregar`; `vistas.ts` (+1 teste), `useVistasSalvas.ts`, `itensDeVista` (+3 testes).
  - **Provado na janela real** (cenário `vistas`, `ok: true`):
    - Ctrl+K "foco" guarda;
    - arrastar o q1 com o mouse de verdade (200 px);
    - "Vista: foco" devolve o q1 ao mesmo pixel e à mesma câmera, e o lugar fica salvo no main;
    - "apagar foco" apaga.
  - **Rodada final das Fatias 22 a 27:**
    - smoke ok;
    - `copias`, `juntar`, `paleta`, `envio`, `prontas`, `notas` e `vistas` com `ok: true`;
    - `vivo` com todos os valores verdadeiros.
    - Não rodados de novo: `fatia8` e `colar-e-reabrir` (usam a área de transferência do PC) e `desempenho`.
  - **Falta:** o aceite pelo Sidney (itens 60 a 65 do roteiro), num instalador novo.
- **20/10/2026 (T21.0):** protótipo com duas paletas lado a lado, publicado como artefato privado (https://claude.ai/artifact/SzLNAaqnGKnwKRv1o6uYAg). A · Ardósia e giz: fundo #0e151d, quadro #131c27, giz #dcd8cc, feixe #9cc4f0, âmbar #f0b44c. B · Abyss profundo: fundo #000c18, texto #cccccc, feixe ciano #78ffff, âmbar #ffe580. Cada tela tem três quadros (trabalhando, com o brilho girando na borda em CSS @property + conic-gradient; esperando você, âmbar parado; terminou), anel, modelo e esforço no cabeçalho, barras de uso 5 h e 7 dias sob as contas, a pílula "● 1 esperando você", uma nota e o painel de Aparência aberto. Nada foi codado no app. O Sidney aprovou a A (D36, commit 5242686).
- **20/10/2026 (T18.1 + T18.2, D24):** anel de contexto no cabeçalho do agente e a seção "Contexto da conversa" na engrenagem.
  - **Código:**
    - `lousa/contexto.ts` (`PrefContexto`, `vistaDoContexto`, `tokensPorExtenso`, ler e guardar no `localStorage`; +12 testes);
    - `shared/compactar.ts` (`podeCompactar`, usado pela tela e pelo main; +1 teste);
    - `main/agentes/compactar.ts` e o canal `agentes:compactar`: o main escreve `/compact`, pausa 150 ms e Enter, só com o agente `parado` ou `terminou` (+4 testes);
    - `lousa/usePainel.ts` (guarda única dos painéis, como o `useAtencao`), `AnelContexto.tsx` (SVG, sem animação: o número é inteiro e só muda a cada ponto, D17), `topo/ContextoConfig.tsx` (o `Passo` da Aparência foi exportado e reaproveitado);
    - CSS em `estilos/contexto.css`, à parte, para o `quadro.css` não crescer.
  - **Desvio do plano:** `vistaDoContexto` recebe também o tamanho do contexto, para o balão dizer "(124 mil de 200 mil)".
  - `npm run check` verde (383) sem aviso e `npm run smoke` verde.
  - **Provado na janela real** (cenário novo `anel`, com o ok do Sidney, `ok: true`): o `claude.exe` abriu, o cenário respondeu "No, exit" na confiança da pasta e o Claude fechou sem mensagem; o resto veio pelo `prova.ipc`.
    - sem painel, e com 30% no padrão, o anel não aparece;
    - "Sempre" na engrenagem vale na hora; 30 normal, 75 âmbar, 95 vermelho; balão "30% do contexto usado (60 mil de 200 mil)";
    - trabalhando: cinza, o clique não abre nada e o main recusou ("Espere o agente parar");
    - parado: "Compactar a conversa agora?" e o Cancelar fecha.
  - **Defeito que a prova pegou:** sem estado do agente ainda, o anel saía cinza e perdia a cor. Agora fica cinza só trabalhando ou esperando você; sem estado, o clique continua sem efeito.
  - **Não provado:** o `/compact` chegando a um Claude de verdade e o número caindo depois. Fica para o aceite (item 46).
- **20/10/2026 (correção D37, print do Sidney):** a seleção com o mouse caía em outra linha sempre que a lousa estava fora de 100%. O Sidney viu isso no 0.0.1, e o código atual tinha o mesmo defeito.
  - **Código:** `componentes/escala.ts` (+6 testes), ligado no `Terminal.tsx`.
  - **Provado na janela real** (cenário novo `selecao`): arrastar o mouse de verdade sobre "linha-N fim" com a lousa a 80% e a 176%.
    - Antes: faixa 45 e 100 px fora do texto.
    - Depois: 1 px de desvio e largura igual à do texto, `ok: true`.
  - **Sem regressão:** `fatia8` (links, duplo clique, botão direito), `colar-e-reabrir`, `paleta`, `notas` e `vistas` continuam certos; o `colarCtrlV: 0` do `fatia8` é a oscilação já conhecida.
  - **Revisão da outra sessão antes do ff:** a primeira versão também corrigia o botão do meio, e a lousa andava mais que o mouse no arraste (210 px para 200 a 80%). Agora o botão do meio fica de fora. O `selecao` arrasta 200 px com o meio a 176% e a 59%, e a lousa anda 200 nos dois casos.
  - **Achado a investigar à parte:** no cenário, depois de um arraste com o botão do meio, o ⤢ do quadro não amplia. Acontece com ou sem esta correção. Ainda não se sabe se é do mouse simulado ou do app. Por isso, o arraste com o meio fica no fim do `selecao`.
- **20/10/2026 (correção D38):** o ⤢ falhava nas provas porque o `fitView` do React Flow espera um quadro de animação, e com isso o ⤢ seguinte "voltava". Agora o ⤢ calcula e move na hora; com "reduzir movimento", não anima. Mexer na vista desfaz o "ampliado". Resolve o achado deixado na entrada da D37.
  - **Provado na janela real** (cenário novo `ampliar`, `ok: true`): amplia, volta à vista exata, amplia de novo, amplia depois de arrastar com o meio, e passa para o outro quadro.
  - **Sem regressão:** `fatia8` (ampliar e voltar exato), `selecao`, `vistas`, `paleta`, `notas`, `copias` e smoke.
- **20/10/2026 (T19.1 + T19.2, D25):** modelo e esforço por quadro. O Sidney pediu o Fable na lista "e todos os modelos que forem sendo atualizados": a lista usa os apelidos do CLI, que sempre apontam para a versão mais nova (D25).
  - **Conferido antes de codar:** `claude --help` 2.1.304 tem `--model <alias>` (cita `fable`, `opus`, `sonnet`) e `--effort` (low, medium, high, xhigh, max).
  - **Código:**
    - `shared/model.ts`: `MODELOS`, `ESFORCOS`, `Modelo`, `AjusteAgente`, `QuandoAjusta`; `Quadro.modelo?` e `Quadro.esforco?`;
    - `armazem.ts`: os dois no schema do quadro, com valor desconhecido virando "sem escolha" (+1 teste);
    - `comandoAgente` recebe os extras num objeto (`settings`, `modelo`, `esforco`) e acrescenta `--model`/`--effort` (+4 testes no `alvo.test.ts`);
    - `ServicoQuadros.ajustar` guarda e recusa terminal comum, Codex e valor fora da lista (+3 testes);
    - `agentes/ajustes.ts` (`comandosDoAjuste`, `FilaAjustes`; +7 testes), ligado no `aoEstado` e no fechar do quadro (`contexto.ts`); canal `agentes:ajustar` com zod;
    - tela: `lousa/modelo.ts` (rótulos, nomes em português, "não aceita esse nível"; +8 testes) e `ModeloDoQuadro.tsx` (os dois seletores, com o menu em portal da conta). Só no agente Claude.
  - **Desvio do plano:** `ajustar` devolve `'agora' | 'quandoParar' | 'naAbertura'`, para o balão dizer quando vale.
  - `npm run check` verde (415) sem aviso e `npm run smoke` verde. Uma rodada anterior do check teve 3 falhas que não se repetiram nas duas seguintes; não guardei os nomes (provável disputa com as provas da outra sessão rodando ao mesmo tempo).
  - **Provado na janela real** (cenário novo `modelo`, `ok: true`): Claude de verdade só até o "No, exit"; o estado do agente impresso pelo PowerShell e o painel pelo `prova.ipc`. Antes do painel, rótulos cinza; com o painel, "Opus 5.5 ▾" e "médio ▾"; trabalhando, Sonnet só guardou ("Vale quando o agente parar") e nada foi digitado; ao parar, chegou `/model sonnet`; "alto" com ele parado chegou na hora como `/effort high`; painel 5 s depois ainda com médio mostrou "⚠ médio"; o quadro salvo no main ficou com sonnet/high.
  - **Não provado:** um Claude de verdade trocando de modelo no meio da conversa, e o nível recusado por um modelo real. Fica para o aceite (item 47).
- **20/10/2026 (D38, "ir ao quadro"):** o Ctrl+K e a notificação do Windows usam a mesma conta do ⤢ (`irPara` em `useAmpliar.ts`): folga de 20%, no máximo 100%, e a câmera move na hora. Check verde (415); cenários `paleta` (foto 2: o quadro "api" no centro, a 100%) e `ampliar` com `ok: true`. Aceite no item 67.
- **20/10/2026 (T20.1 + T20.2, D24):** uso da sessão e da semana em cada conta Claude.
  - **Código:**
    - `shared/model.ts`: `UsoConta`; `shared/uso.ts`: `limiteVigente`/`usoVigente` (hora de zerar passada = 0%, usada no main e na tela; +4 testes);
    - `agentes/uso.ts`: `juntarUso` (o mais novo vence; sem limites mantém o anterior) e `UsoDasContas` (+7 testes); ligado no `emitir` da ponte em `contexto.ts`, pela conta do quadro;
    - canais `perfis:uso` e o evento `perfis:usoMudou` (handler em `handlers/agentes.ts`, junto dos outros dados dos agentes);
    - tela: `topo/uso.ts` ("zera em 2h10", "zera sex 09:00", "visto há 12 min", níveis 70/90, velho com mais de 1 h; +9 testes) e `topo/UsoConta.tsx` (store único, barras e linhas do balão); `IconeConta` mostra só em conta Claude.
  - **Desvios do plano:** o cenário se chama `uso` (o nome `painel` já era o da Fatia 17) e usa o estado `demo` com as duas contas; o `perfis:uso` mora em `handlers/agentes.ts`. De passagem, `enquadrar` (`useAmpliar.ts`) recebe folga e zoom num objeto, para zerar o aviso de lint (5 parâmetros).
  - `npm run check` verde (435) sem aviso e `npm run smoke` verde.
  - **Provado na janela real** (cenário `uso`, `ok: true`): sem dado ao abrir; Principal 42%/18% com barras azuis e balão "Sessão 42% · zera em 2h10" / "Semana 18% · zera sex 09:00" / "visto agora"; Pessoal 92%/75% vermelha e âmbar, em cinza, "visto há 2 h". A primeira rodada pegou o relógio da tela atrasado até 30 s ("visto há 1 h"): agora conta com a hora de cada desenho.
  - **Não provado:** os números de um Claude de verdade contra o "Account & Usage" do VSCode. Fica para o aceite (item 48).
- **20/10/2026 (T21.1 + T21.2, D36):** cara nova da Lousa, Ardósia e giz.
  - **T21.1:** `estilos/tokens.css` com todas as cores e raios (as da D36, mais nota, diff e o vidro); o `:root` do `styles.css` saiu de lá. Os 14 CSS só usam `var(--...)`: `grep -E "#[0-9a-f]{3,6}"` fora do tokens não acha nada. Botão principal em giz. O React Flow (lousa, pontos, minimapa, botões de zoom) pega as cores pelas variáveis `--xy-*`. O `lousa.css` foi dividido antes de crescer: a janela do novo quadro foi para `novo.css` (338 → 220 + 118).
  - **T21.2:**
    - `atencao.ts`: `brilhoDoQuadro` (no máximo 4 animando, na ordem em que avisaram; o quinto fica com a borda parada) e `textoDaPilula` (+3 testes);
    - `QuadroNode` põe `quadro-trabalhando`/`quadro-brilho`; o brilho é um `::after` com `@property --giro` + `conic-gradient` e máscara só no anel, e para com "reduzir movimento". A faixa de cima continua na cor da conta;
    - "esperando você" deixou de piscar: borda âmbar parada e halo (D36);
    - a pílula foi para o meio da barra de cima: "● 1 esperando você · 3 trabalhando"; só trabalhando, fica em giz azulado e sem clique;
    - fundo fosco (`--vidro` + `backdrop-filter`) na barra de cima, nos menus de conta, no balão, no painel da engrenagem e no Ctrl+K; nunca nos quadros.
  - **Prova:** opção nova `brilho` no `desempenho` (o `main/cenario.ts` só liga "reduzir movimento" sem ela; +1 teste). `desempenho acumular brilho`: 5 trabalhando, 4 animando, eco mediana 21 ms (p90 24, pior 35), tela travada 0. `fatia8` com `ok` nos passos (pílula "● 1 esperando você", brilho apaga, pílula some). Numa das três rodadas do `fatia8` com a F21, o "ponteiro de link" saiu `false`; nas outras duas e na `main` sem a F21, `true`. Fica anotado como instável.
  - `npm run check` verde (439) sem aviso.
