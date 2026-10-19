import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Repo, ResumoCopia } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { frasesDoResumo } from './copia'

interface Props {
  repo: Repo
  cor: string
  aoFechar(): void
  /** Depois de juntar: fecha o quadro, e a copia (ja juntada) e apagada sem perder nada. */
  aoFecharQuadro(): void
}

type Fase = { tipo: 'lendo' } | { tipo: 'pronto'; resumo: ResumoCopia } | { tipo: 'juntando' } | { tipo: 'juntou'; alvo: string }


function ListaArquivos({ resumo }: { resumo: ResumoCopia }): React.JSX.Element {
  return (
    <ul className="juntar-arquivos">
      {resumo.arquivos.map((a) => (
        <li key={a.caminho}>
          <span>{a.caminho}</span>
          <span className="juntar-mais">+{a.mais}</span>
          <span className="juntar-menos">−{a.menos}</span>
        </li>
      ))}
      {resumo.totalArquivos > resumo.arquivos.length && <li>… e mais {resumo.totalArquivos - resumo.arquivos.length}</li>}
    </ul>
  )
}

/** "Juntar" (T11.2, D19): mostra o que a copia mudou e faz o merge na pasta original. */
export function JanelaJuntar({ repo, cor, aoFechar, aoFecharQuadro }: Props): React.JSX.Element {
  const [fase, setFase] = useState<Fase>({ tipo: 'lendo' })
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    window.lousa.copias
      .resumo(repo.id)
      .then((resumo) => ativo && setFase({ tipo: 'pronto', resumo }))
      .catch((e: unknown) => ativo && setErro(mensagemDe(e)))
    return () => {
      ativo = false
    }
  }, [repo.id])

  async function juntar(): Promise<void> {
    setErro(null)
    const antes = fase
    setFase({ tipo: 'juntando' })
    try {
      const { branchAlvo } = await window.lousa.copias.juntar(repo.id)
      setFase({ tipo: 'juntou', alvo: branchAlvo })
    } catch (e) {
      setErro(mensagemDe(e))
      setFase(antes)
    }
  }

  return createPortal(
    <div className="janela-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div
        className="janela janela-juntar"
        role="dialog"
        aria-label="Juntar a cópia"
        style={{ '--cor': cor } as React.CSSProperties}
      >
        <h2 className="janela-titulo">Juntar {repo.nome}</h2>
        <CorpoJuntar fase={fase} erro={erro} />
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <BotoesJuntar fase={fase} aoJuntar={() => void juntar()} aoFechar={aoFechar} aoFecharQuadro={aoFecharQuadro} />
      </div>
    </div>,
    document.body,
  )
}

function CorpoJuntar({ fase, erro }: { fase: Fase; erro: string | null }): React.JSX.Element | null {
  if (fase.tipo === 'lendo') return erro ? null : <p>Lendo o que a cópia mudou…</p>
  if (fase.tipo === 'juntando') return <p>Juntando…</p>
  if (fase.tipo === 'juntou') {
    return (
      <p>
        ✓ Juntado em <strong>{fase.alvo}</strong>. A cópia não tem mais nada só dela: fechar o quadro apaga a cópia e a
        branch.
      </p>
    )
  }
  const frases = frasesDoResumo(fase.resumo)
  return (
    <>
      <p>{frases.titulo}</p>
      {frases.aviso && <p className="juntar-aviso">{frases.aviso}</p>}
      {fase.resumo.arquivos.length > 0 && <ListaArquivos resumo={fase.resumo} />}
    </>
  )
}

function BotoesJuntar(p: { fase: Fase; aoJuntar(): void; aoFechar(): void; aoFecharQuadro(): void }): React.JSX.Element {
  const { fase } = p
  const juntou = fase.tipo === 'juntou'
  return (
    <div className="juntar-botoes">
      {fase.tipo === 'pronto' && fase.resumo.commits > 0 && (
        <button className="botao-principal" onClick={p.aoJuntar}>
          Juntar em {fase.resumo.branchAlvo}
        </button>
      )}
      {juntou && (
        <button className="botao-principal" onClick={p.aoFecharQuadro}>
          Fechar o quadro e apagar a cópia
        </button>
      )}
      <button className="botao-pequeno" onClick={p.aoFechar}>
        {juntou ? 'Continuar trabalhando nela' : 'Cancelar'}
      </button>
    </div>
  )
}
