# Estado da construção

Só o que vale agora: a próxima tarefa, o que segue aberto e o que travou. O que já foi feito está no
diário, um arquivo por mês (`docs/diario/AAAA-MM.md`), e nas tabelas antigas de tarefas e ajustes
(`docs/diario/tarefas.md`).

**Como atualizar (a cada tarefa, no mesmo commit):** uma linha no diário do mês, no formato
`- **DD/MM/AAAA (id):** o que mudou, o que provou e o que ficou`. Este arquivo só muda quando a
próxima tarefa, um item aberto ou um bloqueio mudam. Teto: ~120 linhas (R4.25).

## Próxima tarefa

**Aceite do Sidney com o instalador 0.4.12**, que traz a revisão de 07/11 inteira (`docs/revisao/2026-11-07.md`, blocos 1 a 4).

1. **Aceite do instalador 0.4.12** (`release/Maozinha Setup 0.4.12.exe`, hash em `release/SHA256.txt`):
   itens 103 a 112 do `docs/aceite/roteiro.md` (a revisão) e, ainda sem aceite, 80 a 102 (0.4.10 e 0.4.11). A16, A19, A21 e A27 ainda não foram testados com o
   Claude de verdade: se o agente não perguntar antes de paralelizar, o plano B é o gancho na
   Agent/Task (D57). Reabrir os agentes depois de instalar. Seguem valendo os itens 17 a 49 e 60 a 79.

Na 0.4.12, o primeiro abrir vai tirar da lista as cópias `claude-2` e `claude-4` e oferecer apagar as
branches `lousa/claude-2` e `lousa/claude-4`, que já foram juntadas (R3.16).

## Em aberto

**Aceites que esperam o Sidney** (roteiro em `docs/aceite/roteiro.md`):

| Id | O quê | Situação |
|---|---|---|
| T7.6, T8.8, T10.5, T11.3, T12.3, T13.2, T14.2 | Aceites das Fatias 7 a 14 | ⬜ |
| T15.3, T16.3, T18.3, T19.3, T20.3 | Aceites das Fatias 15 a 20 | ⬜ itens 42 a 48 escritos no roteiro |
| T21.3 | Aceite e instalador 0.2.0 | ⬜ instalador de 20/10; item 49 |
| T4.2, T5.4 | Aceites da jornada e da lousa livre | 🟡 parciais; o que faltou foi para a T6.6 (✅) |
| itens 17 a 49 e 60 a 79 | Aceite dos itens da 0.4.4 | ⬜ |

**Adiados ou guardados:**

| Id | O quê | Por quê |
|---|---|---|
| T1.4b, Fatia 9 | Ler o login do Codex/ChatGPT | ⏸ espera o Sidney começar a usar o ChatGPT |
| A18 | Renomear "lousa" para "mãozinha" no código e nas pastas | ⏸ guardado em 30/10 (D54: só o nome do app mudou) |
| Fatia 32 | Recado no meio do trabalho | ⏸ guardada; plano em `docs/plano/fatia-28-a-32-time.md` (D39) |
| ideias V1 | Do `docs/FUNCIONALIDADES.md` | ⏸ fora do pedido atual |

**Decisão em aberto (R2.12):** a chave do servidor dos agentes segue em texto no `<id>.mcp.json` da
pasta de dados. Passá-la por variável de ambiente iria contra a regra "nunca chaves no ambiente do
terminal"; o Sidney mandou seguir assim em 07/11.

## Bloqueios

Nenhum.

## Pontos de atenção

- Uma rodada do `npm run check` teve um teste falhando uma vez, sem nome, e não repetiu (07/11). Se voltar,
  anotar qual foi.
- A prova `selecao` falhou uma vez logo depois da `desempenho`, na cópia com a lousa a 80%, e passou nas
  3 rodadas seguintes (08/11, R4.23). Se voltar, olhar o zoom reduzido.
- Provas com Claude de verdade (conta Pessoal, nenhuma mensagem) rodam sem pedir o ok do Sidney desde
  08/11 (acordo de autonomia para testes): `painel`, `anel`, `modelo`, `time`, `osc-saida`, `repasse`,
  `juntar-time` e `contrato-claude`. Push, versão e publicação seguem pedindo o ok.
- A `pasta-demo` das provas fica dentro do repositório lousa-ia, então o git dela enxerga as branches de
  verdade: a faixa "branches já juntadas" (R3.16) aparece na prova com `lousa/claude-2` e `lousa/claude-4`.
  Nenhuma prova clica nela; não clicar à mão numa prova aberta.

## Bom saber antes de testar com contas reais

- Em 13/10/2026 as duas pastas de configuração (`~/.claude` e `~/.claude-pessoal`) estavam logadas no
  mesmo gmail pessoal. A conta da empresa só aparece depois de logar nela.
- O `claude.exe` fica em `C:\Users\sidne\.local\bin`, fora do PATH do Windows.
- A cada atualização do Claude Code, rode a prova `contrato-claude` (R4.21): tudo que o Mãozinha supõe
  sobre ele está em `src/shared/contratoClaude.ts`.

## Onde está o resto

| O quê | Onde |
|---|---|
| Diário de outubro e de novembro de 2026 | `docs/diario/2026-10.md`, `docs/diario/2026-11.md` |
| Tabelas completas de tarefas (T0 a T33), ajustes (A1 a A31), pendências de 27/10 e o C1 | `docs/diario/tarefas.md` |
| Revisão de 07/11 e os blocos 1 a 4 | `docs/revisao/2026-11-07.md` |
| Plano de cada fatia | `docs/plano/` |
| Por que cada escolha | `docs/DECISOES.md` |
