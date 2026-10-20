// Mandar um texto pronto (Ctrl+K "Mandar: …", nota "Mandar para o agente") aos alvos de agora:
// os quadros selecionados ou o ultimo usado (T25.2, D33). O resultado aparece no topo da lousa.
import { alvosAgora } from './alvos'
import { quadrosPorExtenso } from './envio'
import { enviarMensagem } from './escrever'
import { pedirAviso } from './foco'

export async function mandarAosAlvos(texto: string): Promise<void> {
  const alvos = alvosAgora()
  if (alvos.length === 0) {
    pedirAviso('Clique num quadro (ou selecione vários com Ctrl+clique) e mande de novo.')
    return
  }
  const resultados = await Promise.allSettled(alvos.map((id) => enviarMensagem(id, texto)))
  const falhas = resultados.filter((r) => r.status === 'rejected').length
  pedirAviso(
    falhas === 0
      ? `Enviado para ${quadrosPorExtenso(alvos.length)}`
      : `Enviado para ${alvos.length - falhas} de ${alvos.length} (${quadrosPorExtenso(falhas)} sem terminal aberto)`,
  )
}
