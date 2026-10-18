import { app } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import { montarAmbiente } from '../perfis/ambiente'
import type { ServicoPerfis } from '../perfis/servico'
import type { ServicoQuadros } from '../quadros/servico'
import type { ServicoRepos } from '../repos/servico'
import { acharSessao } from '../quadros/sessoes'
import { resolverAlvo } from '../terminais/alvo'
import type { ServicoTerminais } from '../terminais/servico'

const Tamanho = { cols: z.number().int().min(2).max(500), rows: z.number().int().min(2).max(500) }
const Alvo = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('login'), perfilId: z.string().min(1) }),
  z.object({ tipo: z.literal('quadro'), quadroId: z.string().min(1) }),
])
const Abrir = z.object({ alvo: Alvo, ...Tamanho })
const Escrever = z.object({ terminalId: z.string().min(1), dados: z.string().max(1_000_000) })
const Redimensionar = z.object({ terminalId: z.string().min(1), ...Tamanho })

export function registrarHandlersTerminais(
  terminais: ServicoTerminais,
  perfis: ServicoPerfis,
  quadros: ServicoQuadros,
  repos: ServicoRepos,
): void {
  const home = app.getPath('home')
  handle(IPC.terminaisAbrir, Abrir, ({ alvo, cols, rows }) => {
    const r = resolverAlvo(alvo, {
      home,
      obterPerfil: (id) => perfis.obter(id),
      obterQuadro: (id) => quadros.comSessao(id),
      obterRepo: (id) => repos.obter(id),
      existeSessao: (configDir, sessaoId) => acharSessao(configDir, sessaoId) !== null,
    })
    const { bufferInicial } = terminais.abrir({
      terminalId: r.terminalId,
      cwd: r.cwd,
      env: montarAmbiente(r.perfil, process.env),
      cols,
      rows,
      comandoInicial: r.comandoInicial,
      shell: r.shell,
      status: alvo.tipo === 'quadro',
    })
    return { terminalId: r.terminalId, bufferInicial, aviso: terminais.aviso(r.terminalId) }
  })
  handle(IPC.terminaisFecharLogin, z.object({ perfilId: z.string().min(1) }), ({ perfilId }) =>
    terminais.fechar(`login:${perfilId}`),
  )
  handle(IPC.terminaisEscrever, Escrever, ({ terminalId, dados }) => terminais.escrever(terminalId, dados))
  handle(IPC.terminaisRedimensionar, Redimensionar, ({ terminalId, cols, rows }) =>
    terminais.redimensionar(terminalId, cols, rows),
  )
}
