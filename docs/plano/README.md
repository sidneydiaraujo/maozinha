# Plano de execução

Oito fatias. Cada fatia termina com algo que o Sidney consegue ver ou usar.
Faça as tarefas **na ordem**: cada uma usa o que a anterior entregou.

| Fatia | Entrega visível | Arquivo |
|---|---|---|
| 0. Fundação | Esqueleto que abre, com régua e smoke | feita em 13/10/2026 |
| 1. Contas | Barra lateral com as contas do PC (Claude e Codex), e-mail, nome editável e "+ Nova conta" | `fatia-1-contas.md` |
| 2. Terminais | Botão "Entrar" abre o login (Claude ou ChatGPT) da conta certa num terminal real | `fatia-2-terminais.md` |
| 3. Repos e lousa | Adicionar repo → moldura → quadros de terminal/agente, cada um na sua conta (duas no mesmo repo ou em repos diferentes), salvos ao reabrir | `fatia-3-repos-e-lousa.md` |
| 4. Entrega | Instalador, atalho e a jornada aceita pelo Sidney | `fatia-4-entrega.md` |
| 5. Lousa livre | Quadros soltos na lousa; conta e pasta escolhidas no mesmo gesto (arrastar a conta, duplo clique ou "+ Agente") | `fatia-5-lousa-livre.md` |
| 6. Quadro e conta | Pasta em destaque no quadro; trocar a conta (quem paga) mantém a conversa; barra só com contas; login sem terminal | `fatia-6-quadro-e-conta.md` |
| 7. Barra e arquivos | Contas como ícones numa barra no alto (engrenagem + "+ Nova conta"); lateral com as pastas em cascata e os arquivos que os terminais mexeram; leitor de md/código | `fatia-7-barra-e-arquivos.md` |
| 8. Uma semana sem ajustes | Agente avisa quando para (quadro brilha, notificação do Windows); copiar, colar e links no terminal; ampliar quadro e letra; reabrir terminal; registros em arquivo; janela lembra o tamanho | `fatia-8-uma-semana.md` |
| 15. Letra e cores | Terminal com fonte, entrelinha e paleta de quem usa o VSCode (Abyss); desenhista WebGL | `fatia-15-letra-e-cores.md` |
| 16. Colar print | Ctrl+V com imagem, botão 📎 e arrastar imagem colam o print no agente | `fatia-16-colar-print.md` |
| 17. Dados do agente | O main recebe de cada agente modelo, esforço, contexto e uso (linha de status do Claude) | `fatia-17-dados-do-agente.md` |
| 18. Anel de contexto | Anel configurável no cabeçalho do agente; clique compacta | `fatia-18-anel-de-contexto.md` |
| 19. Modelo e esforço | "Opus ▾" e "alto ▾" no cabeçalho, guardados no quadro | `fatia-19-modelo-e-esforco.md` |
| 20. Uso da conta | Barras de 5 h e 7 dias em cada conta na barra de cima | `fatia-20-uso-da-conta.md` |
| 21. Identidade visual | Cara própria (ardósia, giz, âmbar), primeiro em protótipo aprovado | `fatia-21-identidade-visual.md` |

Ordem das Fatias 15 a 21: 15 e 16 são independentes; 17 vem antes de 18, 19 e 20; 21 por
último. Comece cada uma numa sessão nova.

## Teto de contexto por fatia (desde a Fatia 15)

Cada fatia cabe em **no máximo 35% do contexto** de uma sessão (cerca de 70 mil tokens numa
janela de 200 mil), da leitura ao commit:

- A fatia diz o que ler ("Orçamento de contexto"). Fora dessa lista, só com motivo.
- Leia arquivo grande por trecho (`grep -n` e depois o pedaço), e saída de comando pelo fim
  (`| tail -30`).
- Passou de 35%: termine a tarefa em andamento, faça o commit, escreva no `ESTADO.md` onde
  parou e continue noutra sessão.

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
