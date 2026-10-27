# Mãozinha (antiga Lousa.ia e Salazar) — instruções para o Claude

O nome visível é **Mãozinha** (D50; antes Salazar, D45); no código, no repositório e na pasta de dados continua
`lousa-ia`. App de desktop (Windows, Electron) com uma lousa onde cada quadro é um terminal
de IA. Cada quadro pertence a uma **conta** (Claude Code ou Codex/ChatGPT) e já nasce
nela; o repositório só tem a conta padrão. Dor nº 1 a resolver: usar duas contas
lado a lado, no mesmo repo ou em repos diferentes, sem configuração
(docs/FUNCIONALIDADES.md, seção 1.1).

Dono: Sidney (não é programador de formação; explique em português simples).
Pode ser construído pela conta pessoal **ou** pela da empresa (decisão de
13/10/2026, docs/DECISOES.md D10). Tudo que importa está neste repositório,
nunca só na memória de uma conta.

## Comece por aqui (toda sessão)

1. Leia `docs/ESTADO.md`: diz a próxima tarefa e o que ficou pendente.
2. Abra o arquivo da fatia dessa tarefa em `docs/plano/` e siga a tarefa
   **à risca**: arquivos, assinaturas, testes e "Pronto quando".
3. Uma tarefa por vez. Ao terminar: `npm run check` verde (e `npm run smoke`
   quando a tarefa pedir), atualize `docs/ESTADO.md` e faça **um** commit.
4. Use a skill `dev-product-builder`. Para testes de regra, `qa-engineer`.

## Regras que não se negociam

**Isolamento entre contas (o produto existe por causa disto)**
- O ambiente de todo terminal é montado do zero por `montarAmbiente()`
  (lista permitida). Nunca passe `process.env` inteiro para um terminal.
- Conta Claude padrão (`~/.claude`) roda **sem** `CLAUDE_CONFIG_DIR`; as outras
  recebem só `CLAUDE_CONFIG_DIR=<pasta>`. Conta Codex: igual, com `CODEX_HOME`
  (`~/.codex` sem variável). Nunca as duas juntas; nunca `HOME`, tokens ou chaves.
- Quem decide conta, pasta e comando de um terminal é o **main**: a pasta vem do
  repo salvo e a conta do **quadro** salvo (D11). A tela só manda o id do quadro;
  nunca um caminho, uma conta ou um comando.
- A Lousa nunca escreve dentro das pastas de configuração (`~/.claude*`, `~/.codex*`);
  só cria a pasta vazia de uma conta nova (T1.8). Nunca leia `auth.json` do Codex.

**Segurança do Electron**
- Janela sempre com `secureWebPreferences` (src/main/security.ts).
- Canal novo de IPC: primeiro em `src/shared/ipc.ts`, depois `handle()` com
  schema zod no main, depois o preload. Evento do main para a tela entrega só
  o dado, nunca o objeto `event`.
- A tela (src/renderer) não importa Node, Electron, nem nada de `src/main`.

**Qualidade**
- Teto de 350 linhas por arquivo (o lint barra). Passou disso, divida pela
  costura natural. Nunca suba o teto nem desligue regra para passar.
- Regra de negócio fica em função pura com teste (`*.test.ts` ao lado).
- `console` só em `src/main/log.ts`. Use `log()`.
- Afirmação de "passa" só depois de rodar o comando agora.

## Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | Abre o app com recarga automática |
| `npm run check` | Tipos + lint + testes. Obrigatório antes de commitar |
| `npm run smoke` | Build + prova sem janela: terminal real e tela falando com o main. Usa a pasta de dados `%TEMP%\lousa-ia-smoke`, nunca a da Lousa instalada |
| `npm run build` | Só compila para `out/` |
| `node provas/rodar.mjs <cenario>` | Prova na janela real (escondida) com estado de teste: `fatia8`, `colar-e-reabrir`, `vivo`, `desempenho`, `copias`, `juntar`, `paleta`, `envio`, `prontas`, `anel`, `notas`, `vistas`, `selecao`, `ampliar`, `modelo`, `uso`, `git-conta`, `repasse`, `juntar-time`, `zoom-de-cima`, `cabecalho`, `historico`. Ver `provas/README.md` |

Sempre pelos scripts do npm (ou pelo `provas/rodar.mjs`): eles removem
`ELECTRON_RUN_AS_NODE`, que vem ligado quando o terminal é do VS Code e faz o
Electron fechar na hora. Prova na tela nunca reescreve `src/` para injetar
roteiro: use um cenário em `provas/cenarios/`.

## Armadilhas conhecidas (Windows)

- **Versões fixas.** Não troque versão nem adicione dependência nativa sem
  registrar em `docs/DECISOES.md`. O PC não tem compilador C++: o `node-pty`
  1.1.0 funciona porque vem pré-compilado. Nada de `electron-rebuild`.
- **Não invente API.** Na dúvida, leia os tipos em `node_modules/<pacote>/`.
- **node-pty:** `kill()` num processo que já saiu gera "AttachConsole failed".
  Marque `saiu` no `onExit` e só mate se ainda estiver rodando. Parte da saída
  pode chegar depois do `onExit` (espere ~500 ms antes de concluir).
- **React StrictMode** monta efeitos duas vezes no dev. Por isso abrir
  terminal é idempotente no main (mesmo id = mesmo terminal) e desmontar o
  componente **não** fecha o terminal.
- **React Flow + xterm:** o contêiner do terminal precisa das classes
  `nodrag nowheel` (senão digitar arrasta o quadro e a roda dá zoom).
- **Saída do PowerShell em teste:** monte marcadores com concatenação
  (`('C' + 'FG=')`) para não confundir com o eco do comando ou o título.
- `claude auth status` imprime avisos no stderr; o JSON vem no stdout.

## Quando parar e perguntar ao Sidney

- A tarefa pede trocar stack, versão ou adicionar dependência nativa.
- Algo enfraqueceria o isolamento entre contas.
- O mesmo erro voltou duas vezes: registre em `docs/ESTADO.md` (Bloqueios)
  com o comando e a saída, e pergunte.
- Deploy, publicação ou qualquer ação fora deste PC.

## Mapa

- `docs/ESTADO.md` — onde estamos e próxima tarefa
- `docs/plano/` — tarefas por fatia (o "como")
- `docs/ARQUITETURA.md` — partes, tipos, canais de IPC, regras do ambiente
- `docs/DECISOES.md` — por que cada escolha foi feita
- `docs/FUNCIONALIDADES.md` — visão completa do produto (o "o quê")

Commits em inglês, no formato `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
