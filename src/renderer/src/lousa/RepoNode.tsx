import { NodeResizer, type NodeProps } from '@xyflow/react'
import { useState } from 'react'
import type { PerfilComConta, TipoQuadro } from '../../../shared/model'
import { MenuRepo } from './MenuRepo'
import type { AcoesLousa, RepoNo } from './nos'

interface BotaoProps {
  rotulo: string
  tipo: TipoQuadro
  perfis: PerfilComConta[]
  nomeDoPadrao: string
  aoCriar(tipo: TipoQuadro, perfilId?: string): void
}

/** "+ Terminal" / "+ Agente": o botao usa a conta padrao; a seta lista as outras contas. */
function BotaoCriar({ rotulo, tipo, perfis, nomeDoPadrao, aoCriar }: BotaoProps): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  return (
    <span className="botao-criar nodrag">
      <button className="botao-pequeno" title={`Conta: ${nomeDoPadrao}`} onClick={() => aoCriar(tipo)}>
        {rotulo}
      </button>
      <button
        className="botao-pequeno seta"
        aria-label={`${rotulo}: escolher outra conta`}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        ▾
      </button>
      {aberto &&
        perfis.map((p) => (
          <button
            key={p.id}
            className="botao-pequeno chip-conta"
            style={{ '--cor': p.cor } as React.CSSProperties}
            onClick={() => {
              setAberto(false)
              aoCriar(tipo, p.id)
            }}
          >
            {p.nome}
          </button>
        ))}
    </span>
  )
}

interface PrimeiroProps {
  repoId: string
  perfis: PerfilComConta[]
  acoes: AcoesLousa
}

/** Moldura sem quadros: mostra o proximo passo com um botao por conta, em vez de deixar o usuario procurar. */
function PrimeiroQuadro({ repoId, perfis, acoes }: PrimeiroProps): React.JSX.Element {
  return (
    <div className="primeiro-quadro nodrag">
      <p>Abra um agente do Claude nesta pasta. Cada botão usa uma conta:</p>
      <div className="primeiro-quadro-botoes">
        {perfis.map((p) => (
          <button
            key={p.id}
            className="botao-grande"
            style={{ '--cor': p.cor } as React.CSSProperties}
            onClick={() => acoes.criarQuadro(repoId, 'agente', p.id)}
          >
            + Claude · {p.nome}
          </button>
        ))}
        <button className="botao-grande neutro" onClick={() => acoes.criarQuadro(repoId, 'terminal')}>
          + Terminal
        </button>
      </div>
    </div>
  )
}

export function RepoNode({ data, selected }: NodeProps<RepoNo>): React.JSX.Element {
  const { repo, perfis, acoes, vazio } = data
  const padrao = perfis.find((p) => p.id === repo.perfilPadraoId)
  return (
    <div className="moldura">
      <NodeResizer minWidth={520} minHeight={360} isVisible={selected} />
      <header className="cabecalho-repo">
        <div className="repo-titulo">
          <strong>{repo.nome}</strong>
          <span className="repo-caminho" title={repo.caminho}>
            {repo.caminho}
          </span>
        </div>
        <div className="repo-acoes">
          <BotaoCriar
            rotulo="+ Terminal"
            tipo="terminal"
            perfis={perfis}
            nomeDoPadrao={padrao?.nome ?? '—'}
            aoCriar={(tipo, perfilId) => acoes.criarQuadro(repo.id, tipo, perfilId)}
          />
          <BotaoCriar
            rotulo="+ Agente"
            tipo="agente"
            perfis={perfis}
            nomeDoPadrao={padrao?.nome ?? '—'}
            aoCriar={(tipo, perfilId) => acoes.criarQuadro(repo.id, tipo, perfilId)}
          />
          <MenuRepo
            repo={repo}
            perfis={perfis}
            aoMudarPadrao={(perfilId) => acoes.mudarPerfilPadrao(repo.id, perfilId)}
            aoRemover={() => acoes.removerRepo(repo.id)}
          />
        </div>
      </header>
      {vazio && <PrimeiroQuadro repoId={repo.id} perfis={perfis} acoes={acoes} />}
    </div>
  )
}
