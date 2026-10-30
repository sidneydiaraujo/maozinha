// Servidor MCP do Mãozinha (A19, D56): HTTP so em 127.0.0.1, porta escolhida pelo Windows, uma
// chave por quadro. O agente recebe a url e a chave num arquivo em <userData>\agentes (o
// `--mcp-config`); nada vai para as pastas das contas. Quem pode falar: protocolo.conferirPedido.
import { randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { log } from '../log'
import { conferirPedido, NOME_SERVIDOR, responderRpc, type PedidoColega, type RespostaFerramenta } from './protocolo'

/** Pedido maior que isto nao e de criar colegas. */
const LIMITE_BYTES = 64 * 1024

export interface DepsServidorMcp {
  versao: string
  chamar(quadroId: string, colegas: PedidoColega[]): Promise<RespostaFerramenta>
}

export class ServidorMcp {
  private servidor: Server | null = null
  private porta = 0
  private readonly chaves = new Map<string, string>() // chave -> quadroId

  constructor(private readonly deps: DepsServidorMcp) {}

  iniciar(): Promise<void> {
    return new Promise((resolve, reject) => {
      const s = createServer((req, res) => void this.atender(req, res))
      s.on('error', reject)
      s.listen(0, '127.0.0.1', () => {
        this.porta = (s.address() as AddressInfo).port
        this.servidor = s
        log('info', `servidor do Mãozinha para os agentes em 127.0.0.1:${this.porta}`)
        resolve()
      })
    })
  }

  parar(): void {
    this.servidor?.close()
    this.servidor = null
    this.porta = 0
  }

  /** O conteudo do `--mcp-config` do quadro (a chave e a mesma enquanto o app roda); null = sem servidor. */
  configDo(quadroId: string): object | null {
    if (!this.porta) return null
    let chave = [...this.chaves].find(([, id]) => id === quadroId)?.[0]
    if (!chave) {
      chave = randomBytes(32).toString('hex')
      this.chaves.set(chave, quadroId)
    }
    const servidor = { type: 'http', url: `http://127.0.0.1:${this.porta}/mcp`, headers: { Authorization: `Bearer ${chave}` } }
    return { mcpServers: { [NOME_SERVIDOR]: servidor } }
  }

  /** O quadro saiu da lousa: a chave dele nao vale mais. */
  esquecer(quadroId: string): void {
    for (const [chave, id] of this.chaves) if (id === quadroId) this.chaves.delete(chave)
  }

  private async atender(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const conferido = conferirPedido(
      {
        metodo: req.method ?? '',
        caminho: (req.url ?? '').split('?')[0] ?? '',
        host: req.headers.host,
        origem: req.headers.origin,
        autorizacao: req.headers.authorization,
      },
      this.porta,
      (chave) => this.chaves.get(chave),
    )
    if ('status' in conferido) return void res.writeHead(conferido.status).end()
    let corpo: unknown
    try {
      corpo = JSON.parse(await lerCorpo(req))
    } catch {
      return void res.writeHead(400).end()
    }
    const resposta = await responderRpc(corpo, (c) => this.deps.chamar(conferido.quadroId, c), this.deps.versao)
    if (resposta === null) return void res.writeHead(202).end()
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(resposta))
  }
}

function lerCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = []
    let total = 0
    req.on('data', (b: Buffer) => {
      total += b.length
      if (total > LIMITE_BYTES) {
        reject(new Error('grande demais'))
        req.destroy()
      } else partes.push(b)
    })
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')))
    req.on('error', reject)
  })
}
