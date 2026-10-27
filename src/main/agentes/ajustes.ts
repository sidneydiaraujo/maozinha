// Trocar modelo e esforco de um agente aberto (T19.1, D25, D47). O `/model` e o `/effort` do
// Claude gravam a escolha como padrao da CONTA (o VSCode e os outros quadros dela mudariam
// junto); por isso a Lousa reabre o agente, ja com `--model`/`--effort` do quadro salvo, na
// mesma conversa (`--resume`). So reabre com ele parado; trabalhando, espera ele parar.
import { podeDigitar } from '../../shared/compactar'
import type { AjusteAgente, AvisoAgente, QuandoAjusta } from '../../shared/model'

export interface DepsAjustes {
  aberto(terminalId: string): boolean
  aviso(terminalId: string): AvisoAgente | null
  /** O Claude ja desenhou a linha de status neste terminal (D47). */
  pronto(terminalId: string): boolean
  /** O claude.exe ainda roda no terminal? (ele nao avisa quando sai; terminais/filhos.ts) */
  temClaude(terminalId: string): Promise<boolean>
}

export interface DepsFilaAjustes extends DepsAjustes {
  /** Fecha o terminal do quadro e pede a tela para abrir de novo (o comando le o quadro salvo). */
  reabrir(quadroId: string): void
}

export class FilaAjustes {
  /** Quadros com troca esperando o agente parar. O valor novo ja esta salvo no quadro. */
  private readonly pendentes = new Set<string>()

  constructor(private readonly deps: DepsFilaAjustes) {}

  /** O quadro ja guardou a mudanca; aqui so se decide quando o agente reabre com ela. */
  async pedir(quadroId: string, _mudanca: AjusteAgente): Promise<QuandoAjusta> {
    if (!this.deps.aberto(quadroId)) {
      this.pendentes.delete(quadroId)
      return 'naAbertura'
    }
    if (await this.podeReabrir(quadroId)) {
      this.reabrir(quadroId)
      return 'agora'
    }
    this.pendentes.add(quadroId)
    return 'quandoParar'
  }

  /** Chamado a cada aviso do OSC 7501: o agente parou e tinha troca esperando. */
  aoEstado(quadroId: string, aviso: AvisoAgente): Promise<void> {
    if (!this.pendentes.has(quadroId) || !podeDigitar(aviso.estado, false)) return Promise.resolve()
    return this.tentar(quadroId)
  }

  /** O Claude acabou de ficar pronto (primeira linha de status): troca pedida na abertura vale agora. */
  aoPronto(quadroId: string): Promise<void> {
    return this.pendentes.has(quadroId) ? this.tentar(quadroId) : Promise.resolve()
  }

  /** O terminal do quadro fechou: a troca ja vai no comando da proxima abertura. */
  esquecer(quadroId: string): void {
    this.pendentes.delete(quadroId)
  }

  pendente(quadroId: string): boolean {
    return this.pendentes.has(quadroId)
  }

  private async tentar(quadroId: string): Promise<void> {
    if (await this.podeReabrir(quadroId)) this.reabrir(quadroId)
  }

  /**
   * Parado (ou pronto e ainda sem estado): reabre. Sem claude.exe (saiu, ficou o PowerShell):
   * reabre tambem, e o agente volta com o modelo novo. Trabalhando, esperando voce ou na
   * pergunta de confianca da pasta: nao.
   */
  private async podeReabrir(quadroId: string): Promise<boolean> {
    if (!(await this.deps.temClaude(quadroId))) return true
    return podeDigitar(this.deps.aviso(quadroId)?.estado, this.deps.pronto(quadroId))
  }

  private reabrir(quadroId: string): void {
    this.pendentes.delete(quadroId)
    this.deps.reabrir(quadroId)
  }
}
