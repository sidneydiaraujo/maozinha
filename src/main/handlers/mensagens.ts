import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import { MAXIMO_LETRAS, MAXIMO_MENSAGENS, ServicoMensagens } from '../mensagens/servico'

const Salvar = z.object({ mensagens: z.array(z.string().max(MAXIMO_LETRAS)).max(MAXIMO_MENSAGENS * 2) })

/** Mensagens prontas (T25.1, D33) em `arquivo` (<userData>\mensagens.json). */
export function registrarHandlersMensagens(arquivo: string): void {
  const servico = new ServicoMensagens({
    ler: () => (existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : null),
    gravar: (texto) => {
      mkdirSync(dirname(arquivo), { recursive: true })
      writeFileSync(`${arquivo}.tmp`, texto, 'utf8')
      renameSync(`${arquivo}.tmp`, arquivo)
    },
  })
  handle(IPC.mensagensListar, z.undefined(), () => servico.listar())
  handle(IPC.mensagensSalvar, Salvar, ({ mensagens }) => servico.salvar(mensagens))
}
