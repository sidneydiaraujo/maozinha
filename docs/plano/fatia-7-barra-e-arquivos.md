# Fatia 7 — Barra de cima, pastas na lateral e leitor de arquivos

Entrega: as contas saem da lateral e viram ícones coloridos numa barra no alto,
ao lado de uma engrenagem. A lateral passa a mostrar as pastas em uso, em
cascata como o Explorer do VSCode, marcando os arquivos que os terminais acabaram
de mexer. Clicar num arquivo de desenvolvimento (md, código, json…) abre um
leitor à esquerda da lousa; documentos (pdf, docx, planilhas, imagens) abrem no
programa do Windows. Junto vem a T1.8 ("+ Nova conta"), dentro da engrenagem.

Origem: pedido do Sidney em 18/10/2026, depois do aceite da Fatia 6 (D15).

---

## Como o VSCode faz (lido no VSCode 1.142 instalado, `resources/app/out`)

Lido no código do próprio VSCode (`workbench.desktop.main.js` e
`platform/files/node/watcher/watcherMain.js`):

- **Esconde por padrão** (`files.exclude`): `**/.git`, `.svn`, `.hg`, `.jj`,
  `.DS_Store`, `Thumbs.db`. `node_modules` aparece.
- **Ordem padrão** (`explorer.sortOrder = default`): pastas primeiro, depois
  arquivos; nome comparado com `Intl.Collator` numérico (`a2` antes de `a10`).
- **Filhos sob demanda:** a pasta só lê o disco quando é aberta
  (`fetchChildren` → `fileService.resolve`).
- **Vigia:** um vigia recursivo por pasta raiz (`@parcel/watcher`, backend
  `windows`). Junta os eventos por 75 ms (`FILE_CHANGES_HANDLER_DELAY`) e manda em
  lotes. Ignora `.git/objects/**` e `.git/subtree-cache/**` (`files.watcherExclude`).
- **Marca de alterado:** os arquivos que o agente do chat está editando ganham
  um giro (`loading~spin`); os que ele já editou ganham uma letra de modificado
  que **sobe para as pastas** (`bubble: true`).
- **Binário:** lê os primeiros 512 bytes; achou byte zero (e não é UTF‑16) =
  binário, e o editor de texto recusa.

## Como a Lousa faz (decisões nossas)

- Vigia com `fs.watch(raiz, { recursive: true })` do próprio Node (no Windows usa
  a mesma API do sistema que o parcel). Sem dependência nativa nova.
- Além de `.git`, o vigia ignora pastas geradas (`node_modules`, `out`, `dist`,
  `build`, `coverage`…): um `npm run build` não pode encher a lista de alterados.
- A tela nunca manda caminho absoluto: manda `repoId` + caminho relativo, e o
  main confere que o arquivo está **dentro** da pasta.
- "Abrir fora" só para documentos e mídia (lista permitida). Executável ou
  script (`.exe`, `.bat`, `.ps1`, `.js`, `.py`…) nunca é aberto: só "Mostrar na
  pasta". Clicar num arquivo nunca roda nada.
- Markdown formatado com `markdown-it` (`html: false`: HTML dentro do md vira
  texto). Links `http(s)` abrem no navegador; links relativos abrem no leitor;
  imagens do md viram texto (a tela não carrega nada de fora).

---

## T7.1 Arquivos no main

**Arquivos:** `src/main/arquivos/regras.ts` (+ teste), `src/main/arquivos/servico.ts`
(+ teste), `src/main/arquivos/vigia.ts` (+ teste), `src/main/handlers/arquivos.ts`,
`src/shared/model.ts`, `src/shared/ipc.ts`, preload, `contexto.ts`, `index.ts`.

**Canais:**

| Canal | Entrada | Saída |
|---|---|---|
| `arquivos:listar` | `{ repoId, relativo }` | `ItemArquivo[]` (ordenados, sem os escondidos) |
| `arquivos:ler` | `{ repoId, relativo }` | `ConteudoArquivo` (`texto` até 2 MB, `binario` ou `grande`) |
| `arquivos:abrirFora` | `{ repoId, relativo }` | — (recusa o que não está na lista permitida) |
| `arquivos:mostrarNaPasta` | `{ repoId, relativo }` | — |
| `arquivos:abrirLink` | `{ url }` | — (só `http`/`https`) |
| `arquivos:vigiar` | — | — (vigia as pastas salvas; para as removidas) |
| `arquivos:mudou` | evento | `{ repoId, caminhos }` (relativos, com `/`) |

## T7.2 Barra de cima e contas na engrenagem

`BarraTopo`: engrenagem + um ícone por conta (desenho do provedor na cor da
conta, bolinha verde se logada). Clique no ícone → o cartão da conta (o mesmo
de antes) num balão. Arrastar o ícone para a lousa abre um quadro nela. A
engrenagem abre o painel "Contas" com todos os cartões e "+ Nova conta". A
versão do app fica no canto direito da barra (o `npm run smoke` procura ali).

## T7.3 Pastas na lateral

`Explorador`: cada pasta salva é uma raiz; clique abre e fecha em cascata,
lendo do disco só ao abrir. Arquivo mexido nos últimos 30 min fica amarelo com
●; enquanto está sendo escrito (últimos 4 s) a bolinha pulsa; a pasta que tem
um arquivo mexido dentro ganha uma bolinha também. No alto, "Alterados agora"
lista os 8 últimos. A pasta aberta é relida quando algo muda dentro dela.

## T7.4 Leitor

`Leitor`: coluna entre a lateral e a lousa, largura ajustável. md formatado
(com "Ver código"), outros textos com número de linha. Recarrega sozinho quando
o terminal mexe no arquivo ("atualizado agora"). Botões "Abrir fora" (quando
permitido), "Mostrar na pasta" e fechar.

## T7.5 Nova conta (T1.8)

Como em `fatia-1-contas.md` (T1.8), com o botão dentro do painel da engrenagem.

## T7.6 Aceite

Itens 17 a 22 do `docs/aceite/roteiro.md`.
