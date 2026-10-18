import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import type { AlvoTerminal } from '../../../shared/model'
import '../estilos/terminal.css'

interface Props {
  alvo: AlvoTerminal
  aoSair?: (codigo: number) => void
}

const chaveDoAlvo = (alvo: AlvoTerminal): string =>
  alvo.tipo === 'login' ? `login:${alvo.perfilId}` : `quadro:${alvo.quadroId}`

/**
 * Terminal xterm.js ligado a um terminal que vive no main (D8): desmontar
 * este componente NAO fecha o terminal, so para de mostrá-lo.
 */
export function Terminal({ alvo, aoSair }: Props): React.JSX.Element {
  const recipiente = useRef<HTMLDivElement>(null)
  const alvoAtual = useRef(alvo)
  const aoSairAtual = useRef(aoSair)
  alvoAtual.current = alvo
  aoSairAtual.current = aoSair
  const chave = chaveDoAlvo(alvo)

  useEffect(() => {
    const el = recipiente.current
    if (!el) return
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Cascadia Mono, Consolas, monospace',
      fontSize: 13,
      theme: { background: '#0b0d12' },
      // Necessario para term.unicode (API marcada como "proposta" no xterm).
      allowProposedApi: true,
    })
    // Emoji como ❌ e 🟡 ocupam 2 colunas no Claude Code; sem a tabela Unicode 11 o xterm conta 1,
    // e cada redesenho escreve na coluna errada: palavras se misturam (print de 17/10/2026).
    term.loadAddon(new Unicode11Addon())
    term.unicode.activeVersion = '11'
    const ajustar = new FitAddon()
    term.loadAddon(ajustar)
    term.open(el)
    ajustar.fit()

    let terminalId: string | null = null
    let ativo = true
    // Eventos que chegam antes da resposta de `abrir` ja estao no bufferInicial: ignorados.
    const cancelarDados = window.lousa.terminais.aoDados((id, dados) => {
      if (id === terminalId) term.write(dados)
    })
    const cancelarSaida = window.lousa.terminais.aoSair((id, codigo) => {
      if (id === terminalId) aoSairAtual.current?.(codigo)
    })
    window.lousa.terminais
      .abrir(alvoAtual.current, term.cols, term.rows)
      .then((r) => {
        if (!ativo) return
        terminalId = r.terminalId
        term.write(r.bufferInicial)
      })
      .catch((e: unknown) => {
        term.write(`\r\n[erro] ${e instanceof Error ? e.message : String(e)}\r\n`)
      })

    const digitou = term.onData((dados) => {
      if (terminalId) void window.lousa.terminais.escrever(terminalId, dados)
    })
    let relogio: ReturnType<typeof setTimeout> | undefined
    const observador = new ResizeObserver(() => {
      clearTimeout(relogio)
      relogio = setTimeout(() => {
        ajustar.fit()
        if (terminalId) void window.lousa.terminais.redimensionar(terminalId, term.cols, term.rows)
      }, 100)
    })
    observador.observe(el)

    return () => {
      ativo = false
      clearTimeout(relogio)
      observador.disconnect()
      digitou.dispose()
      cancelarDados()
      cancelarSaida()
      term.dispose()
    }
  }, [chave])

  return <div ref={recipiente} className="terminal nodrag nowheel" />
}
