// Disco de verdade da ponte dos agentes (T17.2): so a pasta <userData>\agentes, vigiada sem
// subpastas e sem stat (licao da D17). O vigia nao segura o app aberto (persistent: false).
import { mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs'
import { log } from '../log'
import type { DiscoPonte } from './ponte'

export const discoDaPonte: DiscoPonte = {
  criarPasta: (pasta) => mkdirSync(pasta, { recursive: true }),
  escrever: (caminho, texto) => writeFileSync(caminho, texto),
  ler: (caminho) => readFileSync(caminho),
  apagar: (caminho) => rmSync(caminho, { force: true }),
  listar: (pasta) => readdirSync(pasta),
  vigiar: (pasta, aoMudar) => {
    const vigia = watch(pasta, { persistent: false }, (_evento, nome) => {
      if (nome) aoMudar(String(nome))
    })
    vigia.on('error', (erro) => log('warn', 'o vigia da pasta dos agentes parou', erro))
    return () => vigia.close()
  },
}

export function adiarReal(fn: () => void, ms: number): () => void {
  const relogio = setTimeout(fn, ms)
  return () => clearTimeout(relogio)
}
