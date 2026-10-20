import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { Armazem } from '../estado/armazem'
import { handle } from '../ipc'
import { MAXIMO_LETRAS_NOTA, ServicoNotas } from '../notas/servico'

const Numero = z.number().finite()
const Criar = z.object({ posicao: z.object({ x: Numero, y: Numero }) })
const Salvar = z.object({ notaId: z.string().min(1), texto: z.string().max(MAXIMO_LETRAS_NOTA) })
const Remover = z.object({ notaId: z.string().min(1) })

/** Notas da lousa (T26.1, D34): so texto; nada aqui abre terminal nem toca em pasta. */
export function registrarHandlersNotas(armazem: Armazem): void {
  const notas = new ServicoNotas({ armazem, novoId: randomUUID })
  handle(IPC.notasCriar, Criar, ({ posicao }) => notas.criar(posicao))
  handle(IPC.notasSalvar, Salvar, ({ notaId, texto }) => notas.salvar(notaId, texto))
  handle(IPC.notasRemover, Remover, ({ notaId }) => notas.remover(notaId))
}
