// Time do contexto (R4.20): fila de mensagens e apresentador (T29.1), repasse (T30.1), espera de
// colegas (A21) e colegas pedidos pelo agente pelo servidor MCP (A19, D56). Usa a base e, para segurar
// a fila, o que os agentes dizem (troca de modelo esperando, /compact em curso).
import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { IPC } from '../../shared/ipc'
import type { ColegaPedido } from '../../shared/model'
import { nomeNoTime, type DadosTime } from '../../shared/time'
import { adiarReal } from '../agentes/disco'
import { log } from '../log'
import { ServidorMcp } from '../mcp/servidor'
import { ApresentadorTime, FilaMensagens, REVISAR_MS, type TipoMensagem } from '../time/apresentar'
import { criarColega, posicaoDoColega, type DepsColega } from '../time/colega'
import { EsperaDeColegas } from '../time/espera'
import { CriacaoParcial, PedidosDeColegas, TEXTO_PEDIDO_NA_TELA, textoDaTarefa } from '../time/pedidos'
import { Repasse } from '../time/repasse'
import { dadosDoTime, ServicoTime } from '../time/servico'
import type { Base } from './base'
import { enviarParaJanelas } from './janelas'
import { Tomada } from './tomada'

export interface Time {
  mensagens: FilaMensagens
  /** Chame `mudou()` quando linha, colega, papel ou quadro mudar (T29.1). */
  time: ApresentadorTime
  /** `digitou` zera o freio do time (T30.1). */
  repasse: Repasse
  espera: EsperaDeColegas
  /** A tela responde ao pedido com `responder` (A19). */
  pedidos: PedidosDeColegas
  /** `iniciar` no comeco do app (A19). */
  mcp: ServidorMcp
}

/** Troca de modelo esperando ou /compact em curso: a mensagem vai depois (A15, A17). */
export type Segurar = (quadroId: string) => boolean

function montarFila(b: Base, d: { segurar: Segurar; dados(): DadosTime; linhas: ServicoTime }) {
  // quem pediu colegas espera eles terminarem a tarefa (A21)
  const espera = new EsperaDeColegas({ nome: (id) => nomeNoTime(d.dados(), id), adiar: adiarReal })
  // a fila avisa o repasse e a espera quando digita, e o repasse usa a fila: a volta e uma tomada
  const digitou = new Tomada<{ aoDigitar(id: string, tipo: TipoMensagem): void }>('quem ouve a fila do time')
  const mensagens = new FilaMensagens(
    {
      aberto: (id) => b.terminais.estaAberto(id),
      aviso: (id) => b.terminais.aviso(id),
      pronto: (id) => b.terminais.pronto(id),
      escrever: (id, dados) => b.terminais.escrever(id, dados),
      esperar: b.esperar,
      temClaude: b.temClaude,
      segurar: d.segurar,
      agora: Date.now,
      aoDemorar: (id, detalhe) => log('warn', `mensagem do time esperando há 2 min no quadro ${id}: ${detalhe}`),
    },
    (id, tipo) => digitou.usar().aoDigitar(id, tipo),
  )
  const repasse = new Repasse({
    dados: d.dados,
    fila: mensagens,
    aberto: (id) => b.terminais.estaAberto(id),
    ajustar: (id, mudanca) => d.linhas.ajustar(id, mudanca),
    avisar: (evento) => enviarParaJanelas(IPC.timeRepasse, evento),
  })
  digitou.ligar({
    aoDigitar: (id, tipo) => {
      repasse.aoDigitar(id, tipo)
      espera.aoDigitar(id, tipo)
    },
  })
  // a fila confere sozinha: a tarefa de um colega nao depende de um aviso que pode nao vir (A27)
  setInterval(() => void mensagens.revisar(), REVISAR_MS).unref()
  return { mensagens, repasse, espera }
}

/**
 * Colegas pedidos pelo agente (A19, D56): o servidor MCP recebe o pedido, a tela pergunta, e so
 * com o aceite o colega nasce (mesma conta, copia propria, ligado), com o papel e a tarefa na fila.
 */
function montarPedidos(
  b: Base,
  d: { linhas: ServicoTime; dados(): DadosTime; mensagens: FilaMensagens; time: ApresentadorTime; espera: EsperaDeColegas },
): { pedidos: PedidosDeColegas; mcp: ServidorMcp } {
  const deps: DepsColega = {
    armazem: b.armazem,
    quadros: b.quadros,
    time: d.linhas,
    ehClaude: (perfilId) => b.perfis.obter(perfilId).provedor === 'claude',
  }
  const nome = (id: string): string => nomeNoTime(d.dados(), id)
  const criar = async (quadroId: string, colegas: ColegaPedido[], paralelo: boolean): Promise<string[]> => {
    const { caixa } = b.quadros.obter(quadroId)
    const nomes: string[] = []
    const ids: string[] = []
    try {
      for (const [i, c] of colegas.entries()) {
        // paralelo (A21): na mesma pasta, onde o metodo procura as saidas, e com a linha pausada: o fim
        // da vez de quem pediu nao vira trabalho extra para o colega
        const novo = await criarColega(deps, quadroId, { posicao: posicaoDoColega(caixa, i), mesmaPasta: paralelo })
        const quadro = b.quadros.definirPapel(novo.quadro.id, c.papel)
        const ligacao = paralelo ? d.linhas.ajustar(novo.ligacao.id, { pausada: true }) : novo.ligacao
        enviarParaJanelas(IPC.timeColegaCriado, { ...novo, quadro, ligacao })
        // a tarefa espera o colega abrir e ficar pronto (a apresentacao do time sai antes)
        void d.mensagens.enfileirar(quadro.id, textoDaTarefa(nome(quadroId), c.tarefa))
        nomes.push(quadro.papel ?? quadro.titulo)
        ids.push(quadro.id)
      }
    } catch (e) {
      // R1.3: quem ja nasceu entra na espera e no time; o agente fica sabendo deles
      if (ids.length === 0) throw e
      throw new CriacaoParcial(nomes, e instanceof Error ? e.message : String(e))
    } finally {
      if (ids.length > 0) {
        d.espera.registrar(quadroId, ids)
        d.time.mudou()
      }
    }
    return nomes
  }
  const pedidos = new PedidosDeColegas({
    nome,
    avisarTela: (aviso) => enviarParaJanelas(IPC.timePedidoColegas, aviso),
    criar,
    adiar: adiarReal,
    novoId: randomUUID,
  })
  const mcp = new ServidorMcp({
    versao: app.getVersion(),
    ferramentas: (id) => ({
      criar: (colegas, paralelo) => pedidos.pedir(id, colegas, paralelo),
      // pedido ainda na tela: diz isso, nao "nenhum colega" (A27)
      esperar: () => (pedidos.temAberto(id) ? Promise.resolve({ texto: TEXTO_PEDIDO_NA_TELA }) : d.espera.esperar(id)),
    }),
  })
  return { pedidos, mcp }
}

export function montarTime(b: Base, segurar: Segurar): Time {
  const dados = (): DadosTime => dadosDoTime(b.armazem.carregar(), (id) => b.perfis.obter(id))
  const linhas = new ServicoTime({ armazem: b.armazem, perfis: b.perfis, novoId: randomUUID })
  const { mensagens, repasse, espera } = montarFila(b, { segurar, dados, linhas })
  const time = new ApresentadorTime({ dados, fila: mensagens, adiar: adiarReal })
  const { pedidos, mcp } = montarPedidos(b, { linhas, dados, mensagens, time, espera })
  return { mensagens, time, repasse, espera, pedidos, mcp }
}
