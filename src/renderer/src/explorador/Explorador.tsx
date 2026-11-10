// Lateral com as pastas em uso (T7.3), em cascata como o Explorer do VSCode.
// Sem marca de "alterado" (D17): o main so vigia as pastas abertas aqui, para a arvore
// mostrar arquivo novo ou apagado.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import '../estilos/explorador.css'
import { SimboloArquivo, SimboloPasta } from '../topo/Simbolos'
import { bolinhasDeEscrita, chavePasta, type Linha } from './arvore'
import { useEscritas } from './useEscritas'
import { useArvore } from './useArvore'
import { vigiarPastas } from './vigiar'

export interface Selecao {
  repoId: string
  relativo: string
}

interface Props {
  repos: Repo[]
  quadros: Quadro[]
  perfis: PerfilComConta[]
  selecionado: Selecao | null
  aviso: string | null
  aoAbrir(repoId: string, relativo: string): void
  /** As abas "Pastas | Historico" no alto (D48). */
  abas: React.ReactNode
  /** Com a aba "Historico" a mostra: fica montada (a arvore guarda o que estava aberto). */
  oculto: boolean
}

/** Uma bolinha na cor da conta de cada quadro aberto nesta pasta. */
function ContasDaPasta({ quadros, perfis }: { quadros: Quadro[]; perfis: PerfilComConta[] }): React.JSX.Element | null {
  if (quadros.length === 0) return null
  const nomes = quadros.map((q) => perfis.find((p) => p.id === q.perfilId)?.nome ?? 'conta removida')
  return (
    <span className="arvore-contas" title={`${quadros.length} quadro(s) aqui: ${nomes.join(', ')}`}>
      {quadros.map((q) => (
        <span
          key={q.id}
          className="bolinha"
          style={{ '--cor': corDa(q, perfis) } as CSSProperties}
        />
      ))}
    </span>
  )
}

const corDa = (q: Quadro | undefined, perfis: PerfilComConta[]): string =>
  perfis.find((p) => p.id === q?.perfilId)?.cor ?? '#666'

/** A16: uma bolinha piscando devagar por agente que esta salvando nesta pasta (o projeto dele). */
function EscrevendoAqui(p: { ids: string[]; quadros: Quadro[]; perfis: PerfilComConta[] }): React.JSX.Element {
  const deles = p.ids.map((id) => p.quadros.find((q) => q.id === id))
  const nomes = deles.map((q) => q?.papel || q?.titulo || 'agente')
  return (
    <span className="arvore-escrevendo" title={`Salvando aqui: ${nomes.join(', ')}`}>
      {deles.map((q, i) => (
        <span key={p.ids[i]} className="bolinha bolinha-escrevendo" style={{ '--cor': corDa(q, p.perfis) } as CSSProperties} />
      ))}
    </span>
  )
}

/**
 * D65: o agente comecou a mexer num projeto: a pasta dele abre na lateral, fica marcada e rola ate
 * aparecer. A marca fica ate outro projeto ser achado.
 */
function useProjetoAchado(abrir: (repoId: string, relativo: string) => void): string | null {
  const [marcado, setMarcado] = useState<string | null>(null)
  useEffect(
    () =>
      window.lousa.quadros.aoProjeto(({ repo }) => {
        abrir(repo.id, '')
        setMarcado(repo.id)
        // a pasta pode entrar na lista neste mesmo aviso: rola depois de desenhar
        window.setTimeout(() => document.querySelector(`.arvore [data-raiz="${CSS.escape(repo.id)}"]`)?.scrollIntoView({ block: 'nearest' }), 300)
      }),
    [abrir],
  )
  return marcado
}

interface LinhaProps {
  linha: Linha
  selecionada: boolean
  /** A pasta do projeto que um agente acabou de achar (D65). */
  projeto?: boolean
  extra?: React.ReactNode
  aoClicar(): void
}

const recuo = (nivel: number): number => 6 + nivel * 12

/** Linha de aviso dentro de uma pasta aberta: lendo, vazia ou o erro. */
function AvisoArvore({ linha }: { linha: Linha }): React.JSX.Element {
  const texto = linha.estado === 'carregando' ? 'Lendo…' : linha.estado === 'vazia' ? 'Pasta vazia' : linha.estado
  return (
    <div className="arvore-aviso" style={{ paddingLeft: recuo(linha.nivel) + 30 }}>
      {texto}
    </div>
  )
}

function LinhaArvore({ linha, selecionada, projeto, extra, aoClicar }: LinhaProps): React.JSX.Element {
  if (linha.estado) return <AvisoArvore linha={linha} />
  const classes = ['arvore-linha', linha.nivel === 0 && 'arvore-raiz', selecionada && 'arvore-selecionada', projeto && 'arvore-projeto']
  return (
    <button
      className={classes.filter(Boolean).join(' ')}
      style={{ paddingLeft: recuo(linha.nivel) }}
      role="treeitem"
      data-raiz={linha.nivel === 0 ? linha.repoId : undefined}
      aria-expanded={linha.pasta ? linha.aberta : undefined}
      aria-selected={selecionada}
      title={linha.relativo || linha.nome}
      onClick={aoClicar}
    >
      <span className={`seta${linha.pasta ? '' : ' seta-vazia'}${linha.aberta ? ' seta-aberta' : ''}`}>›</span>
      {linha.pasta ? <SimboloPasta aberta={linha.aberta} /> : <SimboloArquivo />}
      <span className="arvore-nome">{linha.nome}</span>
      {extra}
    </button>
  )
}

export function Explorador(props: Props): React.JSX.Element {
  const { repos, quadros, perfis, selecionado, aviso, aoAbrir } = props
  const { linhas, alternar, abrir, recolherTudo, aoMudarArquivos } = useArvore(repos)
  const projetoAchado = useProjetoAchado(abrir)

  useEffect(() => window.lousa.arquivos.aoMudar(aoMudarArquivos), [aoMudarArquivos])

  // so agentes que ainda estao na lousa
  const escritas = useEscritas()
  const bolinhas = useMemo(
    () => bolinhasDeEscrita(linhas, escritas.filter((e) => quadros.some((q) => q.id === e.quadroId))),
    [linhas, escritas, quadros],
  )

  // o main vigia so as pastas abertas que aparecem na arvore
  // (o vigiarPastas ja ignora pedido igual ao anterior)
  const abertas = useMemo(
    () => linhas.filter((l) => l.pasta && l.aberta).map((l) => ({ repoId: l.repoId, relativo: l.relativo })),
    [linhas],
  )
  useEffect(() => vigiarPastas('arvore', abertas), [abertas])
  useEffect(() => () => vigiarPastas('arvore', []), [])

  return (
    <aside className="explorador" aria-label="Pastas" hidden={props.oculto}>
      <header className="explorador-topo">
        {props.abas}
        {repos.length > 0 && (
          <button className="botao-pequeno" title="Fechar todas as pastas" onClick={recolherTudo}>
            Recolher
          </button>
        )}
      </header>
      <div className="arvore" role="tree">
        {repos.length === 0 && (
          <p className="apagado explorador-vazio">
            Nenhuma pasta ainda. Abra um quadro (“+ Novo quadro”) e a pasta dele aparece aqui.
          </p>
        )}
        {linhas.map((l) => (
          <LinhaArvore
            key={`${l.repoId}|${l.relativo}|${l.estado ?? ''}`}
            linha={l}
            selecionada={selecionado?.repoId === l.repoId && selecionado.relativo === l.relativo}
            projeto={l.nivel === 0 && l.repoId === projetoAchado}
            extra={
              <>
                {l.nivel === 0 && (
                  // o agente que mexe neste projeto (D65) tambem tem a bolinha aqui
                  <ContasDaPasta quadros={quadros.filter((q) => q.repoId === l.repoId || q.projeto === l.repoId)} perfis={perfis} />
                )}
                {bolinhas.has(chavePasta(l.repoId, l.relativo)) && (
                  <EscrevendoAqui ids={bolinhas.get(chavePasta(l.repoId, l.relativo)) ?? []} quadros={quadros} perfis={perfis} />
                )}
              </>
            }
            aoClicar={() => (l.pasta ? alternar(l.repoId, l.relativo) : aoAbrir(l.repoId, l.relativo))}
          />
        ))}
      </div>
      {aviso && (
        <p className="explorador-nota" role="status">
          {aviso}
        </p>
      )}
    </aside>
  )
}
