// "Git e GitHub" no cartao da conta (C1, D42): nome e e-mail dos commits e, se quiser, o login do
// GitHub so desta conta. O main valida e guarda; aqui so o formulario.
import { useState } from 'react'
import type { GitDaConta, PerfilComConta } from '../../../shared/model'
import { mensagemDe } from './erro'

interface Props {
  perfil: PerfilComConta
  aoSalvar(git: GitDaConta | null): Promise<void>
}

/** Uma linha para o resumo fechado. */
function resumo(git: GitDaConta | undefined): string {
  if (!git) return 'usa o do PC'
  const quem = git.email ?? git.nome ?? 'autor do PC'
  return git.githubProprio ? `${quem} · GitHub próprio` : quem
}

export function GitDaContaSecao({ perfil, aoSalvar }: Props): React.JSX.Element {
  const git = perfil.git
  const [nome, setNome] = useState(git?.nome ?? '')
  const [email, setEmail] = useState(git?.email ?? '')
  const [proprio, setProprio] = useState(git?.githubProprio ?? false)
  const [estado, setEstado] = useState<{ salvando: boolean; erro: string | null; salvo: boolean }>({
    salvando: false,
    erro: null,
    salvo: false,
  })

  async function salvar(): Promise<void> {
    setEstado({ salvando: true, erro: null, salvo: false })
    try {
      await aoSalvar({ nome: nome || null, email: email || null, githubProprio: proprio })
      setEstado({ salvando: false, erro: null, salvo: true })
    } catch (e) {
      setEstado({ salvando: false, erro: mensagemDe(e), salvo: false })
    }
  }

  return (
    <details className="git-conta" data-git={perfil.id}>
      <summary>
        Git e GitHub <span className="apagado">{resumo(git)}</span>
      </summary>
      <label className="git-campo">
        <span>Nome nos commits</span>
        <input value={nome} maxLength={100} placeholder="o do PC" onChange={(e) => setNome(e.target.value)} />
      </label>
      <label className="git-campo">
        <span>E-mail nos commits</span>
        <input value={email} maxLength={200} placeholder="o do PC" onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="git-marca">
        <input type="checkbox" checked={proprio} onChange={(e) => setProprio(e.target.checked)} />
        <span>GitHub só desta conta</span>
      </label>
      <p className="apagado git-dica">
        {proprio
          ? 'O primeiro push pede o login do GitHub no navegador; para o gh, rode "gh auth login" num terminal desta conta.'
          : 'Sem marcar, push e gh usam o login do GitHub que já está no PC.'}{' '}
        Vale para os terminais abertos depois de salvar.
      </p>
      <div className="cartao-acoes">
        <button className="botao-pequeno" disabled={estado.salvando} onClick={() => void salvar()}>
          {estado.salvando ? 'Salvando…' : 'Salvar'}
        </button>
        {estado.salvo && <span className="apagado">Salvo.</span>}
      </div>
      {estado.erro && (
        <p className="erro" role="alert">
          {estado.erro}
        </p>
      )}
    </details>
  )
}
