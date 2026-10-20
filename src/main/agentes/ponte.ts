// Ponte da linha de status (T17.2, D24): cada agente Claude abre com `--settings` apontando
// para um arquivo da Lousa em <userData>\agentes. A linha de status desse arquivo grava o JSON
// do Claude em <quadroId>.json; um vigia so desta pasta (sem subpastas, sem stat, como na D17)
// le, passa pelo lerPainel e avisa a tela. Nada vai para as pastas das contas (~/.claude*).
import { join } from 'node:path'
import type { PainelAgente } from '../../shared/model'
import { lerPainel, textoDoArquivo } from './painel'

export const ESPERA_MS = 250
/** O quadroId vira nome de arquivo: so letras, numeros, - e _. */
const FORMATO_ID = /^[\w-]{1,80}$/
const SETTINGS = '.settings.json'

export interface DiscoPonte {
  criarPasta(pasta: string): void
  escrever(caminho: string, texto: string): void
  ler(caminho: string): Buffer
  apagar(caminho: string): void // arquivo que nao existe: nada acontece
  listar(pasta: string): string[]
  /** Avisa o nome do arquivo que mudou na pasta; devolve o parar. */
  vigiar(pasta: string, aoMudar: (nome: string) => void): () => void
}

export interface DepsPonte {
  pasta: string
  disco: DiscoPonte
  agora(): number
  emitir(quadroId: string, painel: PainelAgente): void
  /** setTimeout que devolve o cancelar (trocado no teste). */
  adiar(fn: () => void, ms: number): () => void
}

/**
 * A statusLine que vai no settings. No Windows o Claude a roda pelo Git Bash (T17.0): nada de
 * `cmd /d /c` e caminho com barra normal, que o bash, o cmd e o PowerShell entendem.
 */
export function linhaDeStatus(arquivoJson: string): { type: 'command'; command: string } {
  return { type: 'command', command: `findstr "^" > "${arquivoJson.replace(/\\/g, '/')}"` }
}

/** Entre aspas duplas, o bash ainda expande $ e `, e o cmd expande % e !: caminho assim fica sem painel. */
export const caminhoServe = (caminho: string): boolean => !/[$`"%!]/.test(caminho)

/** "q1.json" -> q1; "q1.settings.json" -> q1 so com `comSettings`; outro nome -> null. */
function idDoArquivo(nome: string, comSettings: boolean): string | null {
  const fim = comSettings && nome.endsWith(SETTINGS) ? SETTINGS : '.json'
  if (!nome.endsWith(fim)) return null
  const id = nome.slice(0, -fim.length)
  return FORMATO_ID.test(id) ? id : null
}

export class PonteAgentes {
  private readonly ultimos = new Map<string, PainelAgente>()
  private readonly relogios = new Map<string, () => void>()
  private pararVigia: (() => void) | null = null

  constructor(private readonly deps: DepsPonte) {}

  /** No inicio do app: cria a pasta, apaga o que sobrou de quadros que nao existem e vigia. */
  iniciar(quadrosExistentes: readonly string[]): void {
    const { disco, pasta } = this.deps
    disco.criarPasta(pasta)
    for (const nome of disco.listar(pasta)) {
      const id = idDoArquivo(nome, true)
      if (id && !quadrosExistentes.includes(id)) disco.apagar(join(pasta, nome))
    }
    this.pararVigia = disco.vigiar(pasta, (nome) => this.mudou(nome))
  }

  parar(): void {
    this.pararVigia?.()
    this.pararVigia = null
    for (const cancelar of this.relogios.values()) cancelar()
    this.relogios.clear()
  }

  /** Grava o settings do agente e devolve o caminho para o `--settings`; null = sem painel. */
  preparar(quadroId: string): string | null {
    const { disco, pasta } = this.deps
    if (!FORMATO_ID.test(quadroId) || !caminhoServe(pasta)) return null
    const settings = join(pasta, `${quadroId}${SETTINGS}`)
    disco.escrever(settings, JSON.stringify({ statusLine: linhaDeStatus(join(pasta, `${quadroId}.json`)) }))
    return settings
  }

  /** O ultimo painel do quadro, para a tela que remontou (como o aviso do agente). */
  ultimo(quadroId: string): PainelAgente | null {
    return this.ultimos.get(quadroId) ?? null
  }

  /** Quadro fechado (ou trocou de conta): apaga os dois arquivos e o ultimo painel. */
  esquecer(quadroId: string): void {
    if (!FORMATO_ID.test(quadroId)) return
    this.relogios.get(quadroId)?.()
    this.relogios.delete(quadroId)
    this.ultimos.delete(quadroId)
    this.deps.disco.apagar(join(this.deps.pasta, `${quadroId}.json`))
    this.deps.disco.apagar(join(this.deps.pasta, `${quadroId}${SETTINGS}`))
  }

  /** O Claude grava o arquivo em mais de um passo: le 250 ms depois do ultimo aviso. */
  private mudou(nome: string): void {
    if (nome.endsWith(SETTINGS)) return
    const id = idDoArquivo(nome, false)
    if (!id) return
    this.relogios.get(id)?.()
    this.relogios.set(
      id,
      this.deps.adiar(() => this.ler(id), ESPERA_MS),
    )
  }

  private ler(quadroId: string): void {
    this.relogios.delete(quadroId)
    let painel: PainelAgente | null
    try {
      painel = lerPainel(textoDoArquivo(this.deps.disco.ler(join(this.deps.pasta, `${quadroId}.json`))), this.deps.agora())
    } catch {
      return // apagado no meio do caminho: o proximo aviso traz de novo
    }
    if (!painel) return
    this.ultimos.set(quadroId, painel)
    this.deps.emitir(quadroId, painel)
  }
}
