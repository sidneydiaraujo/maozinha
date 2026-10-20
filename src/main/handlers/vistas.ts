import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { Armazem } from '../estado/armazem'
import { handle } from '../ipc'
import { SchemaLayout } from '../lousa/layout'
import { MAXIMO_NOME, ServicoVistas } from '../vistas/servico'

const Salvar = z.object({ nome: z.string().max(MAXIMO_NOME * 4), layout: SchemaLayout })
const Remover = z.object({ vistaId: z.string().min(1) })

/** Vistas salvas (T27.1, D35): so posicoes e camera; nada aqui abre terminal nem toca em pasta. */
export function registrarHandlersVistas(armazem: Armazem): void {
  const vistas = new ServicoVistas({ armazem, novoId: randomUUID })
  handle(IPC.vistasSalvar, Salvar, ({ nome, layout }) => vistas.salvar(nome, layout))
  handle(IPC.vistasRemover, Remover, ({ vistaId }) => vistas.remover(vistaId))
}
