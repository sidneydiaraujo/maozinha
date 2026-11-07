// Cria uma vez, no inicio do app, os servicos que os canais de IPC usam.
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { Perfil, StatusConta } from '../shared/model'
import { FilaAjustes } from './agentes/ajustes'
import { compactar } from './agentes/compactar'
import { distribuirEstado } from './agentes/ordemDoEstado'
import { CompactarSozinho } from './agentes/compactarSozinho'
import { adiarReal, discoDaPonte } from './agentes/disco'
import { PonteAgentes } from './agentes/ponte'
import { UsoDasContas } from './agentes/uso'
import { discoReal, observarReal } from './arquivos/disco'
import { rodarGitReal } from './copias/git'
import { ServicoCopias } from './copias/servico'
import { AvisosDoWindows } from './avisos/notificar'
import { ServicoArquivos } from './arquivos/servico'
import { VigiaArquivos } from './arquivos/vigia'
import { criarArmazem, type Armazem } from './estado/armazem'
import { log } from './log'
import { montarAmbiente } from './perfis/ambiente'
import { executarReal, lerStatusConta, localizarClaude } from './perfis/conta'
import { depsReais, detectarPerfis } from './perfis/detectar'
import { ServicoPerfis } from './perfis/servico'
import { CicloDosQuadros } from './quadros/ciclo'
import { inscreverNoCiclo } from './quadros/inscricoes'
import { ServicoQuadros } from './quadros/servico'
import { copiarSessao } from './quadros/sessoes'
import { ServicoRepos } from './repos/servico'
import { ServicoTerminais } from './terminais/servico'
import type { ServidorMcp } from './mcp/servidor'
import { enviarParaJanelas, montarAjustes, montarOndeEscreve, montarPedidos, montarTime, temClaudeEm } from './montagens'
import { spawnReal } from './terminais/spawnReal'
import type { ApresentadorTime } from './time/apresentar'
import type { PedidosDeColegas } from './time/pedidos'
import type { Repasse } from './time/repasse'

export interface Contexto {
  perfis: ServicoPerfis
  repos: ServicoRepos
  quadros: ServicoQuadros
  armazem: Armazem
  terminais: ServicoTerminais
  arquivos: ServicoArquivos
  vigia: VigiaArquivos
  avisos: AvisosDoWindows
  agentes: PonteAgentes
  ajustes: FilaAjustes
  /** Compactar sozinho ao fim da tarefa (A17): `definir` recebe a escolha da tela. */
  compactarSozinho: CompactarSozinho
  /** Digita /compact no agente parado (T18.1); lanca com a frase se nao puder. */
  compactarAgora(quadroId: string): Promise<void>
  usos: UsoDasContas
  /** Colegas que o proprio agente pede (A19): a tela responde com `responder`. */
  pedidos: PedidosDeColegas
  /** Servidor da ferramenta do agente (A19): `iniciar` no comeco do app. */
  mcp: ServidorMcp
  /** Time de agentes (T29.1): chame `mudou()` quando linha, colega, papel ou quadro mudar. */
  time: ApresentadorTime
  /** Passar o trabalho adiante (T30.1): `digitou` zera o freio do time. */
  repasse: Repasse
  /** O claude.exe ainda roda no terminal do quadro? Ele nao avisa quando sai (D39). */
  temClaude(quadroId: string): Promise<boolean>
  /** Quem esquece o quadro quando ele sai, reabre ou dorme (R4.18, quadros/inscricoes.ts). */
  ciclo: CicloDosQuadros
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

/** "pasta · Claude 1" para a notificacao; null se o terminal nao e de um quadro (login). */
function descreverQuadro(quadros: ServicoQuadros, repos: ServicoRepos, terminalId: string): string | null {
  try {
    const quadro = quadros.obter(terminalId)
    return `${repos.obter(quadro.repoId).nome} · ${quadro.titulo}`
  } catch {
    return null
  }
}

/** A conta do quadro; null se ele ja foi fechado. */
function contaDoQuadro(quadros: ServicoQuadros, quadroId: string): string | null {
  try {
    return quadros.obter(quadroId).perfilId
  } catch {
    return null
  }
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
  // todo servico que guarda algo por quadro se inscreve no fim desta funcao (R4.18)
  const ciclo = new CicloDosQuadros((nome, id, erro) => log('warn', `${nome} não esqueceu o quadro ${id}`, erro))
  const armazem = criarArmazem(join(app.getPath('userData'), 'estado.json'))
  const perfis = new ServicoPerfis({
    armazem,
    detectar: (ajustes) => detectarPerfis(depsReais(home), ajustes),
    lerConta: (perfil) => lerContaReal(perfil, home),
    home,
    criarPasta: (caminho) => mkdirSync(caminho, { recursive: true }),
  })
  // `quadros` e `repos` sao criados logo abaixo; descrever so roda quando um agente avisa algo
  const avisos = new AvisosDoWindows({
    descrever: (terminalId) => descreverQuadro(quadros, repos, terminalId),
    enviar: enviarParaJanelas,
  })
  const terminais = new ServicoTerminais(spawnReal, {
    aoDados: (terminalId, dados) => enviarParaJanelas(IPC.terminaisDados, { terminalId, dados }),
    aoSair: (terminalId, codigo) => {
      log('info', `terminal saiu: ${terminalId} (código ${codigo})`)
      enviarParaJanelas(IPC.terminaisSaiu, { terminalId, codigo })
    },
    // a ordem e regra (R4.19): agentes/ordemDoEstado.ts diz quem vem antes de quem e por que
    aoEstado: distribuirEstado(
      {
        tela: (id, aviso) => enviarParaJanelas(IPC.terminaisEstado, { terminalId: id, aviso }),
        notificacao: (id, aviso) => avisos.aoEstado(id, aviso),
        trocaDeModelo: (id, aviso) => ajustes.aoEstado(id, aviso),
        repasse: (id, aviso) => repasse.aoEstado(id, aviso.estado, aviso.mensagem),
        esperaDeColegas: (id, aviso) => espera.aoEstado(id, aviso),
        compactarSozinho: (id, aviso) => compactarSozinho.aoEstado(id, aviso),
        filaDoTime: (id, aviso) => mensagens.aoEstado(id, aviso),
      },
      (ouvinte, id, erro) => log('warn', `${ouvinte} falhou com o estado novo do quadro ${id}`, erro),
    ),
  })
  const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  const temClaude = temClaudeEm(terminais)
  const ajustes = montarAjustes(terminais, temClaude, (id) => ciclo.aconteceu('reabriu', id))
  const { mensagens, time, repasse, espera } = montarTime({
    armazem,
    perfis,
    terminais,
    esperar,
    temClaude,
    segurar: (id) => ajustes.pendente(id) || compactarSozinho.segurando(id),
  })
  const copias = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar })
  const usos = new UsoDasContas()
  // linha de status dos agentes (T17.2, D24): fica so em <userData>\agentes
  const agentes = new PonteAgentes({
    pasta: join(app.getPath('userData'), 'agentes'),
    disco: discoDaPonte,
    agora: Date.now,
    emitir: (quadroId, painel) => {
      enviarParaJanelas(IPC.agentesPainel, { quadroId, painel })
      // a primeira linha de status: o Claude esta pronto para receber (D49)
      if (terminais.marcarPronto(quadroId)) {
        void ajustes.aoPronto(quadroId)
        void mensagens.aoPronto(quadroId)
      }
      // os limites de uso sao da conta, nao do quadro (T20.1)
      const perfilId = contaDoQuadro(quadros, quadroId)
      const uso = perfilId ? usos.aoPainel(perfilId, painel) : null
      if (uso) enviarParaJanelas(IPC.perfisUsoMudou, uso)
    },
    // onde o agente salvou (A16): a bolinha da pasta do projeto na lateral
    aoEscrever: (id, arquivo) => ondeEscreve.aoEscrever(id, arquivo),
    adiar: adiarReal,
  })
  // fechar o terminal de um quadro (removido, repo fechado, trocou de conta) leva o painel junto
  const fecharQuadro = (id: string): void => ciclo.aconteceu('saiu', id)
  const repos = new ServicoRepos({
    armazem,
    perfis,
    ehPasta,
    fecharTerminal: fecharQuadro,
    novoId: randomUUID,
    copias,
  })
  const quadros = new ServicoQuadros({
    armazem,
    perfis,
    fecharTerminal: fecharQuadro,
    novoId: randomUUID,
    novaSessao: randomUUID,
    copiarSessao,
    esperar,
    copias,
  })
  const arquivos = new ServicoArquivos({ repos, ...discoReal })
  const compactarAgora = (quadroId: string): Promise<void> =>
    compactar(
      {
        quadro: (id) => quadros.obter(id),
        aberto: (id) => terminais.estaAberto(id),
        aviso: (id) => terminais.aviso(id),
        pronto: (id) => terminais.pronto(id),
        temClaude,
        escrever: (id, dados) => terminais.escrever(id, dados),
        esperar,
        aguardarSaida: (id, achou, ms) => terminais.aguardarSaida(id, achou, ms),
      },
      quadroId,
    )
  const compactarSozinho = new CompactarSozinho({
    usado: (id) => agentes.ultimo(id)?.contexto?.usado ?? null,
    ocupado: (id) => ajustes.pendente(id),
    compactar: compactarAgora,
    aoCompactar: (id) => repasse.aoDigitar(id, 'compactar'),
    aoDesistir: (id, e) => {
      log('info', `compactar sozinho nao rolou em ${id}: ${String(e)}`)
      void mensagens.aoPronto(id)
    },
  })
  const vigia = new VigiaArquivos(observarReal, (repoId, caminhos) =>
    enviarParaJanelas(IPC.arquivosMudou, { repoId, caminhos }),
  )
  const { pedidos, mcp } = montarPedidos({ armazem, perfis, quadros, mensagens, time, espera })
  const ondeEscreve = montarOndeEscreve({
    quadros,
    repos,
    existe: existsSync,
    avisarArvore: (repoId, caminhos) => vigia.avisarAgora(repoId, caminhos),
  })
  inscreverNoCiclo(ciclo, { terminais, agentes, compactarSozinho, avisos, ajustes, ondeEscreve, pedidos, mcp, mensagens, repasse, espera })
  return {
    perfis,
    repos,
    quadros,
    armazem,
    terminais,
    arquivos,
    vigia,
    avisos,
    agentes,
    ajustes,
    compactarSozinho,
    compactarAgora,
    usos,
    pedidos,
    mcp,
    time,
    repasse,
    temClaude,
    ciclo,
  }
}
