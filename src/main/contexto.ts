// Cria uma vez, no inicio do app, os servicos que os canais de IPC usam.
import { app, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { Perfil, StatusConta } from '../shared/model'
import { criarArmazem } from './estado/armazem'
import { montarAmbiente } from './perfis/ambiente'
import { executarReal, lerStatusConta, localizarClaude } from './perfis/conta'
import { depsReais, detectarPerfis } from './perfis/detectar'
import { ServicoPerfis } from './perfis/servico'
import { ServicoRepos } from './repos/servico'
import { ServicoTerminais } from './terminais/servico'
import { spawnReal } from './terminais/spawnReal'

export interface Contexto {
  perfis: ServicoPerfis
  repos: ServicoRepos
  terminais: ServicoTerminais
}

/** Entrega um evento a todas as janelas abertas. */
function enviarParaJanelas(canal: string, payload: unknown): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) janela.webContents.send(canal, payload)
  }
}

function caminhoDoPath(): string {
  const chave = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH')
  return (chave && process.env[chave]) || ''
}

async function lerContaReal(perfil: Perfil, home: string): Promise<StatusConta> {
  if (perfil.provedor === 'codex') {
    // T1.4b (status do Codex) esta adiada: ver docs/ESTADO.md
    return { logado: false, email: null, plano: null, erro: 'Leitura de contas Codex ainda não disponível' }
  }
  const exe = localizarClaude(home, caminhoDoPath(), existsSync)
  return lerStatusConta(exe, montarAmbiente(perfil, process.env), executarReal)
}

function ehPasta(caminho: string): boolean {
  try {
    return statSync(caminho).isDirectory()
  } catch {
    return false
  }
}

export function criarContexto(): Contexto {
  const home = app.getPath('home')
  const armazem = criarArmazem(join(app.getPath('userData'), 'estado.json'))
  const perfis = new ServicoPerfis({
    armazem,
    detectar: (ajustes) => detectarPerfis(depsReais(home), ajustes),
    lerConta: (perfil) => lerContaReal(perfil, home),
  })
  const repos = new ServicoRepos({ armazem, perfis, ehPasta, novoId: randomUUID })
  const terminais = new ServicoTerminais(spawnReal, {
    aoDados: (terminalId, dados) => enviarParaJanelas(IPC.terminaisDados, { terminalId, dados }),
    aoSair: (terminalId, codigo) => enviarParaJanelas(IPC.terminaisSaiu, { terminalId, codigo }),
  })
  return { perfis, repos, terminais }
}
