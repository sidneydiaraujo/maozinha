import { NodeResizer, useStore, type NodeProps } from '@xyflow/react'
import { useEffect, useState } from 'react'
import type { Perfil, Quadro, Repo } from '../../../shared/model'
import { caminhoNoRepo } from '../componentes/links'
import { Terminal } from '../componentes/Terminal'
import '../estilos/quadro.css'
import { AnelContexto } from './AnelContexto'
import { brilhoDoQuadro, chamaAtencao, seloDoAviso } from './atencao'
import { BolinhasTime } from './BolinhasTime'
import { BotaoPrint } from './BotaoPrint'
import { ContaDoQuadro } from './ContaDoQuadro'
import { JanelaJuntar } from './JanelaJuntar'
import { ModeloDoQuadro } from './ModeloDoQuadro'
import type { AcoesLousa, QuadroNo } from './nos'
import { atencao, useAtencao, useMapaAtencao } from './useAtencao'

/** "esperando você", "terminou"... no cabecalho (T8.2); a frase do Claude aparece ao parar o mouse. */
function SeloAgente({ quadroId }: { quadroId: string }): React.JSX.Element | null {
  const aviso = useAtencao(quadroId)?.aviso
  const selo = aviso ? seloDoAviso(aviso) : null
  if (!selo) return null
  return (
    <span className={`selo-agente ${selo.classe}`} title={aviso?.mensagem}>
      {selo.texto}
    </span>
  )
}

/**
 * So no agente com o terminal aberto: modelo e esforco (T19.2, so Claude), anel de contexto
 * (T18.1) e 📎 colar print (T16.1).
 */
function ExtrasAgente({ quadro, perfil }: { quadro: Quadro; perfil: Perfil | undefined }): React.JSX.Element {
  return (
    <>
      {perfil?.provedor === 'claude' && <ModeloDoQuadro quadro={quadro} />}
      <AnelContexto quadroId={quadro.id} />
      <BotaoPrint quadroId={quadro.id} />
    </>
  )
}

/**
 * O terminal do quadro. Se o processo sair (T8.5), aparece "Terminal encerrado · Reabrir":
 * reabrir remonta o terminal e o main abre um novo (o agente retoma a conversa, T6.1).
 */
interface PropsCorpo {
  quadro: Quadro
  repo: Repo
  acoes: AcoesLousa
  /** O cabecalho so mostra o 📎 com o terminal aberto (T16.1). */
  aoEncerrado(encerrado: boolean): void
}

function CorpoQuadro({ quadro, repo, acoes, aoEncerrado }: PropsCorpo): React.JSX.Element {
  const [geracao, setGeracao] = useState(0)
  const [saida, setSaida] = useState<{ chave: string; codigo: number } | null>(null)
  // trocar a conta tambem remonta: a saida de um terminal antigo nao vale para o novo
  const chave = `${quadro.perfilId}:${geracao}`
  const encerrado = saida?.chave === chave
  // so o zoom (nao a posicao): arrastar a lousa nao redesenha o quadro
  const zoom = useStore((s) => s.transform[2])
  useEffect(() => aoEncerrado(encerrado), [encerrado, aoEncerrado])
  // caminho citado no terminal: so os de dentro da pasta do quadro viram link (T8.3)
  const arquivos = {
    aceita: (texto: string) => caminhoNoRepo(repo.caminho, texto) !== null,
    abrir: (texto: string) => {
      const relativo = caminhoNoRepo(repo.caminho, texto)
      if (relativo) acoes.abrirArquivo(repo.id, relativo)
    },
  }
  return (
    <div className="quadro-corpo">
      <Terminal
        key={chave}
        alvo={{ tipo: 'quadro', quadroId: quadro.id }}
        aoSair={(codigo) => setSaida({ chave, codigo })}
        aoAviso={(aviso) => atencao.aplicar(quadro.id, aviso)}
        arquivos={arquivos}
        zoom={zoom}
      />
      {encerrado && (
        <div className="quadro-encerrado nodrag" role="status">
          <span>Terminal encerrado (código {saida.codigo})</span>
          <button className="botao-pequeno botao-principal" onClick={() => setGeracao((g) => g + 1)}>
            Reabrir
          </button>
        </div>
      )}
    </div>
  )
}

/** Classe do quadro: ambar parado pedindo atencao; brilho na borda trabalhando (T21.2, D36). */
function useClasseQuadro(quadroId: string): { classe: string; chamando: boolean } {
  const mapa = useMapaAtencao()
  const chamando = chamaAtencao(mapa.get(quadroId))
  const brilho = brilhoDoQuadro(mapa, quadroId)
  const classes = ['quadro']
  if (chamando) classes.push('quadro-chamando')
  if (brilho) classes.push('quadro-trabalhando')
  if (brilho === 'anima') classes.push('quadro-brilho')
  return { classe: classes.join(' '), chamando }
}

/**
 * Quadro solto na lousa (D13, D14): a pasta da o nome (onde o trabalho fica) e o selo
 * diz a conta (quem paga). Trocar a conta remonta o terminal, que retoma a conversa.
 */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, repo, rotulo, contas, acoes } = data
  const { classe, chamando } = useClasseQuadro(quadro.id)
  const [juntando, setJuntando] = useState(false)
  const [encerrado, setEncerrado] = useState(false)
  return (
    <>
      <div
        className={classe}
        data-quadro={quadro.id}
        style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}
        onMouseDownCapture={() => chamando && atencao.marcarVisto(quadro.id)}
      >
        <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
        {/* sem duplo clique para ampliar (A2, 20/10): clicar duas vezes no cabecalho para escolher
            ou arrastar o quadro ampliava sem querer; ampliar e so no ⤢ */}
        <header className="cabecalho-quadro" title="Ctrl+clique seleciona vários (para mandar a mesma mensagem)">
          <span
            className="quadro-pasta"
            title={repo.copia ? `${repo.caminho}\nCópia separada · branch ${repo.copia.branch}` : repo.caminho}
          >
            <span aria-hidden="true">📁</span> {rotulo}
          </span>
          {quadro.tipo === 'terminal' && <span className="etiqueta">terminal</span>}
          <SeloAgente quadroId={quadro.id} />
          {quadro.tipo === 'agente' && !encerrado && <ExtrasAgente quadro={quadro} perfil={perfil} />}
          <ContaDoQuadro
            perfil={perfil}
            contas={contas}
            tipo={quadro.tipo}
            aoTrocar={(perfilId) => acoes.trocarConta(quadro.id, perfilId)}
          />
          {repo.copia && (
            <button
              className="botao-pequeno botao-juntar nodrag"
              title={`Juntar o trabalho da branch ${repo.copia.branch} na pasta original`}
              onClick={() => setJuntando(true)}
            >
              Juntar
            </button>
          )}
          <button
            className="botao-ampliar nodrag"
            title="Ampliar na tela (de novo para voltar)"
            aria-label={`Ampliar ${rotulo}`}
            onClick={() => acoes.ampliar(quadro.id)}
          >
            ⤢
          </button>
          <button
            className="botao-fechar nodrag"
            aria-label={`Fechar ${rotulo}`}
            onClick={() => acoes.removerQuadro(quadro.id)}
          >
            ×
          </button>
        </header>
        <CorpoQuadro quadro={quadro} repo={repo} acoes={acoes} aoEncerrado={setEncerrado} />
        {juntando && (
          <JanelaJuntar
            repo={repo}
            cor={perfil?.cor ?? '#555'}
            quadro={quadro}
            aoFechar={() => setJuntando(false)}
            aoFecharQuadro={() => {
              setJuntando(false)
              acoes.removerQuadro(quadro.id)
            }}
          />
        )}
      </div>
      {data.noTime && <BolinhasTime quadroId={quadro.id} />}
    </>
  )
}
