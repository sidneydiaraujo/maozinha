import { shell } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { linkPermitido } from '../arquivos/regras'
import type { ServicoArquivos } from '../arquivos/servico'
import type { VigiaArquivos } from '../arquivos/vigia'
import { handle } from '../ipc'
import type { ServicoRepos } from '../repos/servico'

// Caminho sempre relativo ao repo; o ServicoArquivos confere que fica dentro dele.
const Alvo = z.object({ repoId: z.string().min(1), relativo: z.string().max(1024) })
const Link = z.object({ url: z.string().min(1).max(2048) })

export function registrarHandlersArquivos(arquivos: ServicoArquivos, vigia: VigiaArquivos, repos: ServicoRepos): void {
  handle(IPC.arquivosListar, Alvo, ({ repoId, relativo }) => arquivos.listar(repoId, relativo))
  handle(IPC.arquivosAbrir, Alvo, ({ repoId, relativo }) => arquivos.abrir(repoId, relativo))
  handle(IPC.arquivosLer, Alvo, ({ repoId, relativo }) => arquivos.ler(repoId, relativo))
  handle(IPC.arquivosAbrirFora, Alvo, ({ repoId, relativo }) => arquivos.abrirFora(repoId, relativo))
  handle(IPC.arquivosMostrarNaPasta, Alvo, ({ repoId, relativo }) => arquivos.mostrarNaPasta(repoId, relativo))
  handle(IPC.arquivosAbrirLink, Link, async ({ url }) => {
    const permitido = linkPermitido(url)
    if (!permitido) throw new Error('Só links http ou https abrem no navegador')
    await shell.openExternal(permitido)
  })
  handle(IPC.arquivosVigiar, z.undefined(), () => vigia.sincronizar(repos.listar()))
}
