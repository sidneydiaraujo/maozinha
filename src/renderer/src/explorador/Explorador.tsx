// Lateral com as pastas em uso (T7.3), em cascata como o Explorer do VSCode.
// Arquivo que um terminal mexeu fica marcado (e a marca sobe para as pastas);
// "Alterados agora" lista os mais recentes.
import { useEffect, useMemo, type CSSProperties } from 'react'
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import '../estilos/explorador.css'
import { SimboloArquivo, SimboloPasta } from '../topo/Simbolos'
import { haQuanto, marcaDaPasta, marcaDoArquivo, recentes, type Marca, type Recente } from './alterados'
import { pastaDe, type Linha } from './arvore'
import { useAlterados } from './useAlterados'
import { useArvore } from './useArvore'

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
}

const TEXTO_MARCA: Record<Exclude<Marca, null>, string> = {
  escrevendo: 'Um terminal está escrevendo aqui agora',
  alterado: 'Mexido por um terminal há pouco',
}

const nomeDe = (relativo: string): string => relativo.slice(relativo.lastIndexOf('/') + 1)

function Bolinha({ marca }: { marca: Marca }): React.JSX.Element | null {
  return marca ? <span className={`marca marca-${marca}`} title={TEXTO_MARCA[marca]} /> : null
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
          style={{ '--cor': perfis.find((p) => p.id === q.perfilId)?.cor ?? '#666' } as CSSProperties}
        />
      ))}
    </span>
  )
}

interface LinhaProps {
  linha: Linha
  marca: Marca
  selecionada: boolean
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

function LinhaArvore({ linha, marca, selecionada, extra, aoClicar }: LinhaProps): React.JSX.Element {
  if (linha.estado) return <AvisoArvore linha={linha} />
  const classes = ['arvore-linha', linha.nivel === 0 && 'arvore-raiz', selecionada && 'arvore-selecionada']
  return (
    <button
      className={classes.filter(Boolean).join(' ')}
      style={{ paddingLeft: recuo(linha.nivel) }}
      role="treeitem"
      aria-expanded={linha.pasta ? linha.aberta : undefined}
      aria-selected={selecionada}
      title={linha.relativo || linha.nome}
      onClick={aoClicar}
    >
      <span className={`seta${linha.pasta ? '' : ' seta-vazia'}${linha.aberta ? ' seta-aberta' : ''}`}>›</span>
      {linha.pasta ? <SimboloPasta aberta={linha.aberta} /> : <SimboloArquivo />}
      <span className={`arvore-nome${marca && !linha.pasta ? ' arvore-nome-alterado' : ''}`}>{linha.nome}</span>
      {extra}
      <Bolinha marca={marca} />
    </button>
  )
}

interface RecentesProps {
  itens: Recente[]
  repos: Repo[]
  agora: number
  marca(r: Recente): Marca
  aoAbrir(repoId: string, relativo: string): void
}

function Recentes({ itens, repos, agora, marca, aoAbrir }: RecentesProps): React.JSX.Element | null {
  if (itens.length === 0) return null
  return (
    <section className="recentes" aria-label="Alterados agora">
      <h3 className="explorador-secao">Alterados agora</h3>
      {itens.map((r) => {
        const repo = repos.find((x) => x.id === r.repoId)
        const onde = [repo?.nome, pastaDe(r.relativo)].filter(Boolean).join('/')
        return (
          <button
            key={`${r.repoId}|${r.relativo}`}
            className="recente"
            title={`${onde}/${nomeDe(r.relativo)}`}
            onClick={() => aoAbrir(r.repoId, r.relativo)}
          >
            <Bolinha marca={marca(r)} />
            <span className="recente-nome">{nomeDe(r.relativo)}</span>
            <span className="recente-onde">
              {onde} · {haQuanto(r.quando, agora)}
            </span>
          </button>
        )
      })}
    </section>
  )
}

export function Explorador({ repos, quadros, perfis, selecionado, aviso, aoAbrir }: Props): React.JSX.Element {
  const { linhas, alternar, recolherTudo, aoMudarArquivos } = useArvore(repos)
  const { alterados, agora, anotarMudancas } = useAlterados()

  useEffect(
    () =>
      window.lousa.arquivos.aoMudar((repoId, caminhos) => {
        anotarMudancas(repoId, caminhos)
        aoMudarArquivos(repoId, caminhos)
      }),
    [anotarMudancas, aoMudarArquivos],
  )

  const ultimos = useMemo(() => recentes(alterados, agora), [alterados, agora])
  const marcaDe = (l: Linha): Marca =>
    l.pasta
      ? marcaDaPasta(alterados, l.repoId, l.relativo, agora)
      : marcaDoArquivo(alterados, l.repoId, l.relativo, agora)

  return (
    <aside className="explorador" aria-label="Pastas">
      <header className="explorador-topo">
        <h2 className="barra-titulo">Pastas</h2>
        {repos.length > 0 && (
          <button className="botao-pequeno" title="Fechar todas as pastas" onClick={recolherTudo}>
            Recolher
          </button>
        )}
      </header>
      <Recentes
        itens={ultimos}
        repos={repos}
        agora={agora}
        marca={(r) => marcaDoArquivo(alterados, r.repoId, r.relativo, agora)}
        aoAbrir={aoAbrir}
      />
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
            marca={l.estado ? null : marcaDe(l)}
            selecionada={selecionado?.repoId === l.repoId && selecionado.relativo === l.relativo}
            extra={
              l.nivel === 0 ? (
                <ContasDaPasta quadros={quadros.filter((q) => q.repoId === l.repoId)} perfis={perfis} />
              ) : undefined
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
