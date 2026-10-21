// Juntar o time (T31.1, D39): as copias do time voltam para a pasta original na ordem de entrega
// (quem entrega antes), uma por vez, com o mesmo Juntar de cada copia (D19, D30). Para no primeiro
// erro; copia com alteracao sem commit fica de fora e a proxima segue.
import type { Repo, ResultadoJuntarTime } from '../../shared/model'
import { copiasDoTime, type DadosTime } from '../../shared/time'
import type { RodarGit } from '../copias/git'
import { juntarCopia, resumirCopia } from '../copias/juntar'

export interface DepsJuntarTime {
  git: RodarGit
  dados(): DadosTime
  obterRepo(repoId: string): Repo
  /** Os de fora (para ser trocado nos testes). */
  resumir?: typeof resumirCopia
  juntar?: typeof juntarCopia
}

const apelidoDe = (repo: Repo): string => repo.copia?.apelido ?? repo.nome

/** `quadroId` = qualquer quadro do time (a tela manda o `de` da linha). */
export async function juntarTime(deps: DepsJuntarTime, quadroId: string): Promise<ResultadoJuntarTime> {
  const resumir = deps.resumir ?? resumirCopia
  const juntar = deps.juntar ?? juntarCopia
  const copias = copiasDoTime(deps.dados(), quadroId).map((c) => ({ ...c, repo: deps.obterRepo(c.repoId) }))
  if (copias.length === 0) throw new Error('Ninguém deste time trabalha numa cópia separada: não há o que juntar')
  const r: ResultadoJuntarTime = { juntadas: [], semNovidade: [], deFora: [], parou: null, faltam: [] }
  for (const [i, c] of copias.entries()) {
    const apelido = apelidoDe(c.repo)
    let branch = c.repo.copia?.branch ?? ''
    let branchAlvo = ''
    try {
      const resumo = await resumir(deps.git, c.repo)
      branch = resumo.branch
      branchAlvo = resumo.branchAlvo
      if (resumo.pendente) {
        r.deFora.push(apelido)
        continue
      }
      if (resumo.commits === 0) {
        r.semNovidade.push(apelido)
        continue
      }
      r.juntadas.push({ apelido, branchAlvo: (await juntar(deps.git, c.repo)).branchAlvo })
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e)
      r.parou = { quadroId: c.quadroId, apelido, branch, branchAlvo, erro }
      r.faltam = copias.slice(i + 1).map((x) => apelidoDe(x.repo))
      break
    }
  }
  return r
}
