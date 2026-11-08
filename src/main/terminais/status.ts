// Program Status Protocol (OSC 7501) do Claude Code 2.1.295+ (T8.1, D16): o terminal que responde
// a pergunta do Claude recebe "trabalhando / esperando voce / terminou". Formato lido no claude.exe
// instalado (docs/plano/fatia-8-uma-semana.md). Funcoes puras, sem Electron.
import type { ESTADOS_OSC_7501, MOTIVOS_OSC_7501 } from '../../shared/contratoClaude'
import type { AvisoAgente, EstadoAgente, MotivoEspera } from '../../shared/model'

const ESC = '\x1b'
const BEL = '\x07'
const INICIO = `${ESC}]7501;`
// Montadas com new RegExp a partir de constantes: a regra no-control-regex barra o ESC literal.
const SEQUENCIA = new RegExp(`${ESC}\\]7501;([^${BEL}${ESC}]*)(?:${BEL}|${ESC}\\\\)`, 'g')
const TERMINA = new RegExp(`${BEL}|${ESC}\\\\`)
/** Pedaco que pode estar cortado no fim de um bloco de saida (ex.: "\x1b]75"). */
const MAIOR_SEQUENCIA = 4096
const MAIOR_MENSAGEM = 200

// os nomes vem do contrato com o Claude (R4.21): nome novo la sem traducao aqui nao compila
const ESTADOS: Record<(typeof ESTADOS_OSC_7501)[number], EstadoAgente> = {
  working: 'trabalhando',
  blocked: 'esperando',
  done: 'terminou',
  idle: 'parado',
  clear: 'parado',
  error: 'erro',
}

const MOTIVOS: Record<(typeof MOTIVOS_OSC_7501)[number], MotivoEspera> = { permission: 'permissao', question: 'pergunta', auth: 'login' }

/**
 * Resposta a pergunta "\x1b]7501;?" escrita como teclas no win32-input-mode
 * (ESC [ Vk;Sc;Uc;Kd;Cs;Rc _): o ConPTY descarta um OSC cru vindo do terminal, mas entrega
 * teclas (provado em 18/10/2026). Texto fixo: nada da saida do programa volta como entrada.
 */
export function respostaEmTeclas(): string {
  return [...`${INICIO}?${BEL}`]
    .map((c) => {
      const codigo = c.charCodeAt(0)
      return `${ESC}[0;0;${codigo};1;0;1_${ESC}[0;0;${codigo};0;0;1_`
    })
    .join('')
}

function decodificarBase64(valor: string): string | undefined {
  try {
    const texto = Buffer.from(valor, 'base64')
      .toString('utf8')
      .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
      .trim()
    return texto === '' ? undefined : texto.slice(0, MAIOR_MENSAGEM)
  } catch {
    return undefined
  }
}

/** "state=blocked:app=claude-code:kind=permission:msg=..." -> aviso; null se for de subagente ou invalido. */
export function interpretar(corpo: string): AvisoAgente | null {
  const campos = new Map<string, string>()
  for (const parte of corpo.split(':')) {
    const igual = parte.indexOf('=')
    if (igual > 0) campos.set(parte.slice(0, igual), parte.slice(igual + 1))
  }
  if (campos.has('id')) return null // subagente: so o agente principal conta
  const estado = (ESTADOS as Partial<Record<string, EstadoAgente>>)[campos.get('state') ?? '']
  if (!estado) return null
  const aviso: AvisoAgente = { estado }
  const motivo = (MOTIVOS as Partial<Record<string, MotivoEspera>>)[campos.get('kind') ?? '']
  if (estado === 'esperando' && motivo) aviso.motivo = motivo
  const msg = campos.get('msg')
  const mensagem = msg ? decodificarBase64(msg) : undefined
  if (mensagem && estado !== 'parado') aviso.mensagem = mensagem
  return aviso
}

/** Quantos caracteres do fim de `texto` podem ser o comeco de uma sequencia ainda incompleta. */
function inicioCortado(texto: string): number {
  const ultimo = texto.lastIndexOf(ESC)
  if (ultimo < 0) return -1
  const cauda = texto.slice(ultimo)
  if (cauda.length < INICIO.length) return INICIO.startsWith(cauda) ? ultimo : -1
  if (!cauda.startsWith(INICIO)) return -1
  return TERMINA.test(cauda) ? -1 : ultimo
}

export interface Leitura {
  perguntas: number
  avisos: AvisoAgente[]
}

/** Le a saida de um terminal em pedacos; guarda so o fim que pode ser uma sequencia cortada. */
export class LeitorStatus {
  private resto = ''

  ler(dados: string): Leitura {
    const texto = this.resto + dados
    this.resto = ''
    const leitura: Leitura = { perguntas: 0, avisos: [] }
    if (!texto.includes(ESC)) return leitura
    const padrao = new RegExp(SEQUENCIA)
    let fimUltima = 0
    for (let achou = padrao.exec(texto); achou; achou = padrao.exec(texto)) {
      fimUltima = padrao.lastIndex
      const corpo = achou[1] ?? ''
      if (corpo.startsWith('?')) leitura.perguntas++
      else {
        const aviso = interpretar(corpo)
        if (aviso) leitura.avisos.push(aviso)
      }
    }
    const corte = inicioCortado(texto.slice(fimUltima))
    if (corte >= 0) {
      const cauda = texto.slice(fimUltima + corte)
      if (cauda.length <= MAIOR_SEQUENCIA) this.resto = cauda
    }
    return leitura
  }
}

export const mesmoAviso = (a: AvisoAgente | null, b: AvisoAgente): boolean =>
  !!a && a.estado === b.estado && a.motivo === b.motivo && a.mensagem === b.mensagem
