// Abre, alimenta e fecha terminais no main, sem duplicar (T2.1, D8).
// O processo vive aqui; a tela (React, StrictMode, remontagem) so se inscreve nele.
import type { AvisoAgente } from '../../shared/model'
import { Historico } from './historico'
import { LeitorStatus, mesmoAviso, respostaEmTeclas } from './status'

export interface Descartavel {
  dispose(): void
}

export interface PtyLike {
  /** Processo do shell (o claude.exe roda como filho dele, T29.1). */
  readonly pid: number
  onData(cb: (dados: string) => void): Descartavel
  onExit(cb: (e: { exitCode: number }) => void): Descartavel
  write(dados: string): void
  resize(cols: number, rows: number): void
  kill(): void
}

export type Spawner = (
  arquivo: string,
  args: string[],
  opcoes: { cwd: string; env: Record<string, string>; cols: number; rows: number },
) => PtyLike

export interface PedidoAbrir {
  terminalId: string
  cwd: string
  env: Record<string, string>
  cols: number
  rows: number
  comandoInicial?: string // ex.: 'claude\r'
  shell?: { arquivo: string; args: string[] } // padrao: powershell.exe -NoLogo
  /** Responde a pergunta OSC 7501 e acompanha o estado do agente (T8.1). So terminais de quadro. */
  status?: boolean
}

export interface Ouvintes {
  aoDados(terminalId: string, dados: string): void
  aoSair(terminalId: string, codigo: number): void
  aoEstado?(terminalId: string, aviso: AvisoAgente): void
}

interface Terminal {
  pty: PtyLike
  historico: Historico
  saiu: boolean
  ouvintes: Descartavel[]
  leitor: LeitorStatus | null
  aviso: AvisoAgente | null
  /** O Claude ja desenhou a linha de status neste terminal (D48): pronto para receber. */
  pronto: boolean
}

const SHELL_PADRAO = { arquivo: 'powershell.exe', args: ['-NoLogo'] }
const limitar = (n: number): number => Math.min(500, Math.max(2, Math.floor(n)))

export class ServicoTerminais {
  private readonly terminais = new Map<string, Terminal>()

  constructor(
    private readonly spawn: Spawner,
    private readonly ouvintes: Ouvintes,
    // o bastante para a tela remontada mostrar uma sessao longa (T8.4: era 200 KB)
    private readonly limiteBuffer = 1_000_000,
  ) {}

  /** Id ja aberto: devolve o buffer e nao abre outro shell. Id que ja saiu: abre um novo. */
  abrir(p: PedidoAbrir): { bufferInicial: string; jaEstavaAberto: boolean } {
    const existente = this.terminais.get(p.terminalId)
    if (existente && !existente.saiu) return { bufferInicial: existente.historico.texto(), jaEstavaAberto: true }
    if (existente) this.fechar(p.terminalId)

    const shell = p.shell ?? SHELL_PADRAO
    const pty = this.spawn(shell.arquivo, shell.args, {
      cwd: p.cwd,
      env: p.env,
      cols: limitar(p.cols),
      rows: limitar(p.rows),
    })
    const terminal: Terminal = {
      pty,
      historico: new Historico(this.limiteBuffer),
      saiu: false,
      ouvintes: [],
      leitor: p.status ? new LeitorStatus() : null,
      aviso: null,
      pronto: false,
    }
    terminal.ouvintes.push(
      pty.onData((dados) => {
        terminal.historico.anotar(dados)
        this.ouvintes.aoDados(p.terminalId, dados)
        this.lerStatus(p.terminalId, terminal, dados)
      }),
      pty.onExit(({ exitCode }) => {
        terminal.saiu = true
        this.ouvintes.aoSair(p.terminalId, exitCode)
      }),
    )
    this.terminais.set(p.terminalId, terminal)
    if (p.comandoInicial) pty.write(p.comandoInicial)
    return { bufferInicial: '', jaEstavaAberto: false }
  }

  /** Pergunta do Claude: responde na hora (texto fixo). Estado novo: avisa uma vez. */
  private lerStatus(terminalId: string, t: Terminal, dados: string): void {
    if (!t.leitor) return
    const { perguntas, avisos } = t.leitor.ler(dados)
    if (perguntas > 0 && !t.saiu) t.pty.write(respostaEmTeclas())
    for (const aviso of avisos) {
      if (mesmoAviso(t.aviso, aviso)) continue
      t.aviso = aviso
      this.ouvintes.aoEstado?.(terminalId, aviso)
    }
  }

  /** Ultimo estado do agente (a tela que remonta comeca dele). */
  aviso(terminalId: string): AvisoAgente | null {
    return this.vivo(terminalId)?.aviso ?? null
  }

  /** A linha de status do agente rodou (D48). Devolve true so na primeira vez de cada terminal. */
  marcarPronto(terminalId: string): boolean {
    const t = this.vivo(terminalId)
    if (!t || t.pronto) return false
    t.pronto = true
    return true
  }

  pronto(terminalId: string): boolean {
    return this.vivo(terminalId)?.pronto ?? false
  }

  private vivo(terminalId: string): Terminal | undefined {
    const t = this.terminais.get(terminalId)
    return t && !t.saiu ? t : undefined
  }

  escrever(terminalId: string, dados: string): void {
    this.vivo(terminalId)?.pty.write(dados)
  }

  redimensionar(terminalId: string, cols: number, rows: number): void {
    this.vivo(terminalId)?.pty.resize(limitar(cols), limitar(rows))
  }

  /** kill() so se ainda esta vivo: em processo ja encerrado o node-pty gera "AttachConsole failed". */
  fechar(terminalId: string): void {
    const t = this.terminais.get(terminalId)
    if (!t) return
    if (!t.saiu) t.pty.kill()
    for (const o of t.ouvintes) o.dispose()
    this.terminais.delete(terminalId)
  }

  fecharTodos(): void {
    for (const id of [...this.terminais.keys()]) this.fechar(id)
  }

  estaAberto(terminalId: string): boolean {
    return this.vivo(terminalId) !== undefined
  }

  /** Processo do shell do terminal; null se fechado. */
  pid(terminalId: string): number | null {
    return this.vivo(terminalId)?.pty.pid ?? null
  }
}
