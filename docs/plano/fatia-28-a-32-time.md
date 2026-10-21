# Fatias 28 a 32 — time de agentes ligado por linhas

Pedido do Sidney (20/10/2026): "uma função visual de poder linkar terminal com terminal e eles
entenderem que estão trabalhando juntos sem um atrapalhar o outro, como se fosse um time de
desenvolvimento", com a sensação de árvore do n8n: puxar uma linha de um quadro até outro.
Decisão: D39. Começa **depois** do aceite do instalador 0.2.0.

O que já existe e esta fatia reaproveita:
- estado do agente pelo OSC 7501 (`terminais/status.ts`): trabalhando, esperando, terminou;
- fila que só digita quando o agente para (`FilaAjustes` em `agentes/ajustes.ts`);
- cópia separada com branch própria (`quadros.criar(..., { separado: true })`, D18) e juntar (D19, D30);
- seleção + barra de envio (Fatia 13) e notas (Fatia 26): **continuam iguais**. A linha só
  acrescenta; falar com um quadro sozinho segue como hoje.

| Fatia | Entrega visível |
|---|---|
| 28 | Bolinhas nos agentes; puxar linha entre dois; clicar na bolinha cria um colega já ligado |
| 29 | O time se conhece: cada agente recebe quem é, quem são os colegas e as branches; papel no cabeçalho |
| 30 | Passar o trabalho adiante: quando um termina, o próximo recebe sozinho (padrão automático) |
| 31 | Juntar o time: as cópias voltam para a pasta original, uma por vez |
| 32 | (depois, com decisão própria) agentes mandam recado um ao outro no meio do trabalho |

## Vocabulário

- **Ligação:** a linha com seta `de → para`. "O de entrega para o para."
- **Time:** os quadros ligados entre si, direta ou indiretamente (componente conectado).
- **Repasse:** a mensagem que a Lousa digita no `para` quando o `de` termina.

## Regras que valem para as cinco fatias

- **Só agente Claude tem bolinha** (quadro `agente` de conta Claude). Terminal puro e Codex
  ficam de fora até terem estado de agente (Codex: depois da Fatia 9).
- **Conta (D39):** liga se os dois quadros são da **mesma conta**, ou se estão no **mesmo
  repositório** (a mesma pasta original ou cópias dela, pela `copia.origemId`). Contas diferentes
  em repositórios diferentes: recusa com "Contas diferentes só se ligam no mesmo repositório".
- **Sem ciclo:** A→B→A (ou maior) é recusado. Sem ligar um quadro a ele mesmo. Sem linha repetida
  (nem a mesma, nem a inversa).
- **Ninguém é interrompido:** a Lousa só digita num agente parado ou que terminou. Trabalhando ou
  esperando você: a mensagem espera na fila. Sem estado conhecido conta como ocupado (igual D25).
- **A tela só manda ids** (de quadro e de ligação). Quem monta texto, decide pasta, conta e
  branch é o main.
- Fechar um quadro remove as linhas dele. Remover uma linha não mexe nos agentes.
- Regras de ligação em função pura, em `src/shared/time.ts`, usada pelo main (vale) e pela tela
  (só para pintar a linha de vermelho enquanto arrasta).

---

## Fatia 28 — linhas na lousa

### T28.1 Modelo, regras puras e canais

**Arquivos:** `src/shared/model.ts` (acréscimo), `src/shared/time.ts` (+ teste),
`src/main/time/servico.ts` (+ teste), `src/main/handlers/time.ts`, `src/shared/ipc.ts`, preload,
`estado/` (schema zod e carga), `docs/ARQUITETURA.md`.

**Interface:**
```ts
// model.ts
export type ModoLigacao = 'automatico' | 'perguntar'
export interface Ligacao {
  id: string
  de: string          // quadroId que entrega
  para: string        // quadroId que recebe
  modo: ModoLigacao   // nova nasce 'automatico' (D39)
  pausada?: boolean
}
// EstadoSalvo e EstadoTela ganham: ligacoes?: Ligacao[]   (ausente = nenhuma)

// shared/time.ts
export type MotivoRecusa = 'mesmoQuadro' | 'repetida' | 'ciclo' | 'naoAgente' | 'contas'
export interface DadosTime { quadros: Quadro[]; repos: Repo[]; ligacoes: Ligacao[]; provedores: Record<PerfilId, Provedor> }
export function podeLigar(dados: DadosTime, de: string, para: string): { ok: true } | { ok: false; motivo: MotivoRecusa }
export function ligacoesValidas(dados: DadosTime): Ligacao[] // fechar quadro e trocar conta limpam com ela
export function timeDe(ligacoes: Ligacao[], quadroId: string): string[] // ids, ordem estável
export function raizDoRepo(repos: Repo[], repoId: string): string        // origemId ou o próprio id
export function mesmaPasta(quadros: Quadro[], a: string, b: string): boolean
```

**Canais (em `ipc.ts` primeiro, zod no main):**
- `time:ligar(de, para) → Ligacao` (lança com o motivo se `podeLigar` recusar);
- `time:ajustar(id, { modo?, pausada? }) → Ligacao`;
- `time:desligar(id) → void`;
- `quadros:criarColega(quadroId, posicao?) → { quadro, repo, ligacao }` (T28.3).

**Testes (`time.test.ts`):** liga dois agentes da mesma conta; liga contas diferentes no mesmo
repo e entre original e cópia; recusa contas diferentes em repos diferentes; recusa ciclo de 2 e
de 3; recusa repetida e inversa; recusa terminal puro e Codex; `timeDe` acha o time por ligação
indireta; quadro removido some das ligações (no serviço).

### T28.2 Tela: bolinhas e linha

**Arquivos:** `QuadroNode.tsx` (dois `Handle` do React Flow: entrada à esquerda e saída à
direita, só no agente Claude), `lousa/LinhaTime.tsx` (aresta própria), `lousa/useLigacoes.ts`
(hook com `onConnect`, `isValidConnection` e as arestas), `Lousa.tsx` (só liga o hook; está
com 310 linhas, nada de lógica nova nele), `estilos/time.css`.

**Regras:**
- Arrastar da bolinha de saída até a de entrada (ou o corpo) de outro quadro cria a linha.
  Enquanto arrasta, alvo inválido fica vermelho e o balão diz o motivo.
- A linha tem seta e a cor do time (cor estável a partir do id do primeiro quadro do time, das
  cores de `tokens.css`).
- Clicar na linha abre um menu: "Automático / Perguntar antes", "Pausar / Retomar", "Remover".
- Linha entre quadros na **mesma pasta** (não cópia): amarela, balão "Mesma pasta: podem se
  atrapalhar" e botão "Abrir o colega numa cópia" (fecha o `para` só depois de criar o novo; a
  conversa do antigo não vai junto, o balão avisa).
- A bolinha e a linha usam `nodrag` só onde precisam; o terminal continua com `nodrag nowheel`.

### T28.3 Clicar na bolinha cria um colega

**Regras (pedido do Sidney, D39):**
- **Clique** (sem arrastar) na bolinha de saída: o main cria um agente novo à direita do quadro
  (folga de 40 px, sem sobrepor, a regra da T24.1), **mesma conta**, mesmo repositório, e liga
  `origem → novo`. Nada para escolher.
- **Arrastar a bolinha e soltar no vazio**: o mesmo, com o quadro novo onde soltou.
- O colega nasce **na própria cópia** (`separado: true`) a partir da pasta **original** (se a
  origem já é uma cópia, a cópia nova sai da original, não da cópia). Pasta que não é raiz de
  um repositório git: nasce na mesma pasta e a linha já vem amarela.
- Modelo e esforço: os da origem.

**Testes:** no serviço, o colega herda conta e modelo, usa a raiz do repo e nasce ligado; pasta
sem git cai na mesma pasta.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; cenário novo `time` em
`provas/cenarios/` (dois agentes, uma linha, um colega pela bolinha, reabrir a Lousa e as linhas
continuam) com fotos; itens 72 a 74 do roteiro escritos.

---

## Fatia 29 — o time se conhece

### T29.1 Papel e apresentação

**Arquivos:** `model.ts` (`Quadro.papel?: string`, até 40 letras), `shared/time.ts`
(`textoDoTime`, + teste), `src/main/time/apresentar.ts` (+ teste), `QuadroNode.tsx` (papel
editável no cabeçalho), canal `quadros:definirPapel(quadroId, papel)`.

**Regras:**
- O papel é um nome livre ("Construtor", "Revisor", "QA"). Sem papel, o nome é o apelido da
  cópia ou o nome da pasta.
- Quando o time muda (ligou, desligou, papel novo), o main espera 2 s sem mudança (montar uma
  árvore manda uma vez só) e põe na fila de cada agente do time uma apresentação curta:
  > Você é o **Revisor** num time de 3 agentes na Lousa. Você trabalha na pasta
  > `...\claude-4`, branch `lousa/claude-4`. Colegas: **Construtor** (branch `lousa/claude-3`)
  > entrega para você; você entrega para **QA** (branch `lousa/claude-5`). Mexa só na sua pasta.
  > Para ver o trabalho de um colega, use `git log`/`git diff` na branch dele. Responda só "ok".
- Texto montado só com dados do estado (papel passa por limpeza: sem quebra de linha nem
  caracteres de controle). Vai como colagem (bracketed paste), como na T13.1.
- Quem saiu do time recebe "Você não faz mais parte do time." só se estava nele.

**Testes:** `textoDoTime` para árvore, cadeia e quadro sozinho; papel com `\n` e ESC é limpo;
duas mudanças em 2 s geram uma apresentação.

**Pronto quando:** check e smoke verdes; cenário `time` mostra o texto chegando ao terminal
falso; item 75 do roteiro.

---

## Fatia 30 — passar o trabalho adiante

### T30.1 Repasse

**Arquivos:** `src/main/time/repasse.ts` (+ teste), `shared/time.ts` (`textoDoRepasse`), fila
genérica extraída de `FilaAjustes` se servir aos dois (senão, uma `FilaRepasse` irmã), canal
`time:passar(id)` (o botão manual), evento `time:aoRepassar(ligacaoId)` (a linha pulsa).

**Regras:**
- O `de` chega a **terminou** → para cada ligação que sai dele, não pausada:
  - `automatico` (padrão): põe na fila do `para`;
  - `perguntar`: a linha pisca e mostra "▶ Passar para <nome>".
- Texto do repasse (o `mensagem` do OSC tem até 200 letras):
  > Seu colega **Construtor** terminou: "<mensagem>". O trabalho dele está na branch
  > `lousa/claude-3`. Veja o que mudou e continue a sua parte.
- **Freio:** no máximo **3 repasses automáticos seguidos** por time sem você digitar em algum
  quadro dele. No quarto, a linha fica pausada com "Limite de 3 repasses: Continuar?". Digitar
  em qualquer quadro do time zera a conta.
- O `para` fechado ou com terminal encerrado: o repasse é descartado e o balão da linha avisa.
- Duas linhas chegando no mesmo `para`: as mensagens entram na fila na ordem em que os `de`
  terminaram, uma por vez, cada uma só quando ele parar de novo.

**Testes:** automático põe na fila; perguntar não põe; pausada não faz nada; o quarto repasse
seguido pausa; digitar zera; `para` encerrado descarta; duas entradas no mesmo `para` saem em
ordem.

**Pronto quando:** check e smoke verdes; cenário `time` com terminal falso que "termina"
(OSC 7501 `done`) e o colega recebe; item 76 do roteiro (com Claude de verdade: Construtor →
Revisor).

---

## Fatia 31 — juntar o time

### T31.1 Juntar todas as cópias

**Arquivos:** `src/main/time/juntar.ts` (+ teste), menu da linha ("Juntar o time"), janela que
reaproveita a de "Juntar" (Fatias 11, 22 e 23).

**Regras:**
- Junta as cópias do time na pasta original, **na ordem da árvore** (quem entrega antes), uma
  por vez, com o mesmo `copias:juntar` de hoje.
- Para no primeiro conflito e mostra "Pedir ao agente para resolver" (D30) **daquela** cópia.
- Cópia com alteração sem commit: pula e lista no fim ("ficou de fora: tem alteração não salva").

**Pronto quando:** check verde; cenário `juntar` estendido com duas cópias; item 77.

---

## Fatia 32 — recado no meio do trabalho (depois)

Ideia: a Lousa dá a cada agente do time uma ferramenta própria (`mandar_para_colega`,
`ver_time`) por um servidor MCP local, ligado com `--mcp-config <arquivo em userData>` (nada
escrito em `~/.claude*`). Precisa de dependência nova e de decisão própria: **só depois** das
Fatias 28 a 31 aprovadas no aceite.

## Riscos conhecidos

- **Repasse de algo que não era trabalho:** se você só perguntou algo ao Construtor, o
  "terminou" dele também passa adiante. Por isso o freio de 3, a pausa por linha e o modo
  "Perguntar antes".
- **Cota:** um time no automático gasta cota de todos os quadros. As barras de uso (Fatia 20)
  mostram; o freio limita.
- **Mudar a pasta de um agente não leva a conversa** (o Claude guarda a conversa por pasta).
  Por isso "Abrir o colega numa cópia" cria um quadro novo em vez de mover o antigo.
