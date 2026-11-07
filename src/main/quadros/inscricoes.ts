// Quem esquece o que, em cada momento do ciclo de um quadro (R4.18). A ordem importa: o terminal
// fecha primeiro, para nenhum aviso dele chegar a um servico que ja esqueceu o quadro.
import { CicloDosQuadros, MOMENTOS, type Esquecivel } from './ciclo'

export interface QuemGuardaPorQuadro {
  terminais: { fechar(quadroId: string): void }
  /** Linha de status (painel) do agente. */
  agentes: Esquecivel
  compactarSozinho: Esquecivel
  /** Notificacao do Windows (R3.17). */
  avisos: Esquecivel
  /** Troca de modelo esperando o agente parar. */
  ajustes: Esquecivel
  /** Pasta do projeto onde o agente salvou por ultimo (A16). */
  ondeEscreve: Esquecivel
  /** Pedido de colegas aberto na tela (A19). */
  pedidos: Esquecivel
  /** Chave do servidor dos agentes (A19). */
  mcp: Esquecivel
  /** Fila de mensagens do time (T29.1). */
  mensagens: Esquecivel
  repasse: Esquecivel
  /** Colegas que o quadro espera (A21). */
  espera: Esquecivel
}

export function inscreverNoCiclo(ciclo: CicloDosQuadros, s: QuemGuardaPorQuadro): void {
  // fechar o terminal: em todo momento (o claude.exe sai junto)
  ciclo.inscrever('terminal', { esquecer: (id) => s.terminais.fechar(id) }, MOMENTOS)
  // o painel e a contagem do compactar recomecam quando o agente reabre ou acorda
  ciclo.inscrever('painel', s.agentes, MOMENTOS)
  ciclo.inscrever('compactar sozinho', s.compactarSozinho, MOMENTOS)
  // a notificacao de um agente dormindo nao tem mais o que avisar; na troca de modelo, segue
  ciclo.inscrever('notificação', s.avisos, ['saiu', 'dormiu'])
  // o resto e do quadro, nao do terminal: a fila, a espera e a chave voltam a servir quando ele acorda
  ciclo.inscrever('troca de modelo', s.ajustes)
  ciclo.inscrever('onde escreve', s.ondeEscreve)
  ciclo.inscrever('pedido de colegas', s.pedidos)
  ciclo.inscrever('chave dos agentes', s.mcp)
  ciclo.inscrever('fila do time', s.mensagens)
  ciclo.inscrever('repasse', s.repasse)
  ciclo.inscrever('espera de colegas', s.espera)
}
