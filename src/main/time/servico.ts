// Linhas do time de agentes (T28.1, D39): o main valida com as regras puras e guarda no estado.
import type { EstadoSalvo, Ligacao, ModoLigacao, Perfil, PerfilId, Provedor, Quadro } from '../../shared/model'
import { ligacoesValidas, podeLigar, TEXTO_RECUSA, type DadosTime } from '../../shared/time'
import type { Armazem } from '../estado/armazem'

/** O que as regras do time leem do estado salvo (as linhas e o provedor de cada conta). */
export function dadosDoTime(
  estado: Pick<EstadoSalvo, 'quadros' | 'repos' | 'ligacoes'>,
  obter: (perfilId: PerfilId) => Perfil,
): DadosTime {
  const provedores = provedoresDos(estado.quadros, obter)
  return { quadros: estado.quadros, repos: estado.repos, ligacoes: estado.ligacoes ?? [], provedores }
}

/** Provedor de cada conta usada pelos quadros; conta que sumiu fica de fora (nao e agente Claude). */
export function provedoresDos(quadros: Quadro[], obter: (perfilId: PerfilId) => Perfil): Record<PerfilId, Provedor> {
  const provedores: Record<PerfilId, Provedor> = {}
  for (const { perfilId } of quadros) {
    if (perfilId in provedores) continue
    try {
      provedores[perfilId] = obter(perfilId).provedor
    } catch {
      // conta apagada: as linhas dela caem em ligacoesValidas
    }
  }
  return provedores
}

/** O estado sem as linhas que deixaram de valer (quadro fechado, conta trocada). */
export function semLinhasInvalidas(estado: EstadoSalvo, obter: (perfilId: PerfilId) => Perfil): EstadoSalvo {
  if (!estado.ligacoes?.length) return estado
  const dados = dadosDe(estado, obter)
  return { ...estado, ligacoes: ligacoesValidas(dados) }
}

function dadosDe(estado: EstadoSalvo, obter: (perfilId: PerfilId) => Perfil): DadosTime {
  return {
    quadros: estado.quadros,
    repos: estado.repos,
    ligacoes: estado.ligacoes ?? [],
    provedores: provedoresDos(estado.quadros, obter),
  }
}

export interface DepsServicoTime {
  armazem: Armazem
  perfis: { obter(perfilId: PerfilId): Perfil }
  novoId(): string
}

export class ServicoTime {
  constructor(private readonly deps: DepsServicoTime) {}

  /** Lanca com o motivo em portugues quando as regras recusam. Linha nova nasce no automatico (D39). */
  ligar(de: string, para: string): Ligacao {
    const estado = this.deps.armazem.carregar()
    const veredito = podeLigar(dadosDe(estado, (id) => this.deps.perfis.obter(id)), de, para)
    if (!veredito.ok) throw new Error(TEXTO_RECUSA[veredito.motivo])
    const ligacao: Ligacao = { id: this.deps.novoId(), de, para, modo: 'automatico' }
    this.deps.armazem.salvar({ ...estado, ligacoes: [...(estado.ligacoes ?? []), ligacao] })
    return ligacao
  }

  /** Lanca 'Linha não encontrada'. */
  ajustar(ligacaoId: string, mudanca: { modo?: ModoLigacao; pausada?: boolean }): Ligacao {
    const estado = this.deps.armazem.carregar()
    const atual = (estado.ligacoes ?? []).find((l) => l.id === ligacaoId)
    if (!atual) throw new Error('Linha não encontrada')
    const nova: Ligacao = { ...atual, ...mudanca }
    if (!nova.pausada) delete nova.pausada
    this.deps.armazem.salvar({
      ...estado,
      ligacoes: (estado.ligacoes ?? []).map((l) => (l.id === ligacaoId ? nova : l)),
    })
    return nova
  }

  /** Remover uma linha que ja nao existe nao e erro. Os agentes nao sao tocados. */
  desligar(ligacaoId: string): void {
    const estado = this.deps.armazem.carregar()
    this.deps.armazem.salvar({ ...estado, ligacoes: (estado.ligacoes ?? []).filter((l) => l.id !== ligacaoId) })
  }
}
