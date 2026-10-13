# Plano de execução

Quatro fatias. Cada fatia termina com algo que o Sidney consegue ver ou usar.
Faça as tarefas **na ordem**: cada uma usa o que a anterior entregou.

| Fatia | Entrega visível | Arquivo |
|---|---|---|
| 0. Fundação | Esqueleto que abre, com régua e smoke | feita em 13/10/2026 |
| 1. Contas | Barra lateral com as contas do PC, e-mail e nome editável | `fatia-1-contas.md` |
| 2. Terminais | Botão "Entrar" abre o login da conta certa num terminal real | `fatia-2-terminais.md` |
| 3. Repos e lousa | Adicionar repo → moldura colorida → terminais/Claude na conta certa, salvos ao reabrir | `fatia-3-repos-e-lousa.md` |
| 4. Entrega | Instalador, atalho e a jornada aceita pelo Sidney | `fatia-4-entrega.md` |

## Como cada tarefa está escrita

- **Objetivo:** o que muda para quem usa (ou para o código).
- **Arquivos:** o que criar ou mudar. Nada fora disso sem motivo escrito.
- **Interface:** assinaturas exatas. Copie; não renomeie.
- **Regras:** o comportamento esperado, inclusive casos de erro.
- **Testes:** casos que precisam existir (pode haver mais, nunca menos).
- **Pronto quando:** comandos e o que se vê. Só marque feito se tudo passar.
- **Commit:** mensagem sugerida.

## Definição de pronto (vale para toda tarefa)

1. `npm run check` sem erro (tipos, lint, testes), rodado depois da última edição.
2. `npm run smoke` sem erro quando a tarefa tocar `src/main`, `src/preload`
   ou a inicialização da tela.
3. Nenhum arquivo acima de 350 linhas.
4. `docs/ESTADO.md` atualizado: tarefa marcada, próxima tarefa, notas.
5. Um commit com a mensagem sugerida (ajuste se o escopo mudou).

## Se algo não se encaixar

- A tarefa contradiz o código existente: siga o código existente se ele já
  segue `ARQUITETURA.md`; senão, pare e registre a dúvida no `ESTADO.md`.
- Precisa de canal de IPC ou tipo que não está no plano: acrescente em
  `ARQUITETURA.md` no mesmo commit, com uma frase explicando.
- Tarefa grande demais para um commit: divida em `T3.4a`, `T3.4b` no `ESTADO.md`.
