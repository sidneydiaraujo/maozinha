# Lousa.ia — base de funcionalidades

Status: **em construção** desde 13/10/2026 (ver `docs/ESTADO.md`). Pesquisa de 12/10/2026.
Primeira versão = seção 1.1; o plano está em `docs/plano/`.

## 1. O que é

App de desktop (Windows primeiro) com uma **lousa infinita** onde cada quadro
é um terminal de IA, uma nota, uma tarefa, um navegador ou um diff. Cada quadro
pertence a um **perfil** (Empresa, Pessoal…) e a um **repositório**. Agentes do
mesmo perfil podem **trabalhar como um time**: conversam, reservam arquivos e
integram o trabalho juntos.

Princípios (valem para toda decisão):
1. **Local-first.** Estado, sessões e orquestração ficam no PC. Sem servidor
   nosso, sem telemetria própria.
2. **Perfis estanques.** Nada atravessa de um perfil para outro: login, histórico,
   tokens, GitHub, cookies, mensagens entre agentes.
3. **Qualquer CLI.** Se abre num terminal, roda na Lousa (Claude Code, Codex,
   Gemini CLI, OpenCode, Aider, scripts).
4. **Visível > escondido.** O estado de cada agente aparece no canvas.
5. **Pequeno e testado.** Teto de 350 linhas por arquivo; isolamento provado por teste.

### 1.1 A dor nº 1: navegar nas duas contas (13/10/2026)

Meta: depois da primeira abertura, **o único passo é adicionar o repositório**.
1. **Primeira abertura (uma vez):** a Lousa acha as contas que já existem
   (`~/.claude` = Empresa, `~/.claude-pessoal` = Pessoal) e mostra o e-mail de
   cada uma. Conta sem login ganha um botão "Entrar".
2. **Adicionar repo:** escolher a pasta (ou colar a URL para clonar) e clicar na
   conta. A Lousa já deixa marcada a sugestão:
   - pasta dentro da raiz de um perfil (ex.: `C:\Users\sidne\pessoal\` = Pessoal);
   - senão, a conta usada na última vez.
   O dono do `git remote` não serve de pista aqui: repos pessoais e da empresa
   estão todos em `github.com/sidneydiaraujo`.
3. **Daí em diante:** todo terminal ou agente aberto naquele repo já nasce na
   conta certa, com a cor e o e-mail no quadro. As duas contas ficam lado a lado
   na mesma lousa.

4. **Teste da primeira versão (pedido do Sidney, 14/10/2026):** abrir ao menos
   dois terminais com **duas contas distintas**, do mesmo provedor ou não
   (Claude + Claude, Claude + ChatGPT/Codex), em **repositórios diferentes ou no
   mesmo repositório**. A conta é escolhida **por quadro**: o repo tem uma conta
   padrão (a sugerida), e "+ Agente ▾" abre outra conta ali mesmo. "Contexto
   igual ou distinto" na v1 significa: cada agente tem a sua conversa; os dois
   veem os mesmos arquivos do repo. Passar contexto de um para o outro é manual
   (copiar e colar). Coordenação automática é E1–E3, depois da v1. Atenção: dois
   agentes no mesmo repo editam os mesmos arquivos; uma cópia isolada por quadro
   (worktree, D1) é pós-v1.

Por que aqui dá para ser simples e no OpenCove não: a Lousa monta o ambiente de
cada terminal do zero (C3). A Empresa roda no modo padrão do Claude, sem
variável nenhuma; a Pessoal recebe só `CLAUDE_CONFIG_DIR`. Não há casa falsa,
variável para lembrar nem arquivo de preferências duplicado.

## 2. Mapa do mercado (verificado em 12/10/2026)

| Produto | Licença / stack | Canvas | Multi-conta | Coordenação | O que aproveitar |
|---|---|---|---|---|---|
| **OpenCove** (DeadWaveWave) | MIT · Electron + React + React Flow + xterm + node-pty + SQLite · ★1,6k, ativo | ✅ infinito | ❌ só respeita a variável se já vier | ❌ | Canvas, busca na saída dos terminais, snapshots do espaço, perfis de navegador isolados, hooks injetados **por sessão**, plugins |
| **Agent Workspace** (agent-workspace.ai) | Era MIT, **código fechado desde 04/09/2026** · Node + Socket.IO + Tauri | ❌ grade 2×2 | ❌ | Commander (terminal que comanda os outros) | Tiers T1–T4, par agente+servidor por worktree, painel de portas, diff + console de revisão, quadro de tarefas, abas de workspace |
| **HNA-Code** | MIT · Electron + xterm · 1 autor | ❌ grade | ✅ `CLAUDE_CONFIG_DIR` por célula | ❌ | Brilho/som quando a sessão espera você, retomar após reinício, canal local com token |
| **Emdash** (YC W26) | Apache-2.0 · ★6k | ❌ | parcial | ❌ | Worktree por tarefa, 27+ CLIs, tickets do Jira/Linear/GitHub, diff lado a lado + PR + CI, SSH remoto |
| **Nimbalyst** (ex-Crystal) | MIT · ★1,9k | visual | parcial | ❌ | Sessões paralelas com worktree em 1 clique |
| **Vibe Kanban** | Apache-2.0 · Rust · ★28k | ❌ kanban | ❌ | ❌ | Fluxo tarefa → agente → revisão |
| **Claude Squad** | **AGPL** · Go/tmux | ❌ | ❌ | ❌ | Referência de TUI; código não reutilizável fora da AGPL |
| **Conductor** | Proprietário · Mac | ❌ | ❌ | ❌ | Revisão de diff como centro do fluxo |
| **TermCanvas / Cate / Catenary** | MIT / MIT / proprietário | ✅ | ❌ | Catenary: "cabos" entre terminais | Ideia visual de ligar quadros com cabos |
| **MCP Agent Mail** | licença a confirmar · Python/Rust | — | — | ✅ inbox, threads, **reserva de arquivos** + bloqueio no pre-commit | Modelo do nosso barramento de coordenação |
| **Claude Code Agent Teams** (nativo, experimental) | Anthropic | — | — | ✅ líder + colegas, mailbox, lista de tarefas | Usar dentro de um quadro; a Lousa coordena entre quadros |
| Mesa | Fechado, só Mac | ✅ | ❌ | ❌ | Só inspiração visual |

**Ninguém junta as três coisas: canvas + perfis estanques + coordenação entre
terminais.** Esse é o espaço da Lousa.ia.

## 3. Funcionalidades

Prioridade: **M** = MVP (uso diário), **V1** = logo depois, **V2** = depois.
Origem entre parênteses.

### A. Lousa (canvas)
| # | Funcionalidade | P |
|---|---|---|
| A1 | Canvas infinito com zoom, pan, grade e minimapa (OpenCove, Mesa) | M |
| A2 | Quadros: terminal, nota (markdown), tarefa, navegador, diff, imagem colada | M (diff/navegador V1) |
| A3 | Moldura de projeto: agrupa quadros de um repo, com a cor do perfil | M |
| A4 | Layout e saída dos terminais salvos e restaurados ao reabrir (OpenCove, HNA) | M |
| A5 | Paleta de comandos (Ctrl+K) e atalhos para criar quadros | M |
| A6 | Busca global no canvas **e na saída dos terminais** (OpenCove) | V1 |
| A7 | Snapshots do espaço: voltar a um estado anterior da lousa (OpenCove) | V1 |
| A8 | Cabos entre quadros mostrando quem conversa com quem (Catenary) | V1 |
| A9 | Várias lousas em abas (Agent Workspace) | V2 |

### B. Terminais e agentes
| # | Funcionalidade | P |
|---|---|---|
| B1 | Novo terminal em 1 clique: **perfil → repositório (pasta local ou clonar) → agente** | M |
| B2 | Qualquer CLI; presets para Claude Code, Codex, Gemini CLI, OpenCode | M |
| B3 | Estado do agente: rodando / **esperando você** / erro, com brilho, som e notificação do Windows (HNA) | M |
| B4 | Retomar as sessões certas nos quadros certos após reiniciar (HNA) | M |
| B5 | Par agente + servidor no mesmo worktree (Agent Workspace) | V1 |
| B6 | Painel de portas: serviços rodando e quem é dono (Agent Workspace) | V1 |
| B7 | Tiers T1 Foco · T2 Reserva · T3 Fundo · T4 Madrugada (Agent Workspace) | V1 |
| B8 | Enviar o mesmo prompt para vários quadros (Commander) | V1 |
| B9 | Uso/custo por perfil, lido dos históricos locais | V2 |

### C. Perfis e isolamento (o diferencial)
| # | Funcionalidade | P |
|---|---|---|
| C1 | Perfil = nome + cor + pastas próprias: `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `GH_CONFIG_DIR`, autor do git e login do git separado (D42: sem `GIT_CONFIG_GLOBAL`; chave SSH fica de fora) | M |
| C2 | Detecta perfis existentes (`~/.claude`, `~/.claude-pessoal`, `~/.codex`, `~/.codex-<nome>`) e permite criar novos de Claude ou Codex | M |
| C3 | Terminal recebe **só** as variáveis necessárias (lista permitida), nunca o ambiente inteiro do PC | M |
| C4 | Segredos no Gerenciador de Credenciais do Windows, nunca em arquivo da Lousa | M |
| C5 | Hooks injetados por sessão (OpenCove); **nunca** reescrever o `settings.json` de um perfil | M |
| C6 | **Proibido** copiar conversa, tarefa ou mensagem entre perfis (o erro do HNA) | M |
| C7 | Borda e moldura na cor do perfil; quadros de perfis diferentes não se ligam | M |
| C8 | Teste automático de isolamento a cada versão: um terminal do perfil A não vê nada do B | M |
| C9 | Navegador embutido com partição de cookies por perfil (OpenCove) | V1 |
| C10 | Por perfil: desligar tráfego não essencial do Claude, regras de leitura proibida (ex.: a pasta do outro perfil) | V1 |
| C11 | Ao adicionar repo: conta sugerida pela raiz da pasta ou pela última usada; 1 clique para confirmar (seção 1.1) | M |
| C12 | E-mail da conta em cada quadro, lido de `claude auth status`; botão "Entrar" que abre o `/login` no perfil certo | M |
| C13 | O repo tem uma conta **padrão** (para quadros novos); cada quadro tem a sua conta, fixa, e mostra cor, nome e provedor. Várias contas no mesmo repo são permitidas (D11) | M |

### D. Git e revisão
| # | Funcionalidade | P |
|---|---|---|
| D1 | Worktree por tarefa/agente, criado e limpo pela Lousa (Emdash, Conductor) | M |
| D2 | Diff lado a lado por worktree; abrir PR e ver CI (Emdash, Agent Workspace) | V1 |
| D3 | Trem de integração: reúne as branches "prontas", roda os testes numa branch de integração e só então faz o merge conjunto | V1 |

### E. Coordenação entre agentes ("time LeSS")
| # | Funcionalidade | P |
|---|---|---|
| E1 | **Barramento local (MCP)** que cada agente do perfil enxerga: identidade, inbox, threads (MCP Agent Mail) | V1 |
| E2 | Reserva de arquivos com bloqueio no pre-commit (MCP Agent Mail) | V1 |
| E3 | Quadro de tarefas compartilhado: pegar tarefa, depender de outra, marcar "pronto" | V1 |
| E4 | Papéis por quadro (construtor, QA, revisor) com briefing próprio (AgentGrid) | V2 |
| E5 | Barramento sempre **por perfil**; registro auditável de todas as mensagens | V1 |
| E6 | Agent Teams nativo do Claude dentro de um quadro, quando fizer sentido | V2 |
| E7 | **Time por linhas** (20/10/2026, D39): puxar uma linha de um agente a outro, como no n8n; a Lousa apresenta o time, passa o trabalho adiante quando um termina e junta as cópias. Primeiro passo de E1 a E4 sem barramento | M |

### F. Tarefas e IAs web
| # | Funcionalidade | P |
|---|---|---|
| F1 | Tarefas locais; importar de GitHub Issues (Pessoal) e Jira (só perfil Empresa) (Emdash) | V1 |
| F2 | Quadro de chat web (claude.ai, ChatGPT, Gemini) com partição por perfil | V1 |

## 4. Segurança (requisitos, não opcionais)

- Electron: `contextIsolation`, `sandbox`, `nodeIntegration` desligado,
  navegação e `window.open` bloqueados (OpenCove e HNA fazem certo).
- Canal local só em `127.0.0.1`, com token sorteado por execução (HNA); abrir
  para a rede exige senha (Agent Workspace).
- Nenhuma biblioteca de rastreamento. Rede da Lousa: só verificar atualização
  (desligável), com hash conferido.
- Prompt injection: um agente pode ser enganado por conteúdo de um repo. Por
  isso: nada de segredos no ambiente do agente, worktrees descartáveis e
  mensagens do barramento tratadas como dado, não ordem.
- Instalador assinado (V2); até lá, hash publicado em cada versão.

## 5. Fora do escopo

App de celular (APK), sincronização em nuvem, colaboração multiusuário,
hospedar modelos, automatizar sites de chat (só exibi-los).

## 6. Decisão em aberto: base do código

| Opção | A favor | Contra |
|---|---|---|
| **A. Fork do OpenCove** | Já entrega A1–A7, B3–B4, C5, C9; MIT; stack igual à planejada | ~248 mil linhas para auditar e manter; alfa; 1 autor principal |
| **B. Do zero**, mesma stack, reaproveitando peças MIT com crédito | Código pequeno e auditável, isolamento desde o 1º dia | Mais semanas até ter o canvas do nível do OpenCove |
| **C. Plugin do OpenCove** (ele tem plugins desde a 0.4) | Menor esforço, se a API permitir perfis e barramento | **Não verificado**: a API pode não alcançar o ambiente dos terminais |

**Decidido em 12/10/2026: opção B (do zero)**, com foco em um desenvolvedor
coordenar um time inteiro de agentes. O OpenCove fica em uso como **teste de
experiência** até lá (seção 6.1).

### 6.1 Teste do OpenCove (instalado em 12/10/2026)

- v0.4.0, hash SHA-256 conferido com o `SHA256SUMS.txt` da release, Defender
  sem ameaças, instalador sem assinatura digital. Instalado por usuário em
  `%LOCALAPPDATA%\Programs\opencove`.
- Abrir **só** pelo atalho "OpenCove Pessoal" (`C:\Users\sidne\opencove-pessoal.ps1`):
  ele define `HOME=~\.opencove-pessoal\home` (com `.claude` → `~/.claude-pessoal`),
  `CLAUDE_CONFIG_DIR` pessoal, `CODEX_HOME` próprio e remove `GITHUB_TOKEN`.
- Projetos pessoais em `C:\Users\sidne\pessoal\`. **Nunca** abrir terminal na
  raiz `C:\Users\sidne` (a conta da empresa tem sessões lá).
- Atualização do OpenCove recria o atalho padrão "OpenCove": apagar e manter o "Pessoal".
- O lançador põe `~\.local\bin` no PATH (o `claude.exe` não está no PATH do
  Windows; sem isso o botão de agente e o `claude` do terminal não o acham).

**Duas contas no OpenCove (13/10/2026):** a conta é escolhida **por projeto**.
O OpenCove injeta as "variáveis de ambiente do projeto" em todo terminal e
agente daquele projeto.
- Projeto pessoal: nenhuma variável (herda a conta pessoal do lançador).
- Projeto da empresa (um por repo, ex.: `C:\Users\sidne\thunders-gestao`):
  `CLAUDE_CONFIG_DIR=C:\Users\sidne\.claude` e `HOME=C:\Users\sidne`.
- Conferir em cada projeto com `claude auth status` (mostra e-mail e pasta).
- Efeito colateral: com `CLAUDE_CONFIG_DIR` explícito, o Claude usa
  `~/.claude/.claude.json` em vez de `~/.claude.json`. Login (`.credentials.json`),
  skills, memória e sessões são os mesmos; preferências e MCPs do usuário, não.
- Esquecer as variáveis num projeto da empresa = código da empresa na conta pessoal.

**Lições para a Lousa (viraram requisito):**
1. O OpenCove procura sessões do Claude em **toda** pasta-casa que encontra,
   inclusive a que o Windows informa direto (`os.userInfo()`), ignorando
   `CLAUDE_CONFIG_DIR`. A lista de "sessões anteriores" de uma pasta mistura
   contas. → Na Lousa, o perfil é a **única** fonte de caminhos (reforça C1/C6).
2. Ao abrir, ele limpa hooks antigos dele no `settings.json` da casa principal.
   → A Lousa nunca escreve em arquivos de perfil (C5).
3. Aberto de dentro do VS Code, `ELECTRON_RUN_AS_NODE=1` vem herdado e o app
   fecha na hora. → O lançador da Lousa limpa o ambiente (C3).
4. Bom exemplo a copiar: hooks passados por sessão com `--settings <arquivo temporário>`.
5. Conta por projeto via variáveis soltas é frágil: não dá para **remover** uma
   variável (só sobrescrever), nada obriga a configurar e nada mostra a conta no
   quadro. Além disso, o agente padrão veio como Codex (não instalado) e o modo
   "acesso total" veio ligado. → Na Lousa, escolher o perfil é obrigatório ao
   criar o projeto; o perfil monta o ambiente do zero (C3); o app recusa abrir
   pasta fora das raízes do perfil; o modo de aprovação começa no seguro.

## 7. Fontes principais

OpenCove: github.com/DeadWaveWave/opencove · Agent Workspace: agent-workspace.ai e
cópia MIT github.com/PinkThositive/agent-workspace (v0.1.18, analisada com REA,
evidência `ev_8b6a0657…eae8683`) · HNA-Code: github.com/tyhh00/HNA-Code ·
Emdash: emdash.sh/docs · MCP Agent Mail: github.com/Dicklesworthstone/mcp_agent_mail ·
Agent Teams: code.claude.com/docs/en/agent-teams · Comparativos: nimbalyst.com/blog,
parallelcode.app/compare · Segurança: codersera.com/blog/how-to-sandbox-ai-coding-agents-2026.
