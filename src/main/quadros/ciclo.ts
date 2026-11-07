// Ciclo de vida de cada quadro num lugar so (R4.18). Todo servico que guarda algo por quadro se
// inscreve aqui UMA vez, dizendo em que momentos esquece o quadro. Antes, fechar, trocar de modelo
// e hibernar tinham cada um sua lista de `esquecer` a mao, e dois ja tinham ficado de fora (R3.17).

/**
 * `saiu`: o quadro saiu da lousa (removido, pasta fechada, trocou de conta).
 * `reabriu`: o terminal fecha para abrir de novo na mesma conversa (troca de modelo, D49).
 * `dormiu`: o agente hibernou (R3.13); acorda pelo clique na mesma conversa.
 */
export type Momento = 'saiu' | 'reabriu' | 'dormiu'

export const MOMENTOS: readonly Momento[] = ['saiu', 'reabriu', 'dormiu']

export interface Esquecivel {
  esquecer(quadroId: string): void
}

interface Inscrito {
  nome: string
  quando: ReadonlySet<Momento>
  alvo: Esquecivel
}

export class CicloDosQuadros {
  private readonly inscritos: Inscrito[] = []

  /** `aoFalhar`: um servico que lanca nao impede os outros de esquecer. */
  constructor(private readonly aoFalhar: (nome: string, quadroId: string, erro: unknown) => void) {}

  /** Na ordem da inscricao. Sem `quando`, o servico so esquece quando o quadro sai da lousa. */
  inscrever(nome: string, alvo: Esquecivel, quando: readonly Momento[] = ['saiu']): void {
    if (this.inscritos.some((i) => i.nome === nome)) throw new Error(`${nome} já está no ciclo dos quadros`)
    if (quando.length === 0) throw new Error(`${nome} precisa de pelo menos um momento`)
    this.inscritos.push({ nome, quando: new Set(quando), alvo })
  }

  aconteceu(momento: Momento, quadroId: string): void {
    for (const i of this.inscritos) {
      if (!i.quando.has(momento)) continue
      try {
        i.alvo.esquecer(quadroId)
      } catch (erro) {
        this.aoFalhar(i.nome, quadroId, erro)
      }
    }
  }

  /** Quem esquece neste momento, na ordem (testes e ARQUITETURA). */
  nomes(momento: Momento): string[] {
    return this.inscritos.filter((i) => i.quando.has(momento)).map((i) => i.nome)
  }
}
