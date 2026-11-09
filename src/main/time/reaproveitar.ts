// O lider reaproveita os colegas que ja pediu (09/11): sem isto, cada criar_colegas abria quadros
// novos e o time crescia sem parar. Colega livre = pedido por este lider (linha `pedida`), agente,
// acordado, com o terminal aberto e sem tarefa. Paralelo trabalha na pasta do lider (A21), entao so
// serve quem esta nela. Puro (quem diz se o terminal esta livre vem de fora).
import type { Ligacao, Quadro } from '../../shared/model'

export interface DadosReaproveitar {
  quadros: Quadro[]
  ligacoes: Ligacao[]
}

/** Os colegas livres do lider, na ordem das linhas, cada um com a linha que o liga. */
export function colegasLivres(
  dados: DadosReaproveitar,
  liderId: string,
  paralelo: boolean,
  livre: (quadroId: string) => boolean,
): Array<{ quadro: Quadro; ligacao: Ligacao }> {
  const lider = dados.quadros.find((q) => q.id === liderId)
  if (!lider) return []
  const achados: Array<{ quadro: Quadro; ligacao: Ligacao }> = []
  for (const ligacao of dados.ligacoes) {
    if (ligacao.de !== liderId || !ligacao.pedida) continue
    const quadro = dados.quadros.find((q) => q.id === ligacao.para)
    if (!quadro || quadro.tipo !== 'agente' || quadro.dormindo) continue
    if (paralelo && quadro.repoId !== lider.repoId) continue
    if (livre(quadro.id)) achados.push({ quadro, ligacao })
  }
  return achados
}
