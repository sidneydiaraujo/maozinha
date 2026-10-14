# Estado da construção

**Próxima tarefa: T4.2** (`docs/plano/fatia-4-entrega.md`) — aceite com o Sidney

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
| T1.8 | Nova conta (Claude ou Codex) | ⬜ |
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
| T4.2 | Aceite da jornada (11 itens) | 🟡 README e roteiro prontos; execução com o Sidney |

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
