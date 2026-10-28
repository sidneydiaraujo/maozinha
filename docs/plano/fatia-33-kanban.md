# Fatia 33 — Kanban em md (D52)

Pedido do Sidney (28/10/2026): "um md chamado kanban que todos atualizam os cards e eu consigo
abrir aqui dentro do Mãozinha e veja atualizado. A intenção é apenas a gestão visual dos steps
com as etapas que o agente faz até a espera do commit." E: um só arquivo por projeto, todos
criam e movem cards, o Mãozinha cria o arquivo mesmo que ninguém queira ver, o card tem o nome
que o usuário deu ao terminal, e o mesmo terminal retoma o próprio card.

## Como funciona

- `KANBAN.md` na raiz da **pasta original** do projeto (cópia separada usa o da original).
- Etapas (seções `##`): 📋 A fazer · 🔍 Entendendo · 🛠️ Fazendo · 🧪 Testando ·
  ⏳ Esperando o commit · ✅ Feito.
- Card: `- **<nome>** · <tarefa> · <HH:MM>`. Nome = `nomeNoTime` (papel, senão apelido da
  cópia, senão o título).
- Quem escreve são os agentes. O Mãozinha só cria o arquivo e entrega a regra.
- Ver: o leitor de md já recarrega quando o arquivo muda (T7.4).

## T33.1 Regras puras do kanban

**Arquivos:** `src/main/kanban/kanban.ts` (+ `kanban.test.ts`).
- `ARQUIVO_KANBAN`, `ETAPAS`, `modeloKanban(projeto)`.
- `pastaDoKanban(repo, obterRepo)`: a original quando é cópia.
- `regraDoKanban(caminho, nome)`: uma linha só (vai na linha de comando), sem caractere de
  controle.
- `comExclusao(texto)`: o `.git/info/exclude` com `/KANBAN.md`, ou `null` se já tem.
- `garantirKanban(pasta, projeto, disco)`: cria o md se não existe; põe no exclude local do
  git (nunca no `.gitignore`, que é arquivo do usuário e vai nos commits). Falha de disco não
  impede o terminal de abrir.

**Pronto quando:** testes da regra, do modelo, da cópia, do exclude (com e sem `.git`, `.git`
arquivo, linha já presente) verdes.

## T33.2 Entregar a regra ao agente

**Arquivos:** `terminais/comandos.ts` (`extras.regra` → `--append-system-prompt '<...>'`),
`terminais/alvo.ts` (`deps.kanbanDoQuadro`), `handlers/terminais.ts`.
- Todo quadro de agente que abre garante o `KANBAN.md` (Claude ou Codex).
- Só o Claude recebe a regra (o Codex não tem `--append-system-prompt`).
- A regra é texto literal do PowerShell; caracteres de controle viram espaço (nunca um Enter).

**Pronto quando:** testes de `comandoAgente` e `resolverAlvo` com a regra; prova `kanban`
(sem Claude) mostra o arquivo criado e a linha do comando com a regra.

## T33.3 Papel em qualquer agente

`EtiquetaDoQuadro` mostra o papel em todo quadro de agente, não só no time. O nome novo vale
quando o agente abre de novo (a regra vai na linha de comando).

## Fora desta fatia

- Ver o kanban em colunas lado a lado (o leitor mostra as seções em lista).
- Regra para o Codex (precisaria de `AGENTS.md`, que é arquivo do usuário).
