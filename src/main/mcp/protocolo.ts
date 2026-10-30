// Ferramenta do Mãozinha para o agente (A19, D56): o Claude chama `criar_colegas` por MCP (HTTP,
// so neste PC) e o Mãozinha pergunta ao usuario antes de criar. Aqui so o protocolo: conferir o
// pedido HTTP e responder o JSON-RPC. Quem cria e quem pergunta fica fora. Puro.
import { z } from 'zod'
import type { ColegaPedido } from '../../shared/model'

export const NOME_SERVIDOR = 'maozinha'
export const FERRAMENTA = 'criar_colegas'
/** Como o Claude chama a ferramenta (vai no `permissions.allow` do settings do agente). */
export const FERRAMENTA_NO_CLAUDE = `mcp__${NOME_SERVIDOR}__${FERRAMENTA}`
/** Colegas por pedido: um agente nao abre terminais em cascata. */
export const LIMITE_COLEGAS = 4
export const VERSAO_PROTOCOLO = '2025-06-18'

export type PedidoColega = ColegaPedido

export interface RespostaFerramenta {
  texto: string
  erro?: boolean
}

export type ChamarFerramenta = (colegas: PedidoColega[]) => Promise<RespostaFerramenta>

const Argumentos = z.object({
  colegas: z
    .array(z.object({ papel: z.string().trim().min(1).max(40), tarefa: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(LIMITE_COLEGAS),
})

const DESCRICAO =
  'Cria colegas no Mãozinha: novos quadros de agente Claude, na mesma conta e ligados a você, cada um numa ' +
  'cópia própria da pasta quando ela é git, e entrega uma tarefa a cada um. Use só quando o usuário pedir ' +
  `para montar um time ou criar novos agentes/terminais. Até ${LIMITE_COLEGAS} por pedido. O usuário confirma ` +
  'na tela antes de criar; a resposta diz se ele aceitou. Escreva cada tarefa completa, com o contexto que o ' +
  'colega precisa, porque ele começa sem saber da sua conversa.'

export const DEFINICAO_FERRAMENTA = {
  name: FERRAMENTA,
  description: DESCRICAO,
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
    },
    required: ['colegas'],
  },
} as const

interface Rpc {
  jsonrpc?: unknown
  id?: unknown
  method?: unknown
  params?: unknown
}

const resultado = (id: unknown, result: unknown): object => ({ jsonrpc: '2.0', id, result })
const falha = (id: unknown, code: number, message: string): object => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })
const texto = (r: RespostaFerramenta): object => ({ content: [{ type: 'text', text: r.texto }], isError: !!r.erro })

/** Resposta ao JSON-RPC do cliente MCP; null = notificacao (o HTTP responde 202 sem corpo). */
export async function responderRpc(msg: unknown, chamar: ChamarFerramenta, versaoApp: string): Promise<object | null> {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return falha(null, -32600, 'Pedido inválido')
  const { id, method, params } = msg as Rpc
  if (typeof method !== 'string') return falha(id, -32600, 'Pedido inválido')
  if (id === undefined || id === null) return null
  if (method === 'initialize') return resultado(id, inicio(params, versaoApp))
  if (method === 'ping') return resultado(id, {})
  if (method === 'tools/list') return resultado(id, { tools: [DEFINICAO_FERRAMENTA] })
  if (method !== 'tools/call') return falha(id, -32601, `Método desconhecido: ${method}`)
  return chamarFerramenta(id, params, chamar)
}

/** A versao do protocolo que o cliente pediu (ou a nossa), a ferramenta e o nome. */
function inicio(params: unknown, versaoApp: string): object {
  const pedida = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion
  return {
    protocolVersion: typeof pedida === 'string' ? pedida : VERSAO_PROTOCOLO,
    capabilities: { tools: {} },
    serverInfo: { name: NOME_SERVIDOR, version: versaoApp },
  }
}

async function chamarFerramenta(id: unknown, params: unknown, chamar: ChamarFerramenta): Promise<object> {
  const { name, arguments: args } = (params ?? {}) as { name?: unknown; arguments?: unknown }
  if (name !== FERRAMENTA) return falha(id, -32602, `Ferramenta desconhecida: ${String(name)}`)
  const lidos = Argumentos.safeParse(args)
  if (!lidos.success) {
    return resultado(id, texto({ texto: `Pedido recusado: de 1 a ${LIMITE_COLEGAS} colegas, cada um com papel (até 40 letras) e tarefa.`, erro: true }))
  }
  return resultado(id, texto(await chamar(lidos.data.colegas)))
}

export interface PedidoHttp {
  metodo: string
  caminho: string
  host: string | undefined
  origem: string | undefined
  autorizacao: string | undefined
}

/**
 * Quem pode falar com o servidor: so POST /mcp, Host do proprio PC (contra DNS rebinding), sem
 * Origin (nenhuma pagina da web) e com a chave de um quadro. Devolve o quadro ou o status HTTP.
 */
export function conferirPedido(p: PedidoHttp, porta: number, quadroDaChave: (chave: string) => string | undefined): { quadroId: string } | { status: number } {
  if (p.caminho !== '/mcp') return { status: 404 }
  if (p.metodo !== 'POST') return { status: 405 }
  if (p.host !== `127.0.0.1:${porta}`) return { status: 403 }
  if (p.origem !== undefined) return { status: 403 }
  const chave = /^Bearer ([0-9a-f]{64})$/.exec(p.autorizacao ?? '')?.[1]
  const quadroId = chave ? quadroDaChave(chave) : undefined
  return quadroId ? { quadroId } : { status: 401 }
}
