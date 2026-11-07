import { BrowserWindow, dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import { temKanban } from '../kanban/disco'
import { FichasDePasta } from '../repos/fichas'
import { pastaAmpla } from '../repos/pastaAmpla'
import type { ServicoRepos } from '../repos/servico'

// R2.11: a tela manda a ficha que o seletor deu, nunca um caminho
const Adicionar = z.object({ ficha: z.string().min(1), perfilId: z.string().min(1) })
const Remover = z.object({ repoId: z.string().min(1) })

export function registrarHandlersRepos(repos: ServicoRepos): void {
  const fichas = new FichasDePasta(randomUUID)
  handle(IPC.reposEscolherPasta, z.undefined(), async () => {
    const opcoes = { title: 'Escolha a pasta do repositório', properties: ['openDirectory' as const] }
    const janela = BrowserWindow.getFocusedWindow()
    const r = janela ? await dialog.showOpenDialog(janela, opcoes) : await dialog.showOpenDialog(opcoes)
    const caminho = r.filePaths[0]
    if (r.canceled || !caminho) return null
    return { ficha: fichas.emitir(caminho), caminho, sugestaoPerfilId: repos.sugerir(caminho) }
  })
  handle(IPC.reposAdicionar, Adicionar, ({ ficha, perfilId }) => repos.adicionar(fichas.usar(ficha), perfilId))
  handle(IPC.reposRemover, Remover, ({ repoId }) => repos.remover(repoId))
  // a caixa "Kanban do projeto" ja vem marcada quando o projeto tem um (A22); a tela so manda o id
  handle(IPC.reposTemKanban, Remover, ({ repoId }) => temKanban(repos.obter(repoId), (id) => repos.obter(id)))
  // R2.10: o Mãozinha avisa (nao bloqueia) antes de abrir um agente na pasta do usuario
  handle(IPC.reposPastaAmpla, Remover, ({ repoId }) => pastaAmpla(repos.obter(repoId).caminho, homedir()))
}
