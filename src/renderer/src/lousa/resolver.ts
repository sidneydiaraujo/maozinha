// Conflito ao juntar (T23.2, D30): o pedido que vai para o agente da copia resolver. Puro.

/** O erro do main ao juntar foi um conflito (os dois lados mudaram o mesmo trecho)? */
export function ehConflito(erro: string | null): boolean {
  return erro !== null && erro.startsWith('Conflito:')
}

/**
 * Pedido em uma linha (uma linha so: vai como mensagem, nao como colagem). O merge acontece na
 * copia, nao na original: o agente resolve no espaco dele e a original so muda no proximo Juntar.
 */
export function pedidoDeResolver(branch: string, branchAlvo: string): string {
  return (
    `Deu conflito ao juntar a branch ${branch} em ${branchAlvo}. Aqui nesta pasta, rode git merge ${branchAlvo}, ` +
    'resolva cada conflito mantendo a intenção dos dois lados, rode os testes e faça commit. ' +
    'Depois me diga em uma frase o que decidiu em cada arquivo.'
  )
}
