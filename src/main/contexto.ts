// Cria uma vez, no inicio do app, os servicos que os canais de IPC usam (R4.20: em tres partes).
// base (montar/base.ts) -> agentes (montar/agentes.ts) -> time (montar/time.ts). As duas voltas,
// o estado do agente que o terminal le e o que os agentes avisam ao time, sao tomadas ligadas aqui,
// no fim; nenhuma funcao usa uma variavel que ainda nao existe.
import { IPC } from '../shared/ipc'
import { distribuirEstado } from './agentes/ordemDoEstado'
import { log } from './log'
import { montarAgentes, type Agentes, type DoTime } from './montar/agentes'
import { montarBase, type Base } from './montar/base'
import { enviarParaJanelas } from './montar/janelas'
import { montarTime, type Time } from './montar/time'
import { Tomada } from './montar/tomada'
import { inscreverNoCiclo } from './quadros/inscricoes'

/** O que os handlers usam: a base, os agentes e o time, sem as pecas internas da montagem. */
export type Contexto = Omit<Base, 'estadoDoAgente' | 'esperar'> & Omit<Agentes, 'ondeEscreve'> & Omit<Time, 'espera'>

export function criarContexto(): Contexto {
  const base = montarBase()
  const doTime = new Tomada<DoTime>('o aviso dos agentes ao time')
  const agentes = montarAgentes(base, doTime)
  // troca de modelo esperando ou /compact em curso: a mensagem do time vai depois (A15, A17)
  const time = montarTime(base, (id) => agentes.ajustes.pendente(id) || agentes.compactarSozinho.segurando(id))

  doTime.ligar({
    aoPronto: (id) => void time.mensagens.aoPronto(id),
    aoCompactar: (id) => time.repasse.aoDigitar(id, 'compactar'),
  })
  // a ordem e regra (R4.19): agentes/ordemDoEstado.ts diz quem vem antes de quem e por que
  base.estadoDoAgente.ligar({
    aoEstado: distribuirEstado(
      {
        tela: (id, aviso) => enviarParaJanelas(IPC.terminaisEstado, { terminalId: id, aviso }),
        notificacao: (id, aviso) => agentes.avisos.aoEstado(id, aviso),
        trocaDeModelo: (id, aviso) => agentes.ajustes.aoEstado(id, aviso),
        repasse: (id, aviso) => time.repasse.aoEstado(id, aviso.estado, aviso.mensagem),
        esperaDeColegas: (id, aviso) => time.espera.aoEstado(id, aviso),
        compactarSozinho: (id, aviso) => agentes.compactarSozinho.aoEstado(id, aviso),
        filaDoTime: (id, aviso) => time.mensagens.aoEstado(id, aviso),
      },
      (ouvinte, id, erro) => log('warn', `${ouvinte} falhou com o estado novo do quadro ${id}`, erro),
    ),
  })
  // quem esquece o quadro quando ele sai, reabre ou dorme (R4.18)
  inscreverNoCiclo(base.ciclo, { terminais: base.terminais, ...agentes, ...time })

  return { ...base, ...agentes, ...time }
}
