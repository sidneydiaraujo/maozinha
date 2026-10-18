# Fatia 6 — O quadro é o trabalho, a conta é só quem paga

Entrega: cada quadro mostra **a pasta** (onde o trabalho fica) em destaque e um
selo com **a conta** (quem paga). Trocar a conta de um quadro mantém o lugar, a
pasta e a conversa. A barra lateral fica só com as contas; o login não mostra
mais terminal.

Origem: testes do Sidney em 17/10/2026 (D14). A tela ainda confundia "conta",
"troca de conta" e "repositório com conta". O pedido: saber qual terminal está
em qual pasta, e trocar a conta só para usar os tokens de outra, no mesmo
contexto. Também: login técnico demais e texto quebrando no terminal (emoji).

---

## T6.1 Conversa por quadro (main)

**Arquivos:** `src/shared/model.ts`, `src/main/estado/armazem.ts`,
`src/main/quadros/sessoes.ts` (+ teste), `src/main/quadros/servico.ts` (+ teste),
`src/main/terminais/comandos.ts`, `src/main/terminais/alvo.ts` (+ teste),
`src/main/handlers/*`, `src/main/contexto.ts`, `src/shared/ipc.ts`, preload.

**Regras:**
- `Quadro.sessaoId` (opcional): agente do Claude nasce com um id (randomUUID).
  Quadro antigo ganha o seu ao abrir (`comSessao`) e ele é salvo.
- Abrir o quadro: conversa já gravada na pasta da conta → `claude --resume <id>`;
  senão `claude --session-id <id>`. Id fora do formato UUID → `claude` puro.
- `quadros:trocarConta { quadroId, perfilId }`: fecha o terminal, espera 500 ms,
  copia `<conta>/projects/<sub>/<id>.jsonl` (e a pasta `<id>/`) para a mesma
  subpasta da outra conta, troca só `perfilId` e salva. Mesma conta: nada.
  Terminal ou Codex: não copia conversa.
- A conversa é **achada** em `projects/*/` (não calculada): o Claude encurta
  caminhos longos.

**Prova feita:** CLI real, 17/10/2026 — conversa criada na Pessoal com
`--session-id`; Principal sem o arquivo: "No conversation found"; depois de
copiar: continuou e lembrou a palavra combinada.

## T6.2 Cabeçalho do quadro

`QuadroNode` + `ContaDoQuadro`: 📁 nome da pasta (numerado se há mais de um
quadro nela; caminho no title), etiqueta "terminal" quando for o caso, selo
colorido da conta com ▾. Menu "Quem paga este quadro" (só contas do mesmo
provedor) → confirmação ("o Claude reinicia nesta mesma pasta e continua a mesma
conversa") → `trocarConta`. O terminal remonta (key = conta) e retoma.

## T6.3 Barra só com contas, pastas no "Novo quadro"

Sai "+ Agente" do cartão e a lista "Pastas" da barra. Botão "+ Novo quadro" na
lousa (mais duplo clique e arrastar o cartão). A janelinha rotula "Conta · quem
paga" e "Pasta · onde o trabalho fica"; cada pasta tem "×" (confirma; fecha os
quadros dela, nunca apaga arquivos).

## T6.4 Login sem terminal

`useLogin` roda `claude auth login` num terminal escondido, via
`powershell -NoProfile -Command "...; exit $LASTEXITCODE"` (sem eco do comando).
Fases: abrindo → navegador (pulso) → conferindo (giro) → pronto (✓ e o e-mail)
ou falhou (✗, "Ver detalhes" com a saída). "Vai entrar com outro e-mail?":
copiar link, janela anônima, colar o código. Fecha sozinha 2,5 s depois de dar
certo, a menos que haja aviso (mesmo e-mail de outra conta). Respeita "reduzir
movimento".

## T6.5 Texto do terminal

`@xterm/addon-unicode11` (0.9.0) com `allowProposedApi`: emoji como ❌ 🟡 ✅
passam a ocupar 2 colunas, como o Claude Code calcula. Sem isso cada redesenho
escrevia na coluna errada e as palavras se misturavam.

## T6.6 Aceite

O Sidney segue `docs/aceite/roteiro.md` com o instalador novo.
