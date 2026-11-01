import { BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import { temKanban } from '../kanban/disco'
import type { ServicoRepos } from '../repos/servico'

const Adicionar = z.object({ caminho: z.string().min(1), perfilId: z.string().min(1) })
const Remover = z.object({ repoId: z.string().min(1) })

export function registrarHandlersRepos(repos: ServicoRepos): void {
  handle(IPC.reposEscolherPasta, z.undefined(), async () => {
    const opcoes = { title: 'Escolha a pasta do repositório', properties: ['openDirectory' as const] }
    const janela = BrowserWindow.getFocusedWindow()
    const r = janela ? await dialog.showOpenDialog(janela, opcoes) : await dialog.showOpenDialog(opcoes)
    const caminho = r.filePaths[0]
    if (r.canceled || !caminho) return null
    return { caminho, sugestaoPerfilId: repos.sugerir(caminho) }
  })
  handle(IPC.reposAdicionar, Adicionar, ({ caminho, perfilId }) => repos.adicionar(caminho, perfilId))
  handle(IPC.reposRemover, Remover, ({ repoId }) => repos.remover(repoId))
  // a caixa "Kanban do projeto" ja vem marcada quando o projeto tem um (A22); a tela so manda o id
  handle(IPC.reposTemKanban, Remover, ({ repoId }) => temKanban(repos.obter(repoId), (id) => repos.obter(id)))
}
