import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef, useState } from 'react'
import type { AlvoTerminal, AvisoAgente } from '../../../shared/model'
import '../estilos/terminal.css'
import { guardarFonte, lerFonte, proximaFonte } from './fonte'
import { BuscaTerminal } from './BuscaTerminal'
import { ligarDesenhista } from './desenhista'
import { ligarEscala } from './escala'
import { EVENTO_VISTA_PAROU, ligarNitidez, type Nitidez } from './nitidez'
import { arquivoDeUri, ligarLinks, type AcoesLink } from './links'
import { ligarSoltar } from './soltar'
import { ligarTeclas } from './teclas'
import { aoMudarAparencia, familiaDaFonte, lerAparencia, temaDoXterm, type Aparencia } from './tema'

interface Props {
  alvo: AlvoTerminal
  aoSair?: (codigo: number) => void
  /** Ultimo estado do agente, que o main guardou enquanto a tela nao estava montada (T8.2). */
  aoAviso?: (aviso: AvisoAgente) => void
  /** Caminho citado no terminal vira link (T8.3); `aceita` = esta dentro da pasta do quadro. */
  arquivos?: AcoesLink['arquivo']
  /** Zoom da lousa: o terminal redesenha a letra no tamanho da tela (A1). Sem ele, 100%. */
  zoom?: number
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

/** O fundo do quadro em volta do terminal acompanha a paleta (variavel CSS na raiz). */
function pintarFundo(aparencia: Aparencia): void {
  document.documentElement.style.setProperty('--terminal-fundo', temaDoXterm(aparencia.paleta).background ?? '')
}

function criarXterm(el: HTMLElement, fonte: number, acoes: () => AcoesLink): { term: XTerm; ajustar: FitAddon } {
  const aparencia = lerAparencia()
  pintarFundo(aparencia)
  const term = new XTerm({
    cursorBlink: true,
    fontFamily: familiaDaFonte(aparencia.fonte),
    fontSize: fonte,
    lineHeight: aparencia.entrelinha,
    scrollback: HISTORICO,
    theme: temaDoXterm(aparencia.paleta),
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
function ligarFonte(term: XTerm, chave: string, nitidez: Nitidez): void {
  term.attachCustomWheelEventHandler((e) => {
    if (!e.ctrlKey) return true
    e.preventDefault()
    const tamanho = proximaFonte(nitidez.base(), e.deltaY)
    if (tamanho !== nitidez.base()) {
      guardarFonte(chave, tamanho)
      nitidez.fonte(tamanho)
    }
    return false
  })
}

/** Mudou a Aparencia na engrenagem (T15.1): troca na hora, sem reabrir o terminal. */
function ligarAparencia(term: XTerm, chave: string, nitidez: Nitidez): () => void {
  return aoMudarAparencia((aparencia) => {
    pintarFundo(aparencia)
    term.options.fontFamily = familiaDaFonte(aparencia.fonte)
    term.options.lineHeight = aparencia.entrelinha
    term.options.theme = temaDoXterm(aparencia.paleta)
    // quadro sem Ctrl+roda guardado segue o tamanho novo; o outro fica como esta
    nitidez.fonte(lerFonte(chave))
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
  let enviado = ''
  const reajustar = (): void => {
    clearTimeout(relogio)
    relogio = setTimeout(() => {
      ajustar.fit()
      const terminalId = id()
      // o zoom da lousa (A1) troca a letra e reajusta, quase sempre sem mudar colunas e linhas:
      // so avisa o programa quando mudou, para ele nao redesenhar a tela a toa
      const medida = `${terminalId}:${term.cols}x${term.rows}`
      if (terminalId && medida !== enviado) {
        enviado = medida
        void window.lousa.terminais.redimensionar(terminalId, term.cols, term.rows)
      }
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
export function Terminal({ alvo, aoSair, aoAviso, arquivos, zoom = 1 }: Props): React.JSX.Element {
  const recipiente = useRef<HTMLDivElement>(null)
  const nitidez = useRef<Nitidez | null>(null)
  // Ctrl+F (T12.2): o xterm vivo fica aqui para a busca ler o historico
  const [busca, setBusca] = useState<XTerm | null>(null)
  const atual = useRef({ alvo, aoSair, aoAviso, arquivos, zoom })
  atual.current = { alvo, aoSair, aoAviso, arquivos, zoom }
  const chave = chaveDoAlvo(alvo)

  useEffect(() => {
    const el = recipiente.current
    if (!el) return
    const acoesLink = (): AcoesLink => ({ abrirUrl, arquivo: atual.current.arquivos })
    const { term, ajustar } = criarXterm(el, lerFonte(chave), acoesLink)
    const soltarDesenhista = ligarDesenhista(term, el)
    // selecao, duplo clique e link no lugar certo com a lousa fora de 100%
    const desligarEscala = ligarEscala(el)
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
    const desligarTeclas = ligarTeclas(term, el, escrever, () => setBusca(term))
    const links = ligarLinks(term, acoesLink)
    const desligarSoltar = ligarSoltar(el, (texto) => term.paste(texto))
    const tamanho = acompanharTamanho(el, term, ajustar, () => terminalId)
    const nitido = ligarNitidez(el, term, lerFonte(chave), tamanho.reajustar)
    nitido.zoom(atual.current.zoom)
    nitidez.current = nitido
    window.addEventListener(EVENTO_VISTA_PAROU, nitido.alinhar)
    ligarFonte(term, chave, nitido)
    const pararAparencia = ligarAparencia(term, chave, nitido)

    return () => {
      ativo = false
      nitidez.current = null
      window.removeEventListener(EVENTO_VISTA_PAROU, nitido.alinhar)
      pararAparencia()
      tamanho.parar()
      links.dispose()
      desligarSoltar()
      desligarTeclas()
      digitou.dispose()
      cancelarDados()
      cancelarSaida()
      setBusca(null)
      soltarDesenhista()
      desligarEscala()
      term.dispose()
    }
  }, [chave])

  // o zoom muda a cada quadro de animacao da lousa: redesenha so quando parar
  useEffect(() => {
    const t = window.setTimeout(() => nitidez.current?.zoom(zoom), 150)
    return () => window.clearTimeout(t)
  }, [zoom])

  return (
    <div className="terminal-moldura">
      <div ref={recipiente} className="terminal nodrag nowheel" />
      {busca && <BuscaTerminal term={busca} aoFechar={() => setBusca(null)} />}
    </div>
  )
}
