// O agente espera os colegas que pediu (A21): com o paralelismo visto em quadros, o metodo do
// usuario (o runner do Opensquad, por exemplo) so segue quando os colegas terminam, como seguiria
// com os subagentes. O colega terminou quando, depois de a tarefa ser digitada, trabalhou e parou.
// Puro (o relogio e o nome vem de fora).
import type { AvisoAgente } from '../../shared/model'
import { ESPERAR, type RespostaFerramenta } from '../mcp/ferramentas'
import type { TipoMensagem } from './apresentar'

/** Uma chamada de `esperar_colegas` segura o agente no maximo isto; depois ele chama de novo. */
export const ESPERA_COLEGAS_MS = 4 * 60 * 1000
/** A ultima mensagem de cada colega, cortada: e um resumo, o trabalho esta nos arquivos. */
const TAMANHO_MENSAGEM = 600

type Situacao = 'aguardando' | 'trabalhando' | 'esperando' | 'terminou' | 'fechado'

interface Colega {
  lider: string
  situacao: Situacao
  recebeu: boolean
  trabalhou: boolean
  mensagem?: string
}

export interface DepsEspera {
  nome(quadroId: string): string
  adiar(fn: () => void, ms: number): () => void
}

const TEXTO: Record<Exclude<Situacao, 'terminou'>, string> = {
  aguardando: 'ainda não recebeu a tarefa (o Mãozinha digita quando o quadro dele estiver pronto)',
  trabalhando: 'trabalhando',
  esperando: 'esperando o usuário responder no quadro dele',
  fechado: 'o quadro foi fechado antes de terminar',
}

export class EsperaDeColegas {
  private readonly colegas = new Map<string, Colega>()
  private readonly acordar = new Map<string, Set<() => void>>()

  constructor(private readonly deps: DepsEspera) {}

  /** Colegas que acabaram de nascer para `lider` (o grupo respondido inteiro ja saiu em `responder`). */
  registrar(lider: string, ids: string[]): void {
    for (const id of ids) this.colegas.set(id, { lider, situacao: 'aguardando', recebeu: false, trabalhou: false })
  }

  /** A fila digitou no colega: a tarefa entra como `repasse` (FilaMensagens.enfileirar). */
  aoDigitar(quadroId: string, tipo: TipoMensagem): void {
    const c = this.colegas.get(quadroId)
    if (!c || tipo !== 'repasse' || c.situacao === 'terminou') return
    c.recebeu = true
  }

  aoEstado(quadroId: string, aviso: AvisoAgente): void {
    const c = this.colegas.get(quadroId)
    if (!c?.recebeu || c.situacao === 'terminou' || c.situacao === 'fechado') return
    if (aviso.estado === 'trabalhando') {
      c.trabalhou = true
      c.situacao = 'trabalhando'
    } else if (aviso.estado === 'esperando') {
      c.situacao = 'esperando'
    } else if (c.trabalhou && (aviso.estado === 'terminou' || aviso.estado === 'parado')) {
      c.situacao = 'terminou'
      c.mensagem = aviso.mensagem
      this.avisar(c.lider)
    }
  }

  /** O quadro saiu da lousa: como colega, conta como fechado; como lider, o grupo dele acaba. */
  esquecer(quadroId: string): void {
    const c = this.colegas.get(quadroId)
    if (c) {
      if (c.situacao !== 'terminou') c.situacao = 'fechado'
      this.avisar(c.lider)
    }
    for (const [id, x] of this.colegas) if (x.lider === quadroId) this.colegas.delete(id)
    this.avisar(quadroId)
  }

  /** `esperar_colegas`: volta quando todos acabam ou no fim do prazo, com a situacao de cada um. */
  async esperar(lider: string): Promise<RespostaFerramenta> {
    if (this.grupo(lider).length === 0) return { texto: 'Nenhum colega criado para você está esperando resposta.' }
    if (!this.todosAcabaram(lider)) await this.ate(lider)
    return this.responder(lider)
  }

  private ate(lider: string): Promise<void> {
    return new Promise((resolve) => {
      const lista = this.acordar.get(lider) ?? new Set()
      this.acordar.set(lider, lista)
      let cancelar = (): void => {}
      const acorda = (): void => {
        if (!this.todosAcabaram(lider)) return
        fim()
      }
      const fim = (): void => {
        cancelar()
        lista.delete(acorda)
        resolve()
      }
      cancelar = this.deps.adiar(fim, ESPERA_COLEGAS_MS)
      lista.add(acorda)
    })
  }

  private avisar(lider: string): void {
    for (const acorda of [...(this.acordar.get(lider) ?? [])]) acorda()
  }

  private grupo(lider: string): Array<[string, Colega]> {
    return [...this.colegas].filter(([, c]) => c.lider === lider)
  }

  private todosAcabaram(lider: string): boolean {
    return this.grupo(lider).every(([, c]) => c.situacao === 'terminou' || c.situacao === 'fechado')
  }

  private responder(lider: string): RespostaFerramenta {
    const grupo = this.grupo(lider)
    const linhas = grupo.map(([id, c]) => `- ${this.deps.nome(id)}: ${descrever(c)}`)
    if (!this.todosAcabaram(lider)) {
      return { texto: [`Ainda tem colega trabalhando; chame ${ESPERAR} de novo para continuar esperando.`, ...linhas].join('\n') }
    }
    // respondido com todos acabados: a proxima espera e de um grupo novo
    for (const [id] of grupo) this.colegas.delete(id)
    return { texto: ['Todos os colegas acabaram. Confira os arquivos de saída e siga.', ...linhas].join('\n') }
  }
}

function descrever(c: Colega): string {
  if (c.situacao !== 'terminou') return TEXTO[c.situacao]
  const msg = c.mensagem?.trim()
  if (!msg) return 'terminou'
  return `terminou. Última mensagem: ${msg.length > TAMANHO_MENSAGEM ? `${msg.slice(0, TAMANHO_MENSAGEM)}…` : msg}`
}
