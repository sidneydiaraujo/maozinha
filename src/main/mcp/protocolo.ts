// Ferramentas do Mãozinha para o agente (A19, D56): o Claude chama `criar_colegas` e
// `esperar_colegas` por MCP (HTTP, so neste PC) e o Mãozinha pergunta ao usuario antes de criar.
// Aqui so o protocolo: conferir o pedido HTTP e responder o JSON-RPC. As ferramentas estao em
// ferramentas.ts; quem cria, quem espera e quem pergunta fica fora. Puro.
import { ArgumentosCriar, CRIAR, DEFINICOES, ESPERAR, LIMITE_COLEGAS, NOME_SERVIDOR, type Ferramentas, type RespostaFerramenta } from './ferramentas'

export const VERSAO_PROTOCOLO = '2025-06-18'

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
export async function responderRpc(msg: unknown, ferramentas: Ferramentas, versaoApp: string): Promise<object | null> {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return falha(null, -32600, 'Pedido inválido')
  const { id, method, params } = msg as Rpc
  if (typeof method !== 'string') return falha(id, -32600, 'Pedido inválido')
  if (id === undefined || id === null) return null
  if (method === 'initialize') return resultado(id, inicio(params, versaoApp))
  if (method === 'ping') return resultado(id, {})
  if (method === 'tools/list') return resultado(id, { tools: DEFINICOES })
  if (method !== 'tools/call') return falha(id, -32601, `Método desconhecido: ${method}`)
  return chamarFerramenta(id, params, ferramentas)
}

/** A versao do protocolo que o cliente pediu (ou a nossa), as ferramentas e o nome. */
function inicio(params: unknown, versaoApp: string): object {
  const pedida = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion
  return {
    protocolVersion: typeof pedida === 'string' ? pedida : VERSAO_PROTOCOLO,
    capabilities: { tools: {} },
    serverInfo: { name: NOME_SERVIDOR, version: versaoApp },
  }
}

async function chamarFerramenta(id: unknown, params: unknown, ferramentas: Ferramentas): Promise<object> {
  const { name, arguments: args } = (params ?? {}) as { name?: unknown; arguments?: unknown }
  if (name === ESPERAR) return resultado(id, texto(await ferramentas.esperar()))
  if (name !== CRIAR) return falha(id, -32602, `Ferramenta desconhecida: ${String(name)}`)
  const lidos = ArgumentosCriar.safeParse(args)
  if (!lidos.success) {
    return resultado(id, texto({ texto: `Pedido recusado: de 1 a ${LIMITE_COLEGAS} colegas, cada um com papel (até 40 letras) e tarefa.`, erro: true }))
  }
  return resultado(id, texto(await ferramentas.criar(lidos.data.colegas, lidos.data.paralelo ?? false)))
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
