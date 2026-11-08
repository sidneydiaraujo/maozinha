// Base do contexto (R4.20): estado salvo, contas, pastas, copias, quadros, terminais e arquivos.
// Nada aqui conhece agentes nem time: o estado do agente que o terminal le sai pela tomada
// `estadoDoAgente`, ligada no fim da montagem (contexto.ts).
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../../shared/ipc'
import type { AvisoAgente, Perfil, StatusConta } from '../../shared/model'
import { discoReal, observarReal } from '../arquivos/disco'
import { ServicoArquivos } from '../arquivos/servico'
import { VigiaArquivos } from '../arquivos/vigia'
import { rodarGitReal } from '../copias/git'
import { ServicoCopias } from '../copias/servico'
import { criarArmazem, type Armazem } from '../estado/armazem'
import { log } from '../log'
import { montarAmbiente } from '../perfis/ambiente'
import { executarReal, lerStatusConta, localizarClaude } from '../perfis/conta'
import { depsReais, detectarPerfis } from '../perfis/detectar'
import { ServicoPerfis } from '../perfis/servico'
import { CicloDosQuadros } from '../quadros/ciclo'
import { ServicoQuadros } from '../quadros/servico'
import { copiarSessao } from '../quadros/sessoes'
import { ServicoRepos } from '../repos/servico'
import { rodarReal, temClaudeDentro } from '../terminais/filhos'
import { ServicoTerminais } from '../terminais/servico'
import { spawnReal } from '../terminais/spawnReal'
import { enviarParaJanelas } from './janelas'
import { Tomada } from './tomada'

export type AoEstado = (terminalId: string, aviso: AvisoAgente) => void

export interface Base {
  armazem: Armazem
  perfis: ServicoPerfis
  repos: ServicoRepos
  quadros: ServicoQuadros
  terminais: ServicoTerminais
  arquivos: ServicoArquivos
  vigia: VigiaArquivos
  /** Quem esquece o quadro quando ele sai, reabre ou dorme (R4.18): os servicos se inscrevem no fim. */
  ciclo: CicloDosQuadros
  /** Quem recebe o estado do agente (R4.19), ligado depois de montar agentes e time. */
  estadoDoAgente: Tomada<{ aoEstado: AoEstado }>
  esperar(ms: number): Promise<void>
  /** O claude.exe ainda roda no terminal do quadro? Ele nao avisa quando sai (D39). */
  temClaude(quadroId: string): Promise<boolean>
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

/** Pergunta ao Windows se o PowerShell do quadro tem um claude.exe filho (terminais/filhos.ts). */
function temClaudeEm(terminais: ServicoTerminais): (quadroId: string) => Promise<boolean> {
  return async (id) => {
    const pid = terminais.pid(id)
    return pid !== null && temClaudeDentro(pid, rodarReal)
  }
}

function criarTerminais(estadoDoAgente: Base['estadoDoAgente']): ServicoTerminais {
  return new ServicoTerminais(spawnReal, {
    aoDados: (terminalId, dados) => enviarParaJanelas(IPC.terminaisDados, { terminalId, dados }),
    aoSair: (terminalId, codigo) => {
      log('info', `terminal saiu: ${terminalId} (código ${codigo})`)
      enviarParaJanelas(IPC.terminaisSaiu, { terminalId, codigo })
    },
    aoEstado: (terminalId, aviso) => estadoDoAgente.usar().aoEstado(terminalId, aviso),
  })
}

export function montarBase(): Base {
  const home = app.getPath('home')
  const ciclo = new CicloDosQuadros((nome, id, erro) => log('warn', `${nome} não esqueceu o quadro ${id}`, erro))
  const estadoDoAgente = new Tomada<{ aoEstado: AoEstado }>('o estado do agente')
  const armazem = criarArmazem(join(app.getPath('userData'), 'estado.json'))
  const perfis = new ServicoPerfis({
    armazem,
    detectar: (ajustes) => detectarPerfis(depsReais(home), ajustes),
    lerConta: (perfil) => lerContaReal(perfil, home),
    home,
    criarPasta: (caminho) => mkdirSync(caminho, { recursive: true }),
  })
  const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  const terminais = criarTerminais(estadoDoAgente)
  const copias = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar })
  // tirar o quadro (removido, pasta fechada, trocou de conta) e o momento `saiu` do ciclo
  const fecharTerminal = (id: string): void => ciclo.aconteceu('saiu', id)
  const repos = new ServicoRepos({ armazem, perfis, ehPasta, fecharTerminal, novoId: randomUUID, copias })
  const quadros = new ServicoQuadros({
    armazem,
    perfis,
    fecharTerminal,
    novoId: randomUUID,
    novaSessao: randomUUID,
    copiarSessao,
    esperar,
    copias,
  })
  const arquivos = new ServicoArquivos({ repos, ...discoReal })
  const vigia = new VigiaArquivos(observarReal, (repoId, caminhos) =>
    enviarParaJanelas(IPC.arquivosMudou, { repoId, caminhos }),
  )
  return { armazem, perfis, repos, quadros, terminais, arquivos, vigia, ciclo, estadoDoAgente, esperar, temClaude: temClaudeEm(terminais) }
}
