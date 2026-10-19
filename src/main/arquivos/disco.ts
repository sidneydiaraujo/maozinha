// O disco de verdade para o ServicoArquivos e o VigiaArquivos (T7.1).
import { shell } from 'electron'
import { readdirSync, readFileSync, statSync, watch } from 'node:fs'
import { join } from 'node:path'
import type { ItemArquivo } from '../../shared/model'
import type { DepsArquivos } from './servico'
import type { Observar } from './vigia'

function ehPasta(caminho: string): boolean {
  try {
    return statSync(caminho, { throwIfNoEntry: false })?.isDirectory() === true
  } catch {
    return false // atalho para algo que o Windows nao deixa ler (EPERM)
  }
}

function listarPasta(caminho: string): ItemArquivo[] {
  let entradas
  try {
    entradas = readdirSync(caminho, { withFileTypes: true })
  } catch {
    throw new Error('Pasta não encontrada')
  }
  return entradas.map((d) => ({
    nome: d.name,
    pasta: d.isDirectory() || (d.isSymbolicLink() && ehPasta(join(caminho, d.name))),
  }))
}

export const discoReal: Omit<DepsArquivos, 'repos'> = {
  listarPasta,
  tamanho: (caminho) => {
    const info = statSync(caminho, { throwIfNoEntry: false })
    return info?.isFile() ? info.size : null
  },
  lerBytes: (caminho) => readFileSync(caminho),
  abrirNoWindows: (caminho) => shell.openPath(caminho),
  mostrarNaPasta: (caminho) => shell.showItemInFolder(caminho),
}

/**
 * fs.watch de uma pasta so (sem subpastas, D17). Nada de stat aqui: o Windows nega stat
 * em arquivos de alguns apps (EPERM) e um erro neste retorno derrubava o main.
 */
export const observarReal: Observar = (caminho, aoMudar, aoFalhar) => {
  try {
    const vigia = watch(caminho, (_tipo, nome) => {
      const texto = nome?.toString()
      if (texto) aoMudar(texto)
    })
    vigia.on('error', aoFalhar)
    return { fechar: () => vigia.close() }
  } catch {
    return { fechar: () => undefined }
  }
}
