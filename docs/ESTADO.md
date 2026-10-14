# Estado da construção

**Próxima tarefa: T1.2** (`docs/plano/fatia-1-contas.md`)

Atualize este arquivo no mesmo commit de cada tarefa: marque ✅, troque a
"Próxima tarefa" e escreva uma linha no diário.

## Tarefas

| Id | Tarefa | Status |
|---|---|---|
| T0 | Esqueleto: Electron + React + régua + `npm run smoke` | ✅ 13/10/2026 |
| T1.1 | Modelo compartilhado | ✅ 14/10/2026 |
| T1.2 | Detectar as contas do PC | ⬜ |
| T1.3 | Montar o ambiente de um terminal | ⬜ |
| T1.4 | Ler o status de login (Claude) | ⬜ |
| T1.4b | Ler o status de login (Codex) | ⬜ |
| T1.5 | Guardar o estado | ⬜ |
| T1.6 | Serviço e canais das contas | ⬜ |
| T1.7 | Barra lateral de contas | ⬜ |
| T1.8 | Nova conta (Claude ou Codex) | ⬜ |
| T2.1 | Serviço de terminais | ⬜ |
| T2.2 | node-pty real + teste de isolamento | ⬜ |
| T2.3 | Canais dos terminais (login) | ⬜ |
| T2.4 | Componente de terminal | ⬜ |
| T2.5 | Botão "Entrar" | ⬜ |
| T3.1 | Sugerir a conta de um repo | ⬜ |
| T3.2 | Serviço e canais de repos | ⬜ |
| T3.3 | Fluxo "Adicionar repositório" | ⬜ |
| T3.4 | Lousa: molduras e quadros | ⬜ |
| T3.5 | Salvar e reabrir a lousa | ⬜ |
| T3.6 | Conta padrão do repo e remover | ⬜ |
| T4.1 | Instalador | ⬜ |
| T4.2 | Aceite da jornada (11 itens) | ⬜ |

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
