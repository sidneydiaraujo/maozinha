import { afterEach, describe, expect, it } from 'vitest'
import type { PedidoColega } from './ferramentas'
import { ServidorMcp } from './servidor'

let servidor: ServidorMcp | null = null
afterEach(() => servidor?.parar())

/** Liga o servidor de verdade (127.0.0.1) e devolve a url e o cabecalho do quadro q1. */
async function ligar(chamadas: Array<{ quadroId: string; colegas: PedidoColega[] }> = []) {
  servidor = new ServidorMcp({
    versao: '0.4.6',
    ferramentas: (quadroId) => ({
      criar: async (colegas) => {
        chamadas.push({ quadroId, colegas })
        return { texto: 'O usuário aceitou' }
      },
      esperar: async () => ({ texto: 'Todos terminaram' }),
    }),
  })
  await servidor.iniciar()
  const config = servidor.configDo('q1') as { mcpServers: { maozinha: { url: string; headers: { Authorization: string } } } }
  return config.mcpServers.maozinha
}

const postar = (url: string, corpo: unknown, cabecalhos: Record<string, string>) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhos }, body: JSON.stringify(corpo) })

describe('ServidorMcp por HTTP (A19)', () => {
  it('o caminho do Claude: initialize, notificacao, tools/list e tools/call do quadro da chave', async () => {
    const chamadas: Array<{ quadroId: string; colegas: PedidoColega[] }> = []
    const { url, headers } = await ligar(chamadas)
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/mcp$/)

    const inicio = await postar(url, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, headers)
    expect(inicio.status).toBe(200)
    expect(((await inicio.json()) as { result: { serverInfo: { name: string } } }).result.serverInfo.name).toBe('maozinha')

    expect((await postar(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, headers)).status).toBe(202)

    const lista = (await (await postar(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, headers)).json()) as {
      result: { tools: Array<{ name: string }> }
    }
    expect(lista.result.tools.map((t) => t.name)).toEqual(['criar_colegas', 'esperar_colegas'])

    const colegas = [{ papel: 'Testador', tarefa: 'testar o login' }]
    const chamada = await postar(url, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'criar_colegas', arguments: { colegas } } }, headers)
    expect(((await chamada.json()) as { result: { content: Array<{ text: string }> } }).result.content[0]?.text).toBe('O usuário aceitou')
    expect(chamadas).toEqual([{ quadroId: 'q1', colegas }])
  })

  it('sem a chave, com chave de quadro esquecido, de pagina da web ou GET: recusa e nao chama', async () => {
    const chamadas: Array<{ quadroId: string; colegas: PedidoColega[] }> = []
    const { url, headers } = await ligar(chamadas)
    const ping = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'criar_colegas', arguments: { colegas: [{ papel: 'a', tarefa: 'b' }] } } }
    expect((await postar(url, ping, {})).status).toBe(401)
    expect((await postar(url, ping, { ...headers, Origin: 'https://site.com' })).status).toBe(403)
    expect((await fetch(url, { headers })).status).toBe(405)
    servidor?.esquecer('q1')
    expect((await postar(url, ping, headers)).status).toBe(401)
    expect(chamadas).toEqual([])
  })

  it('a chave do quadro e a mesma enquanto o app roda; outro quadro, outra chave', async () => {
    const { headers } = await ligar()
    const de = (id: string) => (servidor?.configDo(id) as { mcpServers: { maozinha: { headers: { Authorization: string } } } }).mcpServers.maozinha.headers.Authorization
    expect(de('q1')).toBe(headers.Authorization)
    expect(de('q2')).not.toBe(headers.Authorization)
  })
})
