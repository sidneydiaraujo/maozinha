import { describe, expect, it } from 'vitest'
import { conferirPedido, FERRAMENTA, responderRpc, type PedidoColega } from './protocolo'

const pedidos: PedidoColega[][] = []
const chamar = async (c: PedidoColega[]) => {
  pedidos.push(c)
  return { texto: 'criados' }
}
const rpc = (method: string, params?: unknown, id: unknown = 1) => responderRpc({ jsonrpc: '2.0', id, method, params }, chamar, '0.4.6')

describe('responderRpc (A19)', () => {
  it('initialize devolve a versao pedida, a ferramenta e o nome; notificacao nao tem resposta', async () => {
    expect(await rpc('initialize', { protocolVersion: '2025-03-26' })).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'maozinha', version: '0.4.6' } },
    })
    expect(await responderRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, chamar, 'x')).toBeNull()
  })

  it('tools/list: so criar_colegas, com no maximo 4', async () => {
    const r = (await rpc('tools/list')) as { result: { tools: Array<{ name: string; inputSchema: { properties: { colegas: { maxItems: number } } } }> } }
    expect(r.result.tools.map((t) => t.name)).toEqual([FERRAMENTA])
    expect(r.result.tools[0]?.inputSchema.properties.colegas.maxItems).toBe(4)
  })

  it('tools/call valido chama com papel e tarefa limpos e devolve o texto', async () => {
    pedidos.length = 0
    const r = await rpc('tools/call', { name: FERRAMENTA, arguments: { colegas: [{ papel: ' Testador ', tarefa: 'testar o login' }] } })
    expect(pedidos).toEqual([[{ papel: 'Testador', tarefa: 'testar o login' }]])
    expect(r).toEqual({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: 'criados' }], isError: false } })
  })

  it('mais de 4, papel vazio ou ferramenta desconhecida: recusa sem chamar', async () => {
    pedidos.length = 0
    const cinco = Array.from({ length: 5 }, () => ({ papel: 'a', tarefa: 'b' }))
    const r = (await rpc('tools/call', { name: FERRAMENTA, arguments: { colegas: cinco } })) as { result: { isError: boolean } }
    expect(r.result.isError).toBe(true)
    await rpc('tools/call', { name: FERRAMENTA, arguments: { colegas: [{ papel: '  ', tarefa: 'b' }] } })
    expect(await rpc('tools/call', { name: 'apagar_tudo', arguments: {} })).toMatchObject({ error: { code: -32602 } })
    expect(await rpc('resources/list')).toMatchObject({ error: { code: -32601 } })
    expect(pedidos).toEqual([])
  })

  it('lixo ou lote: pedido invalido', async () => {
    expect(await responderRpc([{ id: 1, method: 'ping' }], chamar, 'x')).toMatchObject({ error: { code: -32600 } })
    expect(await responderRpc('oi', chamar, 'x')).toMatchObject({ error: { code: -32600 } })
  })
})

describe('conferirPedido', () => {
  const CHAVE = 'a'.repeat(64)
  const dono = (c: string) => (c === CHAVE ? 'q1' : undefined)
  const base = { metodo: 'POST', caminho: '/mcp', host: '127.0.0.1:5000', origem: undefined, autorizacao: `Bearer ${CHAVE}` }

  it('POST /mcp do proprio PC com a chave do quadro: o quadro', () => {
    expect(conferirPedido(base, 5000, dono)).toEqual({ quadroId: 'q1' })
  })

  it('pagina da web (Origin), outro Host, sem chave ou chave de ninguem: recusa', () => {
    expect(conferirPedido({ ...base, origem: 'https://site.com' }, 5000, dono)).toEqual({ status: 403 })
    expect(conferirPedido({ ...base, host: 'malicioso.com:5000' }, 5000, dono)).toEqual({ status: 403 })
    expect(conferirPedido({ ...base, autorizacao: undefined }, 5000, dono)).toEqual({ status: 401 })
    expect(conferirPedido({ ...base, autorizacao: `Bearer ${'b'.repeat(64)}` }, 5000, dono)).toEqual({ status: 401 })
  })

  it('GET (fluxo SSE) e outro caminho: 405 e 404', () => {
    expect(conferirPedido({ ...base, metodo: 'GET' }, 5000, dono)).toEqual({ status: 405 })
    expect(conferirPedido({ ...base, caminho: '/' }, 5000, dono)).toEqual({ status: 404 })
  })
})
