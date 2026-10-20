# Fatias 22 a 27 — evoluções de uso diário

Pedido do Sidney (20/10/2026): "faça as demais evoluções", a partir da lista que as provas das
Fatias 10 a 13 trouxeram. Feitas em paralelo às Fatias 18 a 21, na branch `evolucoes-22-27`
(worktree `lousa-ia.wt-evolucoes`), combinado com a outra sessão:

- decisões D30 em diante;
- itens do roteiro de aceite do 60 em diante;
- arquivos compartilhados (`model.ts`, `ipc.ts`, preload, `QuadroNode.tsx`, docs) só com
  acréscimos;
- cada fatia pronta entra na `main` por fast-forward, depois de rebase, `npm run check` e
  cenários verdes.

| Fatia | Entrega visível | Decisão |
|---|---|---|
| 22 | Na janela "Juntar", clicar num arquivo mostra o que a cópia mudou nele | D31 |
| 23 | Juntar não trava por arquivo fora do git na original; no conflito, "Pedir ao agente para resolver" | D30 |
| 24 | Quadro novo nasce num espaço livre; Enter do Ctrl+F sobe para o achado anterior | D32 |
| 25 | Mensagens prontas na barra de vários quadros e no Ctrl+K | D33 |
| 26 | Nota na lousa (markdown), com "Mandar para o agente" | D34 |
| 27 | Vistas salvas: guardar e voltar a uma arrumação da lousa | D35 |

## Fatia 22 — ver a diferença antes de juntar

- **T22.1** `diffDoArquivo(git, repo, caminho)` e `lerDiff` em `src/main/copias/juntar.ts`
  (+testes, com git de verdade).
  - Canal `copias:diff { repoId, caminho } → DiffArquivo`.
  - O caminho só serve se estiver na lista que o próprio main monta (`git diff --numstat`).
  - Tela: `lousa/VistaDiff.tsx` e `estilos/juntar.css`. A lista da janela vira botões; "← Arquivos" volta.
  - **Pronto quando:** cenário `juntar` mostra `+oi` na diferença de `novo.txt`.

## Fatia 23 — juntar sem travar à toa

- **T23.1** A pasta original só bloqueia com alteração em arquivo que o git acompanha
  (`status --untracked-files=no`).
  - Se a cópia traz um arquivo com o mesmo nome de um arquivo fora do git da original, o git
    recusa. `explicarRecusa` diz quais arquivos são e o que fazer (+testes).
- **T23.2** No conflito, com um **agente** na cópia: botão "Pedir ao agente para resolver".
  - Escreve no agente (`lousa/escrever.ts`, a mesma escrita da Fatia 13) o pedido de
    `pedidoDeResolver` (`lousa/resolver.ts`, +teste): merge da branch da original **dentro da
    cópia**, resolver, testar e commit.
  - A original só muda no próximo Juntar.
  - **Pronto quando:** cenário `juntar` junta com `rascunho.txt` solto na original; o botão só
    aparece em agente (provado no aceite, item 61).

## Fatia 24 — pequenos ajustes de uso

- **T24.1** Quadro novo procura espaço livre.
  - Função pura `lugarLivre(caixas, desejada)` (+teste): se a caixa pedida encosta em outra,
    tenta posições vizinhas em volta, das mais perto para as mais longe.
- **T24.2** Ctrl+F começa no achado mais recente; **Enter sobe** (mais antigo) e
  **Shift+Enter desce**.

## Fatia 25 — mensagens prontas

- **T25.1** Main: `src/main/mensagens/servico.ts`.
  - Lista de até 30 frases, cada uma com até 2000 letras, num arquivo próprio
    (`<userData>/mensagens.json`), fora do `estado.json`.
  - Canais `mensagens:listar` e `mensagens:salvar`.
  - Começa com três: rodar os testes, fazer commit, resumir o que fez.
- **T25.2** Tela.
  - Na barra de vários quadros: "★" lista as frases (clique preenche) e "Guardar" salva o texto
    escrito.
  - No Ctrl+K: "Mandar: <frase>" envia aos quadros selecionados ou, sem seleção, ao último quadro
    em que você clicou.

## Fatia 26 — nota na lousa

- **T26.1** `Nota { id, texto, caixa }` numa lista própria do estado (`notas`), sem pasta nem
  conta.
  - Canais `notas:criar`, `notas:salvar` e `notas:remover`.
  - A posição e o tamanho vão no `lousa:salvarLayout`.
- **T26.2** Nó próprio do React Flow (`NotaNode`), separado do `QuadroNode`.
  - Duplo clique ou "Editar" escreve; fora disso, mostra o markdown.
  - "Mandar para o agente" usa o mesmo alvo da T25.2.
  - Criar: Ctrl+K "Nova nota" e "+ Nota" ao lado de "+ Novo quadro".

## Fatia 27 — vistas salvas

- **T27.1** `VistaSalva { id, nome, viewport, caixas }` no estado (`vistas`).
  - Canais `vistas:salvar` e `vistas:remover`.
  - Voltar a uma vista move a câmera e devolve cada quadro e nota ainda existentes ao lugar
    guardado. Quem nasceu depois fica onde está.
- **T27.2** Ctrl+K "Vista: <nome>" volta; "Guardar vista atual…" pede o nome. Remover pela
  paleta ("Apagar vista: <nome>").
