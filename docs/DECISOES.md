# Decisões

Uma linha nova a cada decisão de arquitetura, stack ou regra. Formato: o que
foi decidido, por quê, e o que fica proibido por causa disso.

**D1 — Construir do zero (12/10/2026).** Fork do OpenCove (~248 mil linhas)
seria grande demais para auditar e o isolamento entre contas não cabe no
modelo dele (ver FUNCIONALIDADES §6). Reaproveitar ideias e peças MIT com crédito.

**D2 — Stack e versões fixas (13/10/2026).** O conjunto Electron 41 + Vite 6 +
electron-vite 5 + Vitest 4 + TypeScript 5.9 é o mesmo que o OpenCove usa com
sucesso no Windows. ESLint 10 (o 9 está sem suporte). Versões exatas no
`package.json`, sem `^`. Trocar versão exige linha nova aqui.

**D3 — npm, não pnpm (13/10/2026).** O pnpm não está instalado no PC e o npm
basta para um app só.

**D4 — node-pty 1.1.0 pré-compilado (13/10/2026).** O PC não tem compilador
C++ (Visual Studio Build Tools). A 1.1.0 traz binários prontos para Windows
x64/arm64 e funciona no Node e no Electron (testado por `npm test` e
`npm run smoke`). Proibido adicionar outra dependência nativa sem decisão.

**D5 — Estado em JSON, não SQLite (13/10/2026).** O estado é pequeno (contas,
repos, quadros, posições) e `better-sqlite3` seria uma segunda dependência
nativa (D4). Revisitar se passar de alguns MB ou precisar de busca.

**D6 — Ambiente do terminal montado do zero (13/10/2026).** Lista permitida de
variáveis (ARQUITETURA, "Ambiente"). O perfil principal (`~/.claude`) roda sem
`CLAUDE_CONFIG_DIR`, idêntico ao terminal normal; definir a variável com o
caminho padrão faria o Claude usar outro arquivo de preferências
(`~/.claude/.claude.json`, visto no teste do OpenCove). Proibido repassar
`process.env` inteiro.

**D7 — O main decide tudo (13/10/2026).** Pasta, conta e comando de um terminal
vêm do repo e do quadro salvos no main. A tela manda só ids. Assim um bug ou conteúdo
malicioso na tela não abre terminal na conta errada.

**D8 — Terminais vivem no main (13/10/2026).** `abrir` idempotente e buffer de
saída no main. O React (StrictMode, remontagem de quadros) pode montar o
componente várias vezes sem abrir shells duplicados nem perder a saída.

**D9 — CSP só no build (13/10/2026).** No modo dev o Vite precisa de script
inline e WebSocket. O dev só carrega `localhost`; o app instalado tem CSP.

**D10 — Qualquer conta pode desenvolver a Lousa (13/10/2026, Sidney).** O
projeto pode ser evoluído pela conta pessoal ou pela da empresa. Por isso o
plano, o estado e as decisões ficam neste repositório, não na memória de uma
conta.

**D11 — Duas fatias a mais no escopo da v1: Codex e conta por quadro (14/10/2026, Sidney).**
O teste da v1 pede duas contas distintas (Claude e Claude, ou Claude e
ChatGPT), em repos diferentes ou no mesmo. Por isso: (1) toda conta tem um
`provedor` (`claude` ou `codex`); o ambiente usa `CLAUDE_CONFIG_DIR` ou
`CODEX_HOME`, nunca os dois; (2) a conta é do **quadro**, não do repo (o repo só
tem a conta padrão); (3) quadro `agente` roda o CLI do provedor da conta.
Substitui a trava "um repo, uma conta" (C13 antigo). Proibido: mudar a conta de
um quadro já aberto (remova e crie outro) e ler `auth.json` do Codex (tem tokens).
O Codex não estava instalado no PC em 14/10/2026: o formato do
`codex login status` precisa ser confirmado na T1.4b.
- **D12 (14/10/2026):** instalador com electron-builder 26.15.3, NSIS por usuário (sem administrador), sem assinatura digital por ora; integridade pelo SHA-256 em `release/SHA256.txt`.
- **D13 (14/10/2026):** lousa livre. Quadros soltos na lousa (pasta no cabeçalho), sem moldura de repo; conta e pasta escolhidas no mesmo gesto (arrastar a conta, duplo clique no vazio ou "+ Agente" no cartão). Some a "conta padrão do repo"; a pasta guarda só a última conta usada, como sugestão. Motivo: teste do Sidney — a moldura limitava o canvas e havia três caminhos para a mesma ação.
- **D14 (17/10/2026, Sidney):** o quadro é o trabalho, a conta é só quem paga. O quadro mostra a pasta em destaque e um selo com a conta; trocar a conta do quadro (`quadros:trocarConta`) mantém lugar, pasta e conversa: o Lousa dá a cada agente do Claude um id de conversa (`--session-id`), copia o arquivo da conversa para a pasta da outra conta e retoma (`--resume`). Substitui a proibição de D11 ("mudar a conta de um quadro já aberto"). Limites: memórias e skills globais continuam vindo da pasta da conta (contexto 100% igual só com a T1.8); `/clear` ou `/resume` dentro do Claude mudam a conversa e o quadro continua retomando a do id dele; passar uma conversa da empresa para a conta pessoal leva o conteúdo junto. A barra lateral fica só com contas; pastas ficam na janela "Novo quadro".
- **D15 (18/10/2026, Sidney):** contas viram ícones numa barra no alto (desenho do provedor na cor da conta; clique abre o cartão; engrenagem abre o painel com todas as contas e "+ Nova conta"). A lateral passa a ser um explorador das pastas em uso, copiando o jeito do Explorer do VSCode 1.142 (lido no código instalado: esconde `.git` e afins, pastas primeiro com ordem natural, filhos lidos só ao abrir, vigia recursivo com eventos juntados por 75 ms, marca de "alterado" que sobe para as pastas, binário = byte zero nos primeiros 512 bytes). Nossas escolhas: `fs.watch` recursivo do Node em vez de `@parcel/watcher` (sem dependência nativa nova); o vigia ignora também `node_modules` e pastas de build; a tela só manda `repoId` + caminho relativo e o main confere que fica dentro da pasta; "Abrir fora" só para documentos e mídia (lista permitida, nunca script ou executável; o resto só "Mostrar na pasta"); md formatado com `markdown-it` 14.3.2 com `html: false` (HTML do arquivo vira texto), links `http(s)` pelo main e imagens como texto. Dependência nova: `markdown-it` 14.3.2 (JS puro; a 14.3.3 tinha 2 dias e ficou de fora).
- **D16 (18/10/2026, Sidney):** pacote "uma semana sem ajustes" (Fatia 8).
  - **Aviso "esperando você":** usa o Program Status Protocol (OSC 7501) do próprio Claude Code 2.1.295+, lido no `claude.exe` instalado. Sem ele, o Claude não avisa nada num terminal desconhecido: no modo `auto`, `no_method_available`.
  - **Resposta à pergunta 7501:** o main responde em teclas `win32-input-mode`. Provado com um programa simulado: o ConPTY descarta um OSC cru vindo do terminal, mas entrega teclas. A resposta é texto fixo e só em terminais de quadro.
  - **Avisos na tela e no Windows:** notificação e barra de tarefas piscando só com a janela fora de foco. Brilho no quadro, contador "esperando você" e minimapa âmbar.
  - **Copiar e colar** pelo main (`clipboard`), porque a tela não tem permissão.
  - **Links** pela API do próprio xterm (`registerLinkProvider` e `linkHandler`), sem addon novo. Caminho só dentro da pasta do quadro; linhas quebradas juntadas.
  - **Ampliar** = enquadrar o quadro na vista, sem mudar o tamanho salvo.
  - **Registros:** um arquivo por dia em `<userData>\logs`, guardados 14 dias e com teto de 5 MB por dia. E-mails mascarados, nunca conteúdo de terminal; o smoke não grava.
  - **Janela:** tamanho e posição em `janela.json`, usados só se couberem numa tela ligada.
- **D17 (19/10/2026, Sidney):** digitação lenta e um erro do main ("EPERM … model.cat" do Teams) com a pasta `C:\Users\sidne` salva. Sidney: a marca de "alterado" é desnecessária por ora.
  - **Causa medida:** o vigia recursivo da pasta do usuário recebia o AppData inteiro (~40 avisos/s, ~1.000 arquivos diferentes em 2 min). Cada aviso fazia um `stat` no main (EPERM num arquivo do Teams derrubou o main), e a tela guardava cada caminho por 30 min no mapa de "Alterados agora", copiado e percorrido a cada lote no mesmo processo que desenha os terminais. Também: o histórico de 1 MB de cada terminal era copiado inteiro a cada pedaço de saída (~0,9 ms por pedaço).
  - **Decisão:** sai "Alterados agora" e as marcas. O main vigia só as pastas abertas na árvore e a pasta do arquivo no leitor, cada uma sem subpastas e sem `stat` (`arquivos:vigiar` recebe a lista). A árvore relê só a pasta que mudou. O histórico guarda pedaços e só junta quando passa do dobro do limite ou na remontagem.
  - **Medido na janela** (estado de teste com `C:\Users\sidne` aberta, 1,6 MB de saída noutro terminal e 10 mil arquivos acumulados, como 30 min da pasta do usuário): eco da tecla mediana 86 → 20 ms (pior 245 → 33 ms); tela travada 20,9 s de ~35 s → 0.
- **D18 (19/10/2026, Sidney):** cópia separada por agente (Fatia 10, item D1). Pedido: "aplique as etapas 0 e 2 agora"; a Fatia 9 (Codex) espera o uso do ChatGPT.
  - **Como:** `git worktree` com branch `lousa/<apelido>`, numa pasta irmã do repositório (`<repo>.copias\<apelido>`): fora do repositório (o `git status` dele não muda) e à vista no Explorador do Windows.
  - **A cópia é uma pasta da lista** (`Repo.copia`): árvore, leitor, links, conversa (D14) e `cwd` funcionam sem código novo.
  - **Git pelo main**, com `execFile` sem shell, argumentos fixos e o ambiente da lista permitida (`ambienteBase`), `GIT_TERMINAL_PROMPT=0`. Sem dependência nova.
  - **Nunca perde trabalho:** ao fechar o último quadro da cópia, alteração não salva mantém tudo; limpa, a pasta sai com `worktree remove` e a branch só com `branch -d` (recusa se o trabalho não foi juntado). Nunca `--force` nem `-D`. Provado com git 2.54 em pasta temporária.
  - **Fora desta fatia:** juntar a branch de volta (merge) e ver o diff; o Sidney ou um agente fazem `git merge lousa/<apelido>` na pasta original.
- **D19 (19/10/2026, Sidney):** juntar a cópia separada (Fatia 11). Pedido: "faça as 4" (Fatias 11 a 14, antes de instalar de novo).
  - **Merge simples** (`git merge --no-edit`) na branch atual da pasta original, rodado pelo main como na D18. Sem rebase nem squash: o histórico do agente fica como ele fez.
  - **Só com as duas pastas limpas:** alteração sem commit na cópia ou na original recusa antes de mexer. Conflito: `merge --abort`, a original fica como estava, e a mensagem pede a um agente para resolver.
  - Depois de juntar, fechar o quadro apaga cópia e branch pelo caminho normal da D18 (`branch -d` aceita porque o trabalho já está na original).
- **D20 (19/10/2026, Sidney):** achar rápido (Fatia 12).
  - **Ctrl+K vale em toda a janela**, inclusive com um terminal em foco: a Lousa pega a tecla antes do xterm. Quem usava Ctrl+K no PowerShell (apagar até o fim da linha) perde esse atalho dentro da Lousa.
  - **Ctrl+F dentro do terminal** abre a busca da Lousa (o PowerShell e o Claude Code não usam Ctrl+F por padrão). Ctrl+Shift+F continua indo para o programa.
  - **Sem dependência nova:** a busca no terminal lê o histórico pela API do xterm (`buffer.active`), em vez do `@xterm/addon-search`; a pontuação do Ctrl+K é nossa (`shared/pontuar.ts`), usada pela tela e pelo main.
  - **Busca de arquivo pelo main**, com teto de 20 mil itens e sem entrar em git, dependências, builds e `AppData`: a pasta do usuário inteira na lista não trava o app (lição da D17).
- **D21 (19/10/2026, Sidney):** a mesma mensagem para vários quadros (Fatia 13).
  - **Seleção do próprio React Flow** (Ctrl+clique, Shift+arrastar); a barra só aparece com 2 ou mais. Sem modo novo nem botão a mais na tela.
  - **Texto e Enter separados por 150 ms:** texto e Enter chegando juntos parecem uma colagem para o Claude Code, e o Enter pode virar quebra de linha. Várias linhas vão como colagem (bracketed paste).
  - **Nenhum canal novo:** usa `terminais:escrever`, que a tela já tinha para o teclado.
- **D22 (19/10/2026, Sidney):** acabamento do instalador (Fatia 14).
  - **Ícone gerado por script nosso** (`scripts/gerar-icone.mjs`, PNG e ICO montados com o `zlib` do Node): sem dependência e fácil de refazer.
  - **`signAndEditExecutable: true`** (antes `false`, D12): só assim o electron-builder grava ícone e versão dentro do `.exe`. Sem certificado configurado ele não assina nada (conferido: `NotSigned`); a integridade continua pelo `release/SHA256.txt`. O build passou sem baixar nada novo.
  - **Versão 0.1.0:** primeira versão com as Fatias 7 a 14 juntas. Daqui em diante, cada instalador para teste sobe a versão.
- **D23 (19/10/2026, proposta do Claude, aprovada pelo Sidney no mesmo dia):** terminal com cara de VSCode (Fatias 15 e 16). Pedido: "a caixa de terminal precisa ter uma fonte mais elegante como o vscode, … importar print da área de transferência".
  - **A caixa de texto continua a do Claude, dentro do terminal.** Uma caixa separada, com fonte proporcional como o painel do VSCode, duplicaria a digitação e atrapalharia as perguntas de permissão do Claude. O que chega perto do VSCode são a letra, as cores e os botões do cabeçalho.
  - **Paleta própria (`lousa`), puxada do Abyss, com o Abyss puro como opção** na engrenagem.
  - **Dependência nova `@xterm/addon-webgl`** (só JavaScript, versão fixa casada com o `@xterm/xterm` 6.0.0). Volta ao desenho normal sozinho quando o WebGL cai ou passa de 16 quadros. Nas provas fica no desenho normal, salvo o cenário `aparencia webgl`.
    - Instalada na T15.2: `@xterm/addon-webgl` **0.19.0**, publicada no mesmo minuto do `@xterm/xterm` 6.0.0 (22/12/2025), sem dependências.
    - Limite da Lousa: **14** terminais em WebGL ao mesmo tempo. O Chromium derruba o contexto mais velho no 17º, e a folga evita isso; do 15º em diante, o terminal já nasce no desenho normal.
  - **Print:** no Windows o Claude cola imagem com Alt+V (lido no `claude.exe` 2.1.304). Ctrl+V com imagem e sem texto manda Alt+V ao terminal; o main só diz se há imagem e nunca entrega a imagem à tela.
- **D24 (19/10/2026, proposta do Claude, aprovada pelo Sidney no mesmo dia):** dados do agente pela linha de status (Fatias 17 a 20).
  - **Fonte única: a `statusLine` do Claude Code**, ligada pela Lousa com `--settings <arquivo>` em cada agente. O arquivo fica em `<userData>\agentes`; nada é gravado nas pastas das contas. O caminho do painel do VSCode (`get_usage`, experimental) exigiria trocar o terminal pelo modo de troca de mensagens.
  - **Efeito colateral:** se a conta tiver uma linha de status própria, a da Lousa vale no lugar dela enquanto o agente estiver aberto na Lousa.
  - **Comando escolhido na T17.0:** `findstr "^" > "C:/…/agentes/<quadroId>.json"`.
    - Foi o mais rápido: mediana de 155 ms, contra 338 ms do Electron como Node e 530 ms do PowerShell.
    - Não deixa nada no ambiente do terminal.
    - No Windows o Claude roda a linha de status pelo Git Bash. Por isso, nada de `cmd /d /c` (o bash troca `/d` e `/c` por caminhos), e o caminho vai com barra normal.
    - A linha da Lousa não escreve nada na tela: a linha de status do agente fica vazia.
  - **A tela nunca manda comando:** `/compact`, `/model` e `/effort` são montados pelo main a partir de valores de uma lista fixa, e só com o agente parado.
  - **Uso por conta só em memória**, vindo do agente mais recente daquela conta. Sem o limite semanal só do Sonnet, que a linha de status não traz.
- **D30 (20/10/2026, Sidney: "faça as demais evoluções"):** juntar sem travar à toa (Fatia 23).
  - **Arquivo fora do git na pasta original não bloqueia mais o Juntar.** A prova da Fatia 11 mostrou que um rascunho solto já impedia juntar. O merge não toca nesses arquivos. Se a cópia traz um arquivo com o mesmo nome, o git recusa, e a Lousa explica quais são.
  - **Alteração em arquivo acompanhado pelo git continua bloqueando**, na cópia e na original.
  - **Conflito:** com um agente na cópia, "Pedir ao agente para resolver" escreve nele o pedido. O agente faz merge da branch da original dentro da cópia, resolve, testa e faz commit. A original nunca recebe um merge pela metade; o próximo Juntar entra limpo.
- **D31 (20/10/2026):** ver a diferença antes de juntar (Fatia 22).
  - **Diff unificada colorida** dentro da janela "Juntar" (verde entrou, vermelho saiu), em vez de duas colunas lado a lado: cabe na janela e não precisa de dependência.
  - **Segurança:** o canal `copias:diff` recebe um caminho, mas o main só aceita um que esteja na lista que ele mesmo montou com `git diff --numstat`. Até 3000 linhas.
- **D32 (20/10/2026):** pequenos ajustes de uso (Fatia 24).
  - **Quadro novo nunca nasce em cima de outro.** O main (`quadros/lugar.ts`) usa o lugar pedido (centro da vista, duplo clique ou onde a conta foi solta) se estiver livre. Senão, usa o lugar livre mais perto, ao lado, acima ou abaixo de algum quadro, com 24 px de folga. A foto da prova da Fatia 11 mostrava um quadro tampando outro.
  - **Ctrl+F: Enter sobe.** A busca começa no achado mais recente, o de baixo. Antes, o Enter dava a volta para o mais antigo; agora ele sobe para o anterior, como quem lê o terminal de baixo para cima. Shift+Enter desce.
- **D33 (20/10/2026):** mensagens prontas (Fatia 25).
  - **Arquivo próprio** (`<userData>\mensagens.json`), fora do `estado.json`: lista pequena (até 30 frases de até 2000 letras), que não se mistura com a lousa. O arquivo estragado volta às três padrão sem quebrar.
  - **Para quem vai pelo Ctrl+K:** para os quadros selecionados; sem seleção, para o último quadro em que se clicou ou digitou. Sem nenhum dos dois, a Lousa pede para clicar num quadro, em vez de adivinhar.
  - **A mesma escrita da Fatia 13** (texto, pausa, Enter: `lousa/escrever.ts`). Nenhum canal novo para escrever; os canais novos são só `mensagens:listar` e `mensagens:salvar`.
- **D34 (20/10/2026):** nota na lousa (Fatia 26).
  - **Lista própria (`notas`) no `estado.json`, fora dos quadros:** a nota não tem pasta, conta nem terminal. Por isso não é um tipo de quadro. Assim o tipo `Quadro` e o `QuadroNode` (onde a outra sessão mexe nas Fatias 18 e 19) ficam intactos. Estado antigo sem `notas` continua válido.
  - **Nó próprio (`NotaNode`)**, que mostra o markdown com o mesmo renderizador do leitor (`html: false`: nada escrito na nota roda na tela). Link dentro da nota não troca a página.
  - **Posição e tamanho pelo mesmo `lousa:salvarLayout`:** o main aceita ids de quadros e de notas. Texto até 20 mil letras, salvo 500 ms depois da última tecla e ao sair da edição.
  - **"➤ Mandar":** usa os mesmos alvos da D33.
- **D35 (20/10/2026):** vistas salvas (Fatia 27). A ideia de "várias lousas" (A7 e A9) começa pequena.
  - **Uma vista guarda só a câmera e o lugar de cada quadro e nota.** Não fecha nem abre terminal. Voltar a uma vista devolve ao lugar quem existia; quem nasceu depois fica onde está. Lousas separadas, com quadros diferentes em cada uma, ficam para depois, se fizer falta.
  - **Tudo pelo Ctrl+K**, sem janela de nome: o texto digitado vira o nome ("Guardar vista atual como …"). O mesmo nome substitui; até 20 vistas.
  - **O main só guarda caixa de quadro ou nota que existe.** Voltar a uma vista salva pelo mesmo `lousa:salvarLayout` de quando se arrasta um quadro.
