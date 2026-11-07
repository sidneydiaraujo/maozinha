import { useEffect, useState } from 'react'
import type { PerfilComConta, Quadro, Repo, TipoQuadro } from '../../../shared/model'
import { sugerirSeparado } from './copia'
import { PastasRecentes } from './PastasRecentes'

interface Props {
  perfis: PerfilComConta[]
  repos: Repo[]
  /** Quadros abertos: pasta que ja tem quadro sugere a copia separada (D18). */
  quadros: Quadro[]
  /** Veio de arrastar o cartao da conta: ja vem marcada. */
  perfilInicial?: string
  /** Veio do Ctrl+K "Novo quadro em <pasta>" (T12.1): ja vem marcada. */
  repoInicial?: string
  /** Onde a janelinha aparece, em pixels da tela. */
  tela: { x: number; y: number }
  aoCriar(repoId: string, tipo: TipoQuadro, perfilId: string, opcoes: { separado: boolean; kanban: boolean }): Promise<void>
  aoNovaPasta(repo: Repo): void
  aoTirarPasta(repoId: string): Promise<void>
  aoCancelar(): void
}

const LARGURA = 340
const ALTURA_MAX = 460

/** Pasta onde esta conta trabalhou por ultimo; senao a pasta mais recente. */
function pastaSugerida(repos: Repo[], perfilId: string): string | null {
  const daConta = [...repos].reverse().find((r) => r.perfilPadraoId === perfilId)
  return daConta?.id ?? repos[repos.length - 1]?.id ?? null
}

function ChipsConta(p: { perfis: PerfilComConta[]; marcada: string; aoMarcar(id: string): void }): React.JSX.Element {
  return (
    <div className="novo-opcoes" role="radiogroup" aria-label="Conta">
      {p.perfis.map((perfil) => (
        <button
          key={perfil.id}
          role="radio"
          aria-checked={perfil.id === p.marcada}
          className="chip-escolha"
          style={{ '--cor': perfil.cor } as React.CSSProperties}
          onClick={() => p.aoMarcar(perfil.id)}
        >
          {perfil.nome}
        </button>
      ))}
    </div>
  )
}

/** "Cópia separada" (T10.4, D18): branch e pasta proprias para o quadro novo. */
function CaixaCopia(p: { marcada: boolean; sugerida: boolean; aceita: boolean; aoMudar(v: boolean): void }): React.JSX.Element {
  return (
    <label className="novo-copia" title="Uma cópia do repositório (git worktree) com uma branch só deste quadro">
      <input type="checkbox" checked={p.marcada} disabled={!p.aceita} onChange={(e) => p.aoMudar(e.target.checked)} />
      <span>
        Cópia separada (branch própria)
        {/* R1.5: antes a caixa vinha marcada em pasta sem git e o Criar era recusado */}
        {!p.aceita && <small>Só na pasta principal de um repositório git; esta não é.</small>}
        {p.aceita && p.sugerida && <small>Já tem um quadro nesta pasta: assim um não mexe no trabalho do outro.</small>}
      </span>
    </label>
  )
}

/** A pasta marcada aceita copia separada? Enquanto o main nao respondeu, sim (como antes). */
function useAceitaCopia(repoId: string | null): boolean {
  const [resposta, setResposta] = useState<{ repoId: string; sim: boolean } | null>(null)
  useEffect(() => {
    if (!repoId) return
    let valendo = true
    window.lousa.copias
      .aceita(repoId)
      .then((sim) => valendo && setResposta({ repoId, sim }))
      .catch(() => valendo && setResposta({ repoId, sim: true }))
    return () => {
      valendo = false
    }
  }, [repoId])
  return resposta?.repoId !== repoId || resposta.sim
}

/**
 * "Kanban do projeto" (A22): o agente segue o KANBAN.md do projeto. Ja vem marcada quando o projeto
 * tem um (o mesmo para todos os agentes dele); desmarcada, o agente abre sem kanban.
 */
function CaixaKanban(p: { marcada: boolean; existe: boolean; aoMudar(v: boolean): void }): React.JSX.Element {
  return (
    <label className="novo-copia novo-kanban" title="Um KANBAN.md por projeto, fora do git, que os agentes atualizam a cada etapa">
      <input type="checkbox" checked={p.marcada} onChange={(e) => p.aoMudar(e.target.checked)} />
      <span>
        Kanban do projeto (só agente)
        <small>
          {p.existe
            ? 'Este projeto já tem um KANBAN.md: o agente usa o mesmo.'
            : 'O agente cria um KANBAN.md e anota nele o andamento das tarefas.'}
        </small>
      </span>
    </label>
  )
}

/** O projeto da pasta marcada ja tem kanban? (o main procura; a tela so manda o id) */
function useKanbanDaPasta(repoId: string | null): boolean {
  const [existe, setExiste] = useState<{ repoId: string; sim: boolean } | null>(null)
  useEffect(() => {
    if (!repoId) return
    let valendo = true
    window.lousa.repos
      .temKanban(repoId)
      .then((sim) => valendo && setExiste({ repoId, sim }))
      .catch(() => valendo && setExiste({ repoId, sim: false }))
    return () => {
      valendo = false
    }
  }, [repoId])
  return existe?.repoId === repoId && existe.sim
}

function BotoesAbrir(p: { desligado: boolean; aoAbrir(tipo: TipoQuadro): void }): React.JSX.Element {
  return (
    <div className="novo-botoes">
      <button className="botao-principal" disabled={p.desligado} onClick={() => p.aoAbrir('agente')}>
        Abrir agente
      </button>
      <button className="botao-pequeno" disabled={p.desligado} onClick={() => p.aoAbrir('terminal')}>
        Abrir terminal
      </button>
    </div>
  )
}

/**
 * "Novo quadro" (T5.3, D14): conta + pasta no mesmo gesto. Unica forma de abrir um quadro;
 * chega pelo botao "+ Novo quadro", duplo clique na lousa ou arrastando o cartao da conta.
 */
/** Conta, pasta e copia marcadas na janelinha, com as sugestoes de cada uma. */
function useEscolhas({ perfis, repos, quadros, perfilInicial, repoInicial }: Props) {
  const inicial = repos.find((r) => r.id === repoInicial)
  // Sem conta marcada: a ultima usada na pasta pedida, ou na pasta mais recente.
  const [perfilId, setPerfilId] = useState(
    perfilInicial ?? (inicial ?? repos[repos.length - 1])?.perfilPadraoId ?? perfis[0]?.id ?? '',
  )
  const [escolhida, setRepoId] = useState<string | null>(() => inicial?.id ?? pastaSugerida(repos, perfilId))
  // A pasta marcada pode ter sido tirada da lista: volta para a sugerida.
  const repoId = repos.some((r) => r.id === escolhida) ? escolhida : pastaSugerida(repos, perfilId)
  // null = segue a sugestao da pasta marcada; trocar de pasta volta para a sugestao
  const [separadoEscolhido, setSeparado] = useState<boolean | null>(null)
  const aceitaCopia = useAceitaCopia(repoId)
  const sugerida = aceitaCopia && sugerirSeparado(quadros, repoId)
  // kanban (A22): null = segue o projeto (marcada se ele ja tem um); trocar de pasta volta para isso
  const [kanbanEscolhido, setKanban] = useState<boolean | null>(null)
  const kanbanExiste = useKanbanDaPasta(repoId)
  const marcarPasta = (id: string): void => {
    setRepoId(id)
    setSeparado(null)
    setKanban(null)
  }
  return {
    perfilId,
    setPerfilId,
    repoId,
    marcarPasta,
    sugerida,
    separado: aceitaCopia && (separadoEscolhido ?? sugerida),
    aceitaCopia,
    setSeparado,
    kanban: kanbanEscolhido ?? kanbanExiste,
    kanbanExiste,
    setKanban,
  }
}

export function NovoQuadro(props: Props): React.JSX.Element {
  const { perfis, repos, perfilInicial, tela, aoCriar, aoNovaPasta, aoTirarPasta, aoCancelar } = props
  const escolhas = useEscolhas(props)
  const { perfilId, setPerfilId, repoId, marcarPasta, sugerida, separado, setSeparado } = escolhas
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function abrir(tipo: TipoQuadro): Promise<void> {
    if (!repoId || ocupado) return
    setOcupado(true)
    setErro(null)
    try {
      await aoCriar(repoId, tipo, perfilId, { separado, kanban: escolhas.kanban })
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
      setOcupado(false)
    }
  }

  async function outraPasta(): Promise<void> {
    setErro(null)
    try {
      const escolha = await window.lousa.repos.escolherPasta()
      if (!escolha) return
      const conta = perfilInicial ?? escolha.sugestaoPerfilId ?? perfilId
      const repo = await window.lousa.repos.adicionar(escolha.caminho, conta)
      aoNovaPasta(repo)
      setPerfilId(conta)
      marcarPasta(repo.id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') aoCancelar()
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) void abrir('agente')
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  const left = Math.max(8, Math.min(tela.x, window.innerWidth - LARGURA - 8))
  const top = Math.max(8, Math.min(tela.y, window.innerHeight - ALTURA_MAX - 8))
  return (
    <>
      <div className="novo-fundo" onMouseDown={aoCancelar} />
      <div className="novo-quadro" role="dialog" aria-label="Novo quadro" style={{ left, top, width: LARGURA }}>
        <p className="novo-rotulo">Conta · quem paga</p>
        <ChipsConta perfis={perfis} marcada={perfilId} aoMarcar={setPerfilId} />
        <p className="novo-rotulo">Pasta · onde o trabalho fica</p>
        {repos.length > 0 && (
          <PastasRecentes
            repos={repos}
            marcada={repoId}
            aoMarcar={marcarPasta}
            aoTirar={(id) =>
              aoTirarPasta(id).catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)))
            }
          />
        )}
        <button className="botao-pequeno" onClick={() => void outraPasta()}>
          {repos.length > 0 ? 'Outra pasta…' : 'Escolher pasta…'}
        </button>
        {repoId && (
          <CaixaCopia marcada={separado} sugerida={sugerida} aceita={escolhas.aceitaCopia} aoMudar={setSeparado} />
        )}
        {repoId && (
          <CaixaKanban marcada={escolhas.kanban} existe={escolhas.kanbanExiste} aoMudar={escolhas.setKanban} />
        )}
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <BotoesAbrir desligado={!repoId || ocupado} aoAbrir={(tipo) => void abrir(tipo)} />
      </div>
    </>
  )
}
