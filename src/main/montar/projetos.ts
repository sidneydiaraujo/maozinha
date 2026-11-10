// O projeto de cada agente (D65): o agente aberto numa pasta que nao e projeto (o quadro livre, a
// pasta do usuario) toca arquivos de um projeto; o projeto entra na lista de pastas, o quadro guarda
// o `projeto` e a tela marca a pasta na lateral. O terminal segue na pasta dele: a conversa do
// Claude e guardada pela pasta onde ele abriu, e mudar o cwd perderia o --resume.
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { IPC } from '../../shared/ipc'
import { raizDoProjeto, trocaProjeto } from '../agentes/projeto'
import { ehProjeto } from '../kanban/projeto'
import { log } from '../log'
import { pastaAmpla } from '../repos/pastaAmpla'
import type { Base } from './base'
import { enviarParaJanelas } from './janelas'

export interface ProjetosDosAgentes {
  /** `forte` = salvou; ler ou procurar so vale para o primeiro projeto. */
  aoTocar(quadroId: string, caminho: string, forte: boolean): void
}

export function montarProjetos(b: Base): ProjetosDosAgentes {
  const casa = homedir()
  const ampla = (pasta: string): boolean => pastaAmpla(pasta, casa)
  const aoTocar = (quadroId: string, caminho: string, forte: boolean): void => {
    try {
      const quadro = b.quadros.obter(quadroId)
      if (quadro.tipo !== 'agente') return
      const pasta = b.repos.obter(quadro.repoId).caminho
      // a pasta do quadro ja e o projeto; a do usuario nunca e, nem com um package.json solto nela
      if (!ampla(pasta) && ehProjeto(pasta, existsSync)) return
      const raiz = raizDoProjeto(caminho, existsSync, ampla)
      if (raiz === null) return
      const atual = quadro.projeto ? b.repos.listar().find((r) => r.id === quadro.projeto)?.caminho ?? null : null
      if (!trocaProjeto(atual, raiz, forte)) return
      const repo = b.repos.adicionar(raiz, quadro.perfilId)
      const mudou = b.quadros.definirProjeto(quadroId, repo.id)
      log('info', `agente ${quadroId} mexe no projeto ${repo.nome}`)
      enviarParaJanelas(IPC.quadrosProjeto, { quadro: mudou, repo })
    } catch {
      // o quadro ou a pasta sairam da lousa, ou a pasta do projeto sumiu: fica como estava
    }
  }
  return { aoTocar }
}
