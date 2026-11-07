// R3.13 (D62): liga a hibernacao ao app. Adormecer = salvar o quadro como dormindo, o momento
// `dormiu` do ciclo (fecha o terminal, o claude.exe sai junto, e esquece o painel e a notificacao;
// quadros/inscricoes.ts) e avisar a tela, que troca o terminal pela capa "Dormindo". Acordar e abrir o terminal de novo (handlers/terminais).
import { IPC } from '../../shared/ipc'
import type { Contexto } from '../contexto'
import { log } from '../log'
import { enviarParaJanelas } from '../montagens'
import { Hibernacao, QUIETO_PARA_DORMIR_MS, VARREDURA_MS } from './hibernar'

type Servicos = Pick<
  Contexto,
  'quadros' | 'armazem' | 'terminais' | 'ajustes' | 'compactarSozinho' | 'temClaude' | 'ciclo'
>

/** Prova com a opcao `sono-rapido`: 3 s parado e uma passada por segundo; `semClaude` dispensa o claude.exe. */
export interface Ritmo {
  quietoMs: number
  varreduraMs: number
  exigirClaude: boolean
}

export const RITMO_NORMAL: Ritmo = { quietoMs: QUIETO_PARA_DORMIR_MS, varreduraMs: VARREDURA_MS, exigirClaude: true }

export function montarHibernacao(s: Servicos, ritmo: Ritmo = RITMO_NORMAL): { hibernacao: Hibernacao; parar(): void } {
  const hibernacao = new Hibernacao(
    {
      agentesAbertos: () => {
        const ligacoes = s.armazem.carregar().ligacoes ?? []
        return s.quadros
          .listar()
          .filter((q) => q.tipo === 'agente' && q.sessaoId && s.terminais.estaAberto(q.id))
          .map((q) => ({ id: q.id, ligado: ligacoes.some((l) => l.de === q.id || l.para === q.id) }))
      },
      aviso: (id) => s.terminais.aviso(id),
      // as mensagens da fila sao do time (ja fora pela linha) ou o /compact (segurando)
      ocupado: (id) => s.ajustes.pendente(id) || s.compactarSozinho.segurando(id),
      temClaude: (id) => (ritmo.exigirClaude ? s.temClaude(id) : Promise.resolve(true)),
      agora: Date.now,
      adormecer: (id) => {
        s.quadros.dormir(id, true)
        s.ciclo.aconteceu('dormiu', id)
        enviarParaJanelas(IPC.agentesDormiu, { quadroId: id })
        log('info', `agente dormiu (parado havia ${Math.round(ritmo.quietoMs / 60000)} min): ${id}`)
      },
    },
    ritmo.quietoMs,
  )
  const relogio = setInterval(() => {
    hibernacao.varrer().catch((e: unknown) => log('warn', 'a hibernação dos agentes falhou numa passada', e))
  }, ritmo.varreduraMs)
  relogio.unref()
  return { hibernacao, parar: () => clearInterval(relogio) }
}
