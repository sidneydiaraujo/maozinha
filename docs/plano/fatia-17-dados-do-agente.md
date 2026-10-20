# Fatia 17 — O agente conta à Lousa o modelo, o contexto e o uso

Entrega (por baixo, para as Fatias 18 a 20): a cada atualização, o main sabe de cada
agente o modelo, o nível de esforço, o contexto usado e os limites de uso da conta (5
horas e 7 dias, com a hora em que zeram). Nada novo na tela ainda, a não ser o registro.

Origem: avaliação de 19/10/2026. Decisão: D24.
**De onde vem:** a linha de status (`statusLine`) do Claude Code. A cada atualização o
Claude roda um comando e entrega a ele um JSON pelo stdin (`model`, `effort.level`,
`context_window.used_percentage`/`context_window_size`, `rate_limits.five_hour` e
`seven_day` com `used_percentage` e `resets_at`), especificação lida no `claude.exe`
2.1.304. O painel do VSCode usa outro caminho (`get_usage`, marcado como experimental), que
exigiria trocar o terminal pelo modo de troca de mensagens: fora.
Depende de: nada. As Fatias 18, 19 e 20 dependem desta.

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md`, este arquivo, `terminais/comandos.ts`,
`terminais/alvo.ts`, `terminais/status.ts` (como modelo de leitor puro), `avisos/` (como
modelo de evento com último valor guardado), o trecho de eventos de `src/shared/ipc.ts`,
`src/preload/index.ts` e `provas/apoio/falso-claude.mjs`. A seção "Regras do ambiente" da
`ARQUITETURA.md` e mais nada dela.

## T17.0 Prova antes de codar

**Precisa do ok do Sidney:** abre um Claude de verdade numa pasta de teste, sem mandar mensagem.

1. Medir no PC, com um JSON de exemplo no stdin, qual comando grava o stdin num arquivo
   mais rápido e sem janela: `cmd /d /c findstr "^" > arquivo`, PowerShell e o próprio
   `Lousa.ia.exe` como Node. Escolher o mais rápido que não deixa nada no ambiente do terminal.
2. Abrir `claude --settings <arquivo>` com essa `statusLine` e ver o JSON chegar, ainda sem
   mandar mensagem: anotar quais campos vêm antes da primeira resposta (o `rate_limits` pode
   só vir depois da primeira chamada) e de quanto em quanto tempo atualiza.
3. Conferir que uma `statusLine` já existente no `settings.json` da conta é substituída só
   nessa sessão, sem gravar nada na pasta da conta.

## T17.1 Leitor puro do JSON

**Arquivos:** `src/main/agentes/painel.ts` (+ `painel.test.ts`), `src/shared/model.ts`.

**Interface:**
```ts
export interface Limite { usado: number; zeraEm: number | null }  // usado 0-100; zeraEm em ms
export interface PainelAgente {
  modelo: { id: string; nome: string } | null
  esforco: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | null
  contexto: { usado: number; tamanho: number } | null            // usado 0-100
  limites: { cincoHoras: Limite | null; semana: Limite | null } | null
  quando: number
}
export function lerPainel(json: string, agora: number): PainelAgente | null
```

**Regras:** schema zod tolerante (campo novo do Claude não quebra; campo que falta vira
`null`); JSON inválido ou acima de 64 KB → `null`. Fica com o que interessa e descarta o
resto (caminho da conversa, `cwd`, custo). Nunca grava o JSON no registro.

**Testes:** o exemplo completo da especificação; sem `rate_limits` (conta sem plano); campo
desconhecido; JSON quebrado; `resets_at` em segundos vira ms.

## T17.2 Ligar a linha de status em cada agente

**Arquivos:** `src/main/agentes/ponte.ts` (+ teste com disco falso), `terminais/comandos.ts`
(+ teste), `terminais/alvo.ts`, `src/shared/ipc.ts` (`agentes:painel`), `src/preload/index.ts`,
`src/main/index.ts`, `docs/ARQUITETURA.md` (canal e pasta nova).

**Regras:**
- Ao abrir um agente, o main grava `<userData>\agentes\<quadroId>.settings.json` com a
  `statusLine` escolhida na T17.0, que escreve em `<userData>\agentes\<quadroId>.json`. O
  comando vira `claude --settings "<arquivo>" ...`. Nada vai para `~/.claude*` (regra do CLAUDE.md).
- **A statusLine da T17.0** (19/10/2026, D24):
  - `{ "type": "command", "command": "findstr \"^\" > \"C:/<userData com barra normal>/agentes/<quadroId>.json\"" }`.
  - O Claude roda esse comando pelo Git Bash: nada de `cmd /d /c`.
  - Se um dia rodar pelo PowerShell 5.1, o `>` grava em UTF-16. Por isso o leitor aceita UTF-8 e UTF-16 com BOM.
- **O que a T17.0 viu chegar (sem mensagem, conta Pro, Opus 5.5):**
  - `model.id` e `display_name`, `effort.level` e `context_window.context_window_size` = 1 000 000;
  - `context_window.used_percentage` = `null` até a primeira mensagem;
  - `rate_limits.five_hour` e `seven_day`, com `used_percentage` e `resets_at` em segundos;
  - também `session_id`, `transcript_path`, `cwd`, `cost`, que o leitor descarta.
  - Parado, a linha rodou uma vez em 25 s, 5 s depois de abrir. Ela atualiza com a conversa, não por relógio.
- Um vigia só da pasta `agentes` (sem subpastas, sem `stat`, como na D17), com espera de
  250 ms: lê o arquivo, `lerPainel` e manda `agentes:painel { quadroId, painel }`. O main
  guarda o último de cada quadro para a tela remontada (como o aviso do agente).
- Fechar o quadro apaga os dois arquivos dele. Ao abrir o app, apaga os de quadros que não
  existem mais.
- `quadroId` passa pelo formato de id antes de virar nome de arquivo.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; o Claude falso
(`provas/apoio/falso-claude.mjs`) passa a ler o `--settings` e rodar a `statusLine` com um
JSON de exemplo, e o cenário novo `provas/cenarios/painel.js` vê o `agentes:painel` chegar
com modelo, contexto e limites.

**Commit:** `feat: agents report model, context and usage to the main through the status line`

## Aceite

Sem item próprio: aparece nas Fatias 18 a 20.
