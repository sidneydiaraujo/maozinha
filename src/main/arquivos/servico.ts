// Pastas e arquivos que a lateral mostra (T7.1). A tela manda repoId + caminho relativo;
// o caminho absoluto e montado aqui, a partir do repo salvo, e nunca sai da pasta dele.
import type { Abertura, ConteudoArquivo, ItemArquivo } from '../../shared/model'
import type { ServicoRepos } from '../repos/servico'
import { acharUnicoPeloFim } from './busca'
import {
  BYTES_AMOSTRA,
  LIMITE_TEXTO,
  caminhoDentro,
  comoAbrir,
  decodificar,
  ordenar,
  pareceBinario,
  podeAbrirFora,
  visivel,
} from './regras'

export interface DepsArquivos {
  repos: Pick<ServicoRepos, 'obter'>
  /** Filhos diretos da pasta (atalho para pasta conta como pasta). */
  listarPasta(caminho: string): ItemArquivo[]
  /** Tamanho em bytes; null se nao existe ou nao e arquivo. */
  tamanho(caminho: string): number | null
  lerBytes(caminho: string): Uint8Array
  /** shell.openPath: '' deu certo; senao a mensagem do Windows. */
  abrirNoWindows(caminho: string): Promise<string>
  mostrarNaPasta(caminho: string): void
}

const FORA_DA_PASTA = 'Arquivo fora da pasta'
const NAO_ENCONTRADO = 'Arquivo não encontrado'

function nomeDe(relativo: string): string {
  const partes = relativo.split(/[\\/]/).filter((p) => p !== '')
  return partes[partes.length - 1] ?? ''
}

export class ServicoArquivos {
  constructor(private readonly deps: DepsArquivos) {}

  private absoluto(repoId: string, relativo: string): string {
    const caminho = caminhoDentro(this.deps.repos.obter(repoId).caminho, relativo)
    if (caminho === null) throw new Error(FORA_DA_PASTA)
    return caminho
  }

  /** Filhos de uma pasta do repo, na ordem do VSCode e sem .git e afins. */
  listar(repoId: string, relativo: string): ItemArquivo[] {
    return ordenar(this.deps.listarPasta(this.absoluto(repoId, relativo)).filter((i) => visivel(i.nome)))
  }

  /** Conteudo para o leitor: texto ate 2 MB; binario e grande vem sem texto. */
  ler(repoId: string, relativo: string): ConteudoArquivo {
    const caminho = this.absoluto(repoId, relativo)
    const tamanho = this.deps.tamanho(caminho)
    if (tamanho === null) throw new Error(NAO_ENCONTRADO)
    const fora = podeAbrirFora(nomeDe(relativo))
    if (tamanho > LIMITE_TEXTO) return { tipo: 'grande', texto: '', tamanho, podeAbrirFora: fora }
    const bytes = this.deps.lerBytes(caminho)
    if (pareceBinario(bytes.subarray(0, BYTES_AMOSTRA)))
      return { tipo: 'binario', texto: '', tamanho, podeAbrirFora: fora }
    return { tipo: 'texto', texto: decodificar(bytes), tamanho, podeAbrirFora: fora }
  }

  /** Clique na lateral: documento vai para o programa do Windows; o resto, para o leitor. */
  async abrir(repoId: string, relativo: string): Promise<Abertura> {
    if (comoAbrir(nomeDe(relativo)) === 'fora') {
      await this.abrirFora(repoId, relativo)
      return { onde: 'fora' }
    }
    return { onde: 'leitor', conteudo: this.ler(repoId, relativo) }
  }

  /** So documento, midia ou texto que o programa padrao apenas mostra: clicar nunca roda nada. */
  async abrirFora(repoId: string, relativo: string): Promise<void> {
    const caminho = this.absoluto(repoId, relativo)
    if (!podeAbrirFora(nomeDe(relativo))) throw new Error('Este tipo de arquivo não abre fora da Mãozinha')
    if (this.deps.tamanho(caminho) === null) throw new Error(NAO_ENCONTRADO)
    const erro = await this.deps.abrirNoWindows(caminho)
    if (erro) throw new Error(erro)
  }

  mostrarNaPasta(repoId: string, relativo: string): void {
    this.deps.mostrarNaPasta(this.absoluto(repoId, relativo))
  }

  /**
   * R1.6: o caminho que o agente citou, como arquivo que existe nesta pasta; null = nao vira link.
   * Existe como esta: ele mesmo. Senao, o unico arquivo da pasta que termina com ele.
   */
  resolver(repoId: string, relativo: string): string | null {
    try {
      if (this.deps.tamanho(this.absoluto(repoId, relativo)) !== null) return relativo.replace(/\\/g, '/')
    } catch {
      return null // fora da pasta
    }
    return acharUnicoPeloFim(repoId, relativo, (r, rel) => this.listar(r, rel))
  }
}
