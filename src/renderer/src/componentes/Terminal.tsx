import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import type { AlvoTerminal, AvisoAgente } from '../../../shared/model'
import '../estilos/terminal.css'
import { guardarFonte, lerFonte, proximaFonte } from './fonte'
import { arquivoDeUri, ligarLinks, type AcoesLink } from './links'
import { ligarTeclas } from './teclas'

interface Props {
  alvo: AlvoTerminal
  aoSair?: (codigo: number) => void
  /** Ultimo estado do agente, que o main guardou enquanto a tela nao estava montada (T8.2). */
  aoAviso?: (aviso: AvisoAgente) => void
  /** Caminho citado no terminal vira link (T8.3); `aceita` = esta dentro da pasta do quadro. */
  arquivos?: AcoesLink['arquivo']
}

const chaveDoAlvo = (alvo: AlvoTerminal): string =>
  alvo.tipo === 'login' ? `login:${alvo.perfilId}` : `quadro:${alvo.quadroId}`

/** O main so abre http(s) no navegador (T7.1); o resto ele recusa. */
const abrirUrl = (url: string): void => void window.lousa.arquivos.abrirLink(url).catch(() => undefined)

/** Link OSC 8 (o programa marcou o texto como link): file:// vai para o leitor, o resto para o navegador. */
function abrirUri(uri: string, acoes: AcoesLink): void {
  const arquivo = arquivoDeUri(uri)
  if (arquivo === null) acoes.abrirUrl(uri)
  else if (acoes.arquivo?.aceita(arquivo)) acoes.arquivo.abrir(arquivo)
}

/** Linhas que a rolagem guarda (T8.4): uma sessao longa do Claude passa das 1.000 do padrao. */
const HISTORICO = 10_000

function criarXterm(el: HTMLElement, fonte: number, acoes: () => AcoesLink): { term: XTerm; ajustar: FitAddon } {
  const term = new XTerm({
    cursorBlink: true,
    fontFamily: 'Cascadia Mono, Consolas, monospace',
    fontSize: fonte,
    scrollback: HISTORICO,
    theme: { background: '#0b0d12' },
    // Necessario para term.unicode (API marcada como "proposta" no xterm).
    allowProposedApi: true,
    linkHandler: { activate: (_evento, uri) => abrirUri(uri, acoes()), allowNonHttpProtocols: true },
  })
  // Emoji como ❌ e 🟡 ocupam 2 colunas no Claude Code; sem a tabela Unicode 11 o xterm conta 1,
  // e cada redesenho escreve na coluna errada: palavras se misturam (print de 17/10/2026).
  term.loadAddon(new Unicode11Addon())
  term.unicode.activeVersion = '11'
  const ajustar = new FitAddon()
  term.loadAddon(ajustar)
  term.open(el)
  ajustar.fit()
  return { term, ajustar }
}

/** Ctrl+roda dentro do terminal muda a letra (sem zoom na lousa nem na pagina). */
function ligarFonte(term: XTerm, chave: string, reajustar: () => void): void {
  term.attachCustomWheelEventHandler((e) => {
    if (!e.ctrlKey) return true
    e.preventDefault()
    const tamanho = proximaFonte(term.options.fontSize ?? 13, e.deltaY)
    if (tamanho !== term.options.fontSize) {
      term.options.fontSize = tamanho
      guardarFonte(chave, tamanho)
      reajustar()
    }
    return false
  })
}

/** Reajusta colunas e linhas quando o quadro muda de tamanho (100 ms depois do ultimo ajuste). */
function acompanharTamanho(
  el: HTMLElement,
  term: XTerm,
  ajustar: FitAddon,
  id: () => string | null,
): { reajustar(): void; parar(): void } {
  let relogio: ReturnType<typeof setTimeout> | undefined
  const reajustar = (): void => {
    clearTimeout(relogio)
    relogio = setTimeout(() => {
      ajustar.fit()
      const terminalId = id()
      if (terminalId) void window.lousa.terminais.redimensionar(terminalId, term.cols, term.rows)
    }, 100)
  }
  const observador = new ResizeObserver(reajustar)
  observador.observe(el)
  return {
    reajustar,
    parar: () => {
      clearTimeout(relogio)
      observador.disconnect()
    },
  }
}

/**
 * Terminal xterm.js ligado a um terminal que vive no main (D8): desmontar
 * este componente NAO fecha o terminal, so para de mostrá-lo.
 */
export function Terminal({ alvo, aoSair, aoAviso, arquivos }: Props): React.JSX.Element {
  const recipiente = useRef<HTMLDivElement>(null)
  const atual = useRef({ alvo, aoSair, aoAviso, arquivos })
  atual.current = { alvo, aoSair, aoAviso, arquivos }
  const chave = chaveDoAlvo(alvo)

  useEffect(() => {
    const el = recipiente.current
    if (!el) return
    const acoesLink = (): AcoesLink => ({ abrirUrl, arquivo: atual.current.arquivos })
    const { term, ajustar } = criarXterm(el, lerFonte(chave), acoesLink)
    let terminalId: string | null = null
    let ativo = true
    const escrever = (dados: string): void => {
      if (terminalId) void window.lousa.terminais.escrever(terminalId, dados)
    }
    // Eventos que chegam antes da resposta de `abrir` ja estao no bufferInicial: ignorados.
    const cancelarDados = window.lousa.terminais.aoDados((id, dados) => {
      if (id === terminalId) term.write(dados)
    })
    const cancelarSaida = window.lousa.terminais.aoSair((id, codigo) => {
      if (id === terminalId) atual.current.aoSair?.(codigo)
    })
    window.lousa.terminais
      .abrir(atual.current.alvo, term.cols, term.rows)
      .then((r) => {
        if (!ativo) return
        terminalId = r.terminalId
        term.write(r.bufferInicial)
        if (r.aviso) atual.current.aoAviso?.(r.aviso)
      })
      .catch((e: unknown) => {
        term.write(`\r\n[erro] ${e instanceof Error ? e.message : String(e)}\r\n`)
      })

    const digitou = term.onData(escrever)
    const desligarTeclas = ligarTeclas(term, el, escrever)
    const links = ligarLinks(term, acoesLink)
    const tamanho = acompanharTamanho(el, term, ajustar, () => terminalId)
    ligarFonte(term, chave, tamanho.reajustar)

    return () => {
      ativo = false
      tamanho.parar()
      links.dispose()
      desligarTeclas()
      digitou.dispose()
      cancelarDados()
      cancelarSaida()
      term.dispose()
    }
  }, [chave])

  return <div ref={recipiente} className="terminal nodrag nowheel" />
}
