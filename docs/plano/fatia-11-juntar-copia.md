# Fatia 11 — Juntar o trabalho da cópia de volta

Entrega: no quadro de uma cópia separada (Fatia 10), o botão **"Juntar"** mostra
o que a cópia tem (commits, arquivos, linhas) e faz o merge da branch dela na
branch atual da pasta original. Depois oferece fechar o quadro, e a cópia (já
juntada) é apagada sem perder nada.

Origem: pedido do Sidney em 19/10/2026 ("faça as 4": Fatias 11 a 14). Decisão: D19.

## Regras

- Junta só **commits**. Alteração sem commit na cópia não entra (o resumo avisa
  e o juntar recusa). Alteração sem commit na pasta original também recusa: o
  merge nunca mistura com trabalho pela metade.
- `git merge --no-edit lousa/<apelido>` na pasta principal do repositório (achada
  por `rev-parse --git-common-dir`), na branch em que ela estiver. HEAD solto: recusa.
- Conflito: lista até 5 arquivos, `git merge --abort` e lança. A pasta original
  fica exatamente como estava.
- Depois de juntar, `branch -d` passa a aceitar: fechar o quadro apaga cópia e branch.

## T11.1 Main: resumo e juntar

**Arquivos:** `src/main/copias/juntar.ts` (+ `juntar.test.ts` com git real),
`src/main/handlers/copias.ts`, `src/shared/model.ts` (`ResumoCopia`),
`src/shared/ipc.ts`, `src/preload/index.ts`, `src/main/index.ts`.

| Canal | Entrada | Saída |
|---|---|---|
| `copias:resumo` | `{ repoId }` | `ResumoCopia` (branch, branchAlvo, commits, arquivos até 200, totalArquivos, pendente) |
| `copias:juntar` | `{ repoId }` | `{ branchAlvo }`; lança com a explicação |

**Testes:** `lerNumstat`; resumo; junta e depois `limpar` apaga; conflito desfaz;
pendência na cópia ou na original recusa.

## T11.2 Tela

**Arquivos:** `src/renderer/src/lousa/JanelaJuntar.tsx`, `QuadroNode.tsx`,
`copia.ts` (`frasesDoResumo`, + teste), `estilos/quadro.css`.

**Regras:** botão "Juntar" só em quadro de cópia; janela com a frase do resumo,
lista de arquivos (+/−), aviso de pendência; "Juntar em <branch>" só com commit;
depois, "Fechar o quadro e apagar a cópia" ou "Continuar trabalhando nela".

## Aceite

Itens 35 e 36 do `docs/aceite/roteiro.md`.
