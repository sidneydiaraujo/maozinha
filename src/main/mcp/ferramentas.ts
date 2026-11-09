// As ferramentas do Mãozinha para o agente (A19, D56; paralelo e esperar, A21): o nome, o que o
// Claude le de cada uma e a regra que vai junto da do kanban. Puro.
import { z } from 'zod'
import type { ColegaPedido } from '../../shared/model'

export const NOME_SERVIDOR = 'maozinha'
export const CRIAR = 'criar_colegas'
export const ESPERAR = 'esperar_colegas'
/** Como o Claude chama cada uma (vai no `permissions.allow` do settings do agente). */
export const noClaude = (ferramenta: string): string => `mcp__${NOME_SERVIDOR}__${ferramenta}`
export const FERRAMENTAS_NO_CLAUDE = [noClaude(CRIAR), noClaude(ESPERAR)]
/** Colegas por pedido: um agente nao abre terminais em cascata. */
export const LIMITE_COLEGAS = 4

export type PedidoColega = ColegaPedido

export interface RespostaFerramenta {
  texto: string
  erro?: boolean
}

/** O que cada ferramenta faz para o quadro que chamou (quem cria e quem espera fica fora). */
export interface Ferramentas {
  criar(colegas: PedidoColega[], paralelo: boolean): Promise<RespostaFerramenta>
  esperar(): Promise<RespostaFerramenta>
}

export const ArgumentosCriar = z.object({
  colegas: z
    .array(z.object({ papel: z.string().trim().min(1).max(40), tarefa: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(LIMITE_COLEGAS),
  paralelo: z.boolean().optional(),
})

const DESCRICAO_CRIAR =
  'Cria colegas no Mãozinha: novos quadros de agente Claude, na mesma conta e ligados a você, e entrega uma ' +
  'tarefa a cada um. Nada nasce antes de o usuário responder numa janela do Mãozinha. Dois usos. ' +
  '(1) O usuário pediu colegas, agentes, quadros, terminais ou um time: paralelo falso; cada colega nasce numa ' +
  'cópia própria da pasta quando ela é git. ' +
  '(2) Você ia mandar trabalho para subagentes (ferramenta Agent/Task), por conta própria ou porque uma skill ou ' +
  'método do usuário manda (como os passos "execution: subagent" do Opensquad): chame ANTES, com paralelo ' +
  'verdadeiro e as mesmas tarefas. Se o usuário quiser ver, os colegas trabalham na MESMA pasta que você e você ' +
  `espera com ${ESPERAR}; se ele preferir o mesmo terminal, use os seus subagentes normalmente. ` +
  'Antes de abrir quadros novos, o Mãozinha reaproveita os colegas que você já criou e estão livres (terminaram a ' +
  'tarefa), com o papel e a tarefa novos; peça de novo em vez de deixar o time crescer. ' +
  `Até ${LIMITE_COLEGAS} por pedido. Escreva cada tarefa completa (persona, instruções e o caminho exato de cada ` +
  'arquivo de saída), porque o colega começa sem saber da sua conversa. Para quadros que o usuário vê, use esta ' +
  'ferramenta, nunca a Agent/Task.'

const DESCRICAO_ESPERAR =
  'Espera os colegas que o Mãozinha criou para você terminarem a tarefa (até 4 minutos por chamada) e diz como ' +
  'cada um está, com a última mensagem de quem terminou. Se algum ainda estiver trabalhando, chame de novo. Use ' +
  `depois de um ${CRIAR} aceito, no lugar de esperar subagentes.`

export const DEFINICOES = [
  {
    name: CRIAR,
    description: DESCRICAO_CRIAR,
    inputSchema: {
      type: 'object',
      properties: {
        colegas: {
          type: 'array',
          minItems: 1,
          maxItems: LIMITE_COLEGAS,
          items: {
            type: 'object',
            properties: {
              papel: { type: 'string', description: 'Nome do colega no time, ex.: Testador, Revisor (até 40 letras)' },
              tarefa: { type: 'string', description: 'O que ele deve fazer, com o contexto necessário' },
            },
            required: ['papel', 'tarefa'],
          },
        },
        paralelo: {
          type: 'boolean',
          description:
            'Verdadeiro quando estas tarefas iam para subagentes (Agent/Task): o usuário escolhe entre ver em quadros, na mesma pasta, ou seguir no mesmo terminal.',
        },
      },
      required: ['colegas'],
    },
  },
  { name: ESPERAR, description: DESCRICAO_ESPERAR, inputSchema: { type: 'object', properties: {} } },
] as const

/**
 * Vai junto da regra do kanban (`--append-system-prompt`) quando o agente tem as ferramentas: sem
 * ela, o Claude prefere os subagentes proprios, que trabalham escondidos fora do Mãozinha.
 */
export const REGRA_COLEGAS =
  `Você roda dentro do Mãozinha, uma lousa de quadros de terminal, e tem as ferramentas ${noClaude(CRIAR)} e ` +
  `${noClaude(ESPERAR)}. Quando o usuário pedir novos colegas, agentes, quadros, terminais ou um time, use ` +
  `${CRIAR}, nunca a ferramenta Agent/Task (os subagentes dela ficam escondidos fora do Mãozinha). ` +
  'Toda vez que for mandar trabalho para subagentes, por conta própria ou por uma skill ou método do usuário ' +
  `(como os passos "execution: subagent" do Opensquad), chame antes ${CRIAR} com paralelo verdadeiro e as ` +
  'tarefas completas: o Mãozinha pergunta ao usuário se ele quer ver os agentes trabalhando em quadros. Se ele ' +
  `aceitar, não rode esses subagentes: chame ${ESPERAR} até todos terminarem e siga o seu método como se os ` +
  'subagentes tivessem terminado (confira os arquivos de saída). Se ele preferir o mesmo terminal, rode os ' +
  'subagentes como sempre. Buscas rápidas suas que não são parte do trabalho (explorar o código, procurar um ' +
  'arquivo) seguem com Agent/Task sem perguntar. Você é o líder: além de distribuir, confira o trabalho de cada ' +
  'colega e junte tudo no fim. Colegas livres que você já criou são reaproveitados no próximo pedido.'
