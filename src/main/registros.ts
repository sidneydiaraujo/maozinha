// Registros em arquivo (T8.6): um arquivo por dia em <userData>\logs, guardados por 14 dias,
// para descobrir depois o que falhou no app instalado. Quem escreve o conteudo e o log().
import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

export const DIAS_GUARDADOS = 14
/** Um dia com erro em laco nao enche o disco: passou disso, para de gravar ate o dia seguinte. */
const LIMITE_POR_DIA = 5 * 1024 * 1024
const NOME = /^lousa-(\d{4})-(\d{2})-(\d{2})\.log$/
const DIA_MS = 24 * 60 * 60 * 1000

const doisDigitos = (n: number): string => String(n).padStart(2, '0')

/** lousa-AAAA-MM-DD.log, na data do PC (nao em UTC). */
export function nomeDoDia(data: Date): string {
  return `lousa-${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}.log`
}

/** Arquivos de registro com mais de `dias` dias; o resto da pasta nunca e tocado. */
export function velhos(nomes: string[], hoje: Date, dias = DIAS_GUARDADOS): string[] {
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()
  return nomes.filter((nome) => {
    const achou = NOME.exec(nome)
    if (!achou) return false
    const dia = new Date(Number(achou[1]), Number(achou[2]) - 1, Number(achou[3])).getTime()
    return Math.round((inicioDeHoje - dia) / DIA_MS) > dias
  })
}

function apagarVelhos(pasta: string, hoje: Date): void {
  for (const nome of velhos(readdirSync(pasta), hoje)) {
    try {
      unlinkSync(join(pasta, nome))
    } catch {
      // arquivo aberto em outro programa: fica para a proxima vez
    }
  }
}

function tamanhoAtual(caminho: string): number {
  try {
    return statSync(caminho).size
  } catch {
    return 0
  }
}

/** Cria a pasta, apaga os velhos e devolve quem grava cada linha no arquivo do dia. */
export function iniciarRegistros(pasta: string, agora: () => Date = () => new Date()): (linha: string) => void {
  mkdirSync(pasta, { recursive: true })
  apagarVelhos(pasta, agora())
  let arquivo = ''
  let tamanho = 0
  return (linha) => {
    const caminho = join(pasta, nomeDoDia(agora()))
    if (caminho !== arquivo) {
      arquivo = caminho
      tamanho = tamanhoAtual(caminho)
    }
    if (tamanho > LIMITE_POR_DIA) return
    tamanho += Buffer.byteLength(linha)
    appendFileSync(caminho, tamanho > LIMITE_POR_DIA ? '... limite do dia atingido, parou de gravar\n' : linha)
  }
}
