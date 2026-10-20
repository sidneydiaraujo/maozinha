# Fatia 21 — Identidade visual da Lousa

Entrega: a Lousa ganha cara própria, de uma lousa de terminais para quem vive no VSCode:
fundo azul-ardósia puxado do Abyss, texto cor de giz, âmbar para "esperando você" e um
brilho que corre na borda só do quadro cujo agente está trabalhando. Nada do Thunders Gestão
como referência (nem cores, nem o `GOSTO.md`).

Origem: avaliação de 19/10/2026, item "algo novo e legal das bibliotecas de front".
Decisão: **D36** (20/10/2026). O Sidney aprovou a variação A · Ardósia e giz do protótipo da
T21.0; as cores estão na D36 e viram o `tokens.css` da T21.1. O número D25 citado antes ficou
com a outra sessão.
Depende de: Fatia 15 (paleta `lousa`). Melhor depois das Fatias 18 a 20, para o protótipo já
ter anel, seletores e barras de uso.

## Orçamento de contexto (teto 35%)

**T21.0 numa sessão e T21.1–T21.3 em outra**, porque o protótipo consome muito contexto.
Do catálogo Cult UI (`C:\Users\sidne\bibliotecas-front\cult-ui\apps\www\registry\default\ui`),
leia só os arquivos destes componentes: `halo-*` (um ou dois), `border-beam-card`,
`dynamic-island`, `rolling-number` e `texture-overlay`. Não leia o resto do catálogo.

## T21.0 Protótipo para o Sidney aprovar

- Uma página HTML estática (Artifact privado) com: a lousa com três quadros (um trabalhando,
  um esperando você, um parado), o cabeçalho com anel, modelo e esforço, a barra de cima com
  as contas e as barras de uso, e a engrenagem com a Aparência.
- Duas variações de paleta lado a lado. **Nada é codado no app antes do ok.**
- O que vem do Cult UI é reescrito em CSS puro: sem Tailwind, sem `motion`, sem shader.

## T21.1 Cores como variáveis

**Arquivos:** `estilos/tokens.css` (novo, `:root` com todas as cores e raios), todos os
`estilos/*.css` passam a usar `var(--...)`. `lousa.css` (338 linhas) é dividido antes de
crescer.

**Regra:** zero cor solta nos CSS fora do `tokens.css` (conferir com `grep -E "#[0-9a-f]{3,6}"`).

## T21.2 Quadro, barra de cima e brilho de trabalho

**Arquivos:** `estilos/quadro.css`, `estilos/topo.css`, `lousa/QuadroNode.tsx` (classe do
estado), `topo/BarraTopo.tsx`.

**Regras (lição da D17):**
- O brilho que corre na borda (`border-beam`) só no quadro que está trabalhando, em CSS
  (`@property` + `conic-gradient`), e para com "reduzir movimento".
- No máximo 4 quadros animando ao mesmo tempo; os outros mostram a borda parada.
- Fundo fosco (`backdrop-filter`) só na barra de cima e nos menus, nunca nos quadros (eles
  ficam por cima do terminal e custam a cada quadro desenhado).
- "● N esperando você" vira a pílula do alto, no jeito da `dynamic-island`, sem animação de mola.

**Pronto quando:** `npm run check` verde; cenários `fatia8` (com os nomes de classe
atualizados) e `desempenho acumular` passam, com o eco sem piorar (mediana ≤ 25 ms) e
nenhuma travada com 4 quadros trabalhando.

**Commit:** `feat: Lousa visual identity with slate palette and working glow`

## T21.3 Aceite e instalador 0.2.0

`package.json` 0.2.0, `npm run dist`, item 49 do roteiro (olhar geral, com 4 agentes
trabalhando). Junta no mesmo instalador o aceite pendente das Fatias 15 a 20.
