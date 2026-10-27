# Roteiro de aceite da primeira versão (Claude e Claude, lousa livre)

Quem executa: Sidney. Marque cada item e anote o que falhou. O que falhar vira tarefa no `docs/ESTADO.md`.
Item 8 (Claude e ChatGPT) fica para depois: depende de T1.4b e T1.8.

- [ ] 1. Instalar `release/Lousa.ia Setup 0.0.1.exe` e abrir pelo Menu Iniciar. (Windows pode avisar "editor desconhecido": não há assinatura.)
- [ ] 2. A barra de cima mostra um ícone por conta (bolinha verde = logada). Clique no ícone: aparece o cartão com o e-mail. Renomear "Principal" para "Empresa" (duplo clique no nome).
- [ ] 3. "Entrar"/"Trocar login": a janela não mostra terminal; anima "Abrindo o navegador" → "Autorize no navegador" → ✓ com o e-mail e fecha sozinha. Para outro e-mail: "Copiar link", janela anônima e, se pedir, colar o código.
- [ ] 4. "+ Novo quadro" (ou arrastar o cartão "Pessoal" para a lousa) → "Outra pasta…" → uma pasta em `C:\Users\sidne\pessoal\` → "Abrir agente": o cabeçalho mostra 📁 a pasta e o selo da conta.
- [ ] 5. Duplo clique no vazio → marcar "Empresa" → pasta da empresa → Enter.
- [ ] 6. Duas contas, pastas diferentes: `/status` mostra a conta certa em cada quadro; o cabeçalho mostra conta e pasta.
- [ ] 7. Duas contas, mesma pasta: "+ Novo quadro", outra conta, mesma pasta; o segundo vira "<pasta> 2"; `/status` confere.
- [ ] 8. (adiado) Claude e ChatGPT.
- [ ] 9. Num terminal da conta pessoal: `$env:GITHUB_TOKEN`, `$env:HOME` vazios e `$env:CLAUDE_CONFIG_DIR` = pasta pessoal. Na empresa: tudo vazio. (A Lousa já prova isso em teste automático; aqui é conferir com os olhos.)
- [ ] 10. Arrastar a lousa pelo vazio (ou com o botão do meio, até por cima dos quadros), arrastar quadros pelo cabeçalho, redimensionar, mexer no zoom, fechar e abrir: tudo no lugar, cada quadro na sua conta.
- [ ] 11. "Outra pasta…" com uma pasta que já está na lista: não duplica, só marca a existente.
- [ ] 12. Na janela "Novo quadro", "×" numa pasta → "Tirar": fecha os quadros daquela pasta, arquivos intactos.
- [ ] 13. Abrir a Lousa pela primeira vez depois da atualização: os quadros antigos aparecem no mesmo lugar, sem moldura.
- [ ] 14. Num agente com conversa: selo da conta → outra conta → "Trocar": o Claude reinicia na mesma pasta e continua a mesma conversa (pergunte algo que só a conversa sabe).
- [ ] 15. Fechar e abrir a Lousa: cada agente retoma a sua conversa.
- [ ] 16. Uma resposta do Claude com tabela e emoji (❌ 🟡 ✅): nenhuma palavra quebrada ou misturada.
- [ ] 17. Engrenagem (canto de cima, à esquerda): painel com todas as contas. "+ Nova conta" → Claude → "Teste" cria o ícone e o cartão "Teste" (sem login); "Entrar" nele abre o login. (Para apagar depois: a pasta `C:\Users\sidne\.claude-teste`.)
- [ ] 18. Arrastar o ícone de uma conta (no alto) para a lousa abre a janela "Novo quadro" com essa conta.
- [ ] 19. Lateral "Pastas": cada pasta em uso aparece com bolinhas das contas dos quadros dela; clicar abre e fecha em cascata; `.git` não aparece.
- [ ] 20. Peça a um agente para criar um `.md` numa pasta aberta na árvore: ele aparece sozinho. Abra esse `.md` no leitor, feche a pasta na árvore e peça para mudar o arquivo: o leitor recarrega com "atualizado agora". (Não existe mais "Alterados agora" nem marca amarela, D17.)
- [ ] 20b. Com a pasta `C:\Users\sidne` na lateral e um agente trabalhando por alguns minutos, digitar em outro terminal responde na hora, e nenhum erro "A JavaScript error occurred in the main process" aparece.
- [ ] 21. Clicar num `.md` abre o leitor ao lado, formatado ("Ver código" mostra o texto puro); clicar num `.ts`/`.json` mostra o código com número de linha; a borda direita do leitor muda a largura.
- [ ] 22. Clicar num `.pdf`/`.docx`/`.xlsx` abre no programa do Windows; um `.exe` ou `.bat` nunca abre (só "Mostrar na pasta").
- [ ] 23. Num agente, peça algo que precise de permissão (ex.: "crie um arquivo teste.md"). Quando o Claude perguntar, o quadro fica com borda âmbar, o selo diz "pedindo permissão" e aparece "● 1 esperando você" no alto. Com a Lousa minimizada, aparece uma notificação do Windows e a barra de tarefas pisca; clicar na notificação traz a Lousa e mostra o quadro.
- [ ] 24. Quando o Claude termina, o selo diz "terminou" (e o quadro brilha até você clicar nele). Com dois agentes esperando, cada clique em "● 2 esperando você" mostra um deles.
- [ ] 25. No terminal: selecione um texto e aperte Ctrl+C (copia; sem seleção, o Ctrl+C continua interrompendo). Ctrl+V cola. Botão direito: com seleção copia, sem seleção cola.
- [ ] 26. Um link `https://...` que o Claude escrever abre no navegador; um caminho de arquivo da pasta (ex.: `docs/ESTADO.md`) abre no leitor ao lado.
- [ ] 27. O ⤢ de um quadro amplia o quadro na tela; de novo volta (duplo clique no cabeçalho não amplia mais, A2). Ctrl+roda do mouse dentro do terminal aumenta e diminui a letra, e o tamanho fica guardado.
- [ ] 28. Rolar para cima num agente com uma conversa longa mostra bem mais que antes (até 10 mil linhas).
- [ ] 29. Num quadro de terminal, digite `exit`: aparece "Terminal encerrado · Reabrir"; "Reabrir" volta com um terminal novo (num agente, o Claude retoma a conversa).
- [ ] 30. Feche a Lousa maximizada e abra de novo: volta maximizada. Engrenagem → "Abrir pasta de registros" abre a pasta com o arquivo do dia.

## Fatia 10 — cópia separada (git worktree)

- [ ] 31. Com um agente já aberto numa pasta que é repositório git (ex.: `lousa-ia`), "+ Novo quadro" na mesma pasta: a caixa "Cópia separada (branch própria)" já vem marcada, com a frase "Já tem um quadro nesta pasta". "Abrir agente": o quadro novo mostra 📁 `lousa-ia ⑂ claude-N`; passando o mouse no nome aparece a pasta `...\lousa-ia.copias\claude-N` e a branch `lousa/claude-N`. No agente, `git branch --show-current` confirma.
- [ ] 32. Peça ao agente da cópia para mudar um arquivo: o agente da pasta original não vê a mudança (`git status` limpo lá). Feche o quadro da cópia sem commit: aparece "Cópia mantida em …: tem alterações…" e a pasta continua na lista e no disco.
- [ ] 33. Abra um quadro nessa cópia de novo (ela aparece na lista de pastas), peça um commit e feche: aparece "Cópia apagada; os commits ficaram na branch lousa/claude-N". Na pasta original, `git log lousa/claude-N` mostra o commit e `git merge lousa/claude-N` junta o trabalho.
- [ ] 34. Abra uma cópia e feche sem mexer em nada: "Cópia separada apagada: todo o trabalho dela já estava na pasta original." A pasta `...\lousa-ia.copias\claude-N` sumiu e `git branch` não lista a branch.

## Fatia 11 — juntar a cópia

- [ ] 35. Numa cópia separada, peça ao agente para mudar algo e fazer commit. "Juntar" no cabeçalho do quadro: a janela diz quantos commits e arquivos (+/−) e "para juntar em main" (ou a branch em que a pasta original estiver). "Juntar em main" → ✓; o arquivo aparece na pasta original. "Fechar o quadro e apagar a cópia" → a cópia e a branch somem.
- [ ] 36. Conflito: mude a mesma linha do mesmo arquivo na cópia e na original (com commit nos dois). "Juntar" mostra "Conflito: os dois lados mudaram …" e a pasta original fica igual (`git status` limpo). Com alteração sem commit na cópia, a janela avisa e não junta.

## Fatia 12 — achar rápido

- [ ] 37. Ctrl+K (até com o cursor dentro de um terminal): abre a caixa "Quadro, pasta ou arquivo…". Digite parte do nome de uma pasta: aparecem os quadros dela e "Novo quadro em <pasta>". Enter num quadro leva a lousa até ele; Enter em "Novo quadro em…" abre a janelinha com a pasta já marcada (e não cria nada sozinho).
- [ ] 38. Ctrl+K e digite parte do nome de um arquivo (ex.: `estado`): aparece `ESTADO.md` com a pasta embaixo; Enter abre no leitor. Nada de dentro de `node_modules` aparece.
- [ ] 39. Num terminal com bastante texto, Ctrl+F: digite uma palavra; aparece "N de M" e a palavra fica selecionada; Enter vai para a próxima, Shift+Enter volta, Esc fecha e o cursor volta ao terminal.

## Fatia 13 — a mesma mensagem para vários quadros

- [ ] 40. Com dois ou três agentes abertos, segure Ctrl e clique no cabeçalho de dois deles (ou Shift+arrastar no vazio em volta): aparece no pé da lousa "Para 2 quadros". Escreva "diga oi" e Enter: os dois agentes recebem e respondem; o terceiro não. Shift+Enter quebra a linha sem enviar.

## Fatia 14 — acabamento

- [ ] 41. O instalador se chama `Lousa.ia Setup 0.1.0.exe` e já mostra o ícone novo (lousa escura com quadros azul, verde e âmbar). Depois de instalar, o atalho do Menu Iniciar e a barra de tarefas mostram o mesmo ícone, e o canto de cima da Lousa diz `v0.1.0`.

## Fatia 15 — letra e cores com cara de VSCode

Vale no instalador 0.2.0 (T21.3) ou antes, com `npm run dev`.

- [ ] 42. Com dois terminais abertos, clique na engrenagem e em "Aparência do terminal". Troque as cores de Lousa para Abyss: os dois terminais mudam na hora, sem reabrir, e ficam com o fundo azul-marinho do Abyss do VSCode. Troque a fonte para Consolas e aumente o tamanho e a entrelinha: muda na hora também. Feche e abra a Lousa: volta como você deixou. "Voltar ao padrão" põe Cascadia Code 14, entrelinha 1,2 e cores Lousa. Um quadro onde você usou Ctrl+roda mantém a letra dele.
- [ ] 43. Abra 6 quadros de terminal (ou agentes) e digite rápido em um deles enquanto outro solta bastante texto (ex.: `dir C:\Windows\System32`): as letras aparecem sem atraso, nítidas, e nenhum quadro fica em branco.

## Fatia 16 — colar print no agente

- [ ] 44. Tire um print com Win+Shift+S. Clique dentro de um agente e aperte Ctrl+V: aparece `[Image #1]` na caixa do Claude. Tire outro print e clique no 📎 do cabeçalho do agente: aparece `[Image #2]`. Copie um texto qualquer e clique no 📎 de novo: aparece "Copie um print primeiro (Win+Shift+S)" por 3 segundos. Ctrl+V com texto copiado continua colando o texto.
- [ ] 45. Arraste um `.png` do Explorador do Windows para dentro de um agente: a borda fica tracejada enquanto você arrasta; ao soltar, o caminho aparece e vira `[Image #N]` (leva uns 3 segundos). Arraste outro tipo de arquivo (ex.: um `.md`): o caminho entra entre aspas, sem Enter. Solte um arquivo fora dos quadros: a Lousa continua na tela.

## Fatia 18 — anel de contexto

- [ ] 46. Numa conversa longa com um agente, passando de 50% do contexto, aparece um anel com o número no cabeçalho. Passe o mouse: o balão diz "NN% do contexto usado (X mil de Y mil)". A partir de 70% fica âmbar, e de 90% vermelho. Com o agente trabalhando, o anel fica cinza e o clique não faz nada. Com ele parado, clique: "Compactar a conversa agora?" → "Compactar" faz o Claude resumir a conversa, e o número cai. Na engrenagem, em "Contexto da conversa", troque para "Sempre" e marque "Mostrar o que sobra": todos os anéis mudam na hora.

## Fatia 19 — modelo e esforço no quadro

- [ ] 47. Num agente parado (pode ser um recém-aberto, sem ter mandado nada), clique no rótulo do modelo no cabeçalho (ex.: "Opus 5.5 ▾") e escolha Sonnet: o agente fecha e volta sozinho em poucos segundos, na mesma conversa, e o rótulo passa a dizer Sonnet (D48: o `/model` do Claude mudaria o padrão da conta inteira; agora o VSCode e os outros quadros dessa conta continuam com o modelo deles). Clique no esforço ("alto ▾") e escolha "médio": o rótulo muda. Com o agente trabalhando, troque de novo: o balão diz "Vale quando o agente parar" e a troca acontece sozinha quando ele termina. Escolha "máximo" num modelo que não aceita: depois de uns segundos aparece "⚠" e o balão "Este modelo não aceita esse nível". Feche e abra a Lousa: o quadro volta com Sonnet/médio. Fable também aparece na lista.

## Fatia 20 — uso de cada conta

- [ ] 48. Ao abrir a Lousa, clique no ícone de uma conta Claude: o balão diz "Uso: sem dado ainda". Mande uma mensagem a um agente dessa conta e espere a resposta: sob o ícone aparecem duas barrinhas (sessão de 5 h e semana) e o balão diz "Sessão NN% · zera em XhYY", "Semana NN% · zera <dia> HH:MM" e "visto agora". Os números batem com o "Account & Usage" do VSCode na mesma conta. Passando de 70% a barra fica âmbar, e de 90% vermelha. Sem resposta de agente por mais de 1 h, as barras e o texto ficam cinza. A outra conta não muda.

## Fatia 21 — cara nova (Ardósia e giz)

- [ ] 49. Abra a Lousa instalada (0.2.0): fundo azul-ardósia, texto cor de giz, botões principais em giz (não mais azul). Ponha 4 agentes para trabalhar ao mesmo tempo: a borda de cada um ganha um brilho azulado que gira devagar, a faixa de cima continua na cor da conta, e a pílula no meio da barra de cima diz "● 4 trabalhando". Digitar em outro quadro continua sem atraso. Quando um agente pede algo, o quadro fica com a borda âmbar parada e um halo, e a pílula fica âmbar ("● 1 esperando você · 3 trabalhando"); clicar nela leva ao quadro. Os menus e a barra de cima ficam levemente transparentes por cima da lousa; os quadros não. Com "reduzir movimento" ligado no Windows, o brilho para.

## Fatias 22 e 23 — ver e juntar a cópia

- [ ] 60. Numa cópia separada com um commit, clique em "Juntar" e depois no nome de um arquivo da lista: aparece o que mudou (verde entrou, vermelho saiu). "← Arquivos" volta para a lista. Com um arquivo novo qualquer, fora do git, na pasta original (ex.: `rascunho.txt`), o Juntar funciona e o rascunho continua lá.
- [ ] 61. Com um **agente** numa cópia, provoque um conflito (a mesma linha mudada e com commit na cópia e na original). Juntar → aparece "Conflito…" e o botão "Pedir ao agente para resolver". Clique: a janela fecha e o pedido aparece digitado e enviado no agente. Quando o agente terminar, "Juntar" de novo entra sem conflito. Num quadro de terminal comum o botão não aparece.

## Fatia 24 — pequenos ajustes

- [ ] 62. Clique em "+ Novo quadro" duas vezes seguidas sem mexer na lousa: o segundo quadro nasce ao lado do primeiro, não por cima. No Ctrl+F de um terminal, a busca começa no achado mais de baixo; Enter sobe para o anterior e Shift+Enter desce.

## Fatia 25 — mensagens prontas

- [ ] 63. Clique dentro de um agente, aperte Ctrl+K e digite "commit": aparece "Mandar: Faça commit do que está pronto…". Enter: a frase chega a esse agente, e só a ele, e no alto da lousa aparece "Enviado para 1 quadro". Selecione dois agentes com Ctrl+clique e clique no ★ da barra: aparecem as três frases padrão. Escreva uma frase sua, clique em "★ Guardar a mensagem escrita", feche e abra a Lousa: a frase continua no ★ e no Ctrl+K. O × ao lado da frase apaga.

## Fatia 26 — nota na lousa

- [ ] 64. Clique em "+ Nota" (ao lado de "+ Novo quadro"): aparece uma nota cor de papel, fora de cima dos quadros, já pronta para escrever. Escreva `# Plano` e `- [ ] testar` e clique em "Pronto": aparece o título e a caixinha ☐. Feche e abra a Lousa: a nota volta igual, no mesmo lugar e tamanho. Clique dentro de um agente e depois em "➤ Mandar" na nota: o texto chega ao agente. "×" numa nota com texto pergunta antes de apagar. Ctrl+K "nota" também cria uma.

## Fatia 27 — vistas salvas

- [ ] 65. Arrume a lousa do seu jeito, aperte Ctrl+K e digite "revisão": escolha "Guardar vista atual como "revisão"". Mexa em quadros e na câmera à vontade. Ctrl+K "revisão" → "Vista: revisão": tudo volta ao lugar, inclusive a câmera; um quadro aberto depois de guardar fica onde está. Feche e abra a Lousa: a vista continua no Ctrl+K. "Apagar vista: revisão" apaga só a vista.

## Correção — seleção com a lousa fora de 100%

- [ ] 66. Diminua a lousa (Ctrl+roda fora dos quadros ou o "−" do canto) e, num terminal com bastante texto, arraste o mouse sobre uma frase lá embaixo: a faixa azul pinta exatamente a frase. Ctrl+C e cole em outro lugar: vem a frase certa. Faça o mesmo com a lousa ampliada (⤢ no quadro) e com duplo clique numa palavra. Um link de arquivo no terminal abre ao clicar em cima dele, com qualquer zoom.

## Correção — ⤢ do quadro

- [ ] 67. Clique no ⤢ de um quadro: ele ocupa a lousa. ⤢ de novo: volta para a vista de antes. Agora amplie, arraste a lousa com o botão do meio (ou a roda) e aperte ⤢ outra vez: o quadro volta a ocupar a lousa, em vez de pular para uma vista antiga. Com a lousa longe de um quadro, Ctrl+K com o nome da pasta dele e Enter: a lousa vai até o quadro e o deixa no centro, sem passar do tamanho normal (100%). O mesmo vale ao clicar na notificação do Windows de um agente.

## Ajustes do aceite 0.2.0 (A1 a A4)

- [ ] 68. Diminua a lousa (Ctrl+roda fora dos quadros) e depois amplie um quadro com o ⤢: em todos os zooms, depois de meio segundo parado, a letra do terminal fica nítida (sem borrão), do mesmo jeito que a 100%. Selecione e copie uma frase: vem a frase certa.
- [ ] 69. Clique duas vezes seguidas no cabeçalho de um quadro: ele **não** amplia. Só o ⤢ amplia e volta.
- [ ] 70. Clique na engrenagem: o painel "Contas" abre com fundo inteiro, sem a lateral "Pastas" aparecendo por trás, e vai até "Abrir pasta de registros".
- [ ] 71. Com um agente Claude que já respondeu, olhe a barra de cima sem clicar: ao lado do ícone da conta aparece "sessão N% 2h04" e "semana N% sex 03:00". Acima de 70% o número fica âmbar e acima de 90% fica vermelho. Clicar no mostrador abre o balão da conta. Engrenagem → "Uso das contas" → "Só no clique": o mostrador some e voltam as barrinhas; "À vista" traz de volta.


## Fatia 28 — time de agentes por linhas (D39)

- [ ] 72. Abra um agente Claude numa pasta git. Ele tem uma bolinha de cada lado (terminal comum e Codex não têm). Clique na bolinha da direita: nasce um colega à direita, na mesma conta, numa cópia separada (o cabeçalho diz "app ⑂ claude-N"), com uma linha colorida e uma seta do primeiro para ele. Arraste a bolinha da direita e solte no vazio: outro colega nasce onde soltou.
- [ ] 73. Puxe uma linha de um agente até a bolinha da esquerda de outro: a linha fica. Tente a volta (do segundo para o primeiro) e um círculo (C → A num time A → B → C): a linha não fica e aparece o motivo no alto da lousa. Ligue dois agentes da mesma pasta (sem cópia): a linha fica âmbar com "⚠ mesma pasta". Feche e abra a Lousa: as linhas continuam no lugar, cada time com a sua cor.
- [ ] 74. Clique numa linha: o menu tem "recebe sozinho (automático)" marcado, "perguntar", "Pausar" e "Remover a linha". "Perguntar" põe o rótulo "perguntar" na linha; "Pausar" deixa a linha tracejada e apagada; "Remover" tira só a linha (os dois agentes seguem abertos). Numa linha âmbar, "⑂ Abrir o colega numa cópia" cria um colega numa cópia, a linha passa para ele e o quadro antigo continua aberto. Fechar um quadro tira as linhas dele.

## Fatia 29 — o time se conhece (D39)

- [ ] 75. Num time de dois agentes (linha entre eles), clique em "+ papel" no cabeçalho de cada um e escreva "Construtor" e "Revisor" (Enter guarda). Uns 2 segundos depois, com o agente parado, cada um recebe uma mensagem que começa com "[Lousa] Você é…", com a pasta e a branch dele, os colegas e para quem entrega; o Claude responde "ok". Agente trabalhando só recebe quando para. Tire a linha: os dois recebem "Você não faz mais parte do time".

## C1 — git e GitHub de cada conta (D42)

- [ ] 76. Engrenagem → cartão da conta Pessoal → "Git e GitHub": escreva o seu nome e o e-mail que devem aparecer nos commits pessoais e salve. Feche e abra o terminal de um quadro da Pessoal e rode `git var GIT_AUTHOR_IDENT`: aparece o nome e o e-mail que você escreveu. Num quadro da Principal, o mesmo comando mostra o do PC. Um e-mail sem @ mostra "E-mail inválido" e não grava.
- [ ] 77. (Só se quiser GitHub separado.) Marque "GitHub só desta conta" numa conta e salve. Num terminal novo dessa conta, `gh auth status` diz que não há login; `gh auth login` entra (escolha a conta GitHub certa no navegador). O primeiro `git push` dessa conta pede o login do GitHub no navegador. Nos terminais das outras contas, o `gh` e o push continuam com o login de antes.

## Fatia 30 — o trabalho passa adiante (D39, D43)

- [ ] 78. Num time Construtor → Revisor (linha entre dois agentes Claude, cada um na sua cópia), peça uma tarefa pequena ao Construtor. Quando ele terminar, a linha mostra "→ passou para Revisor" e o Revisor recebe sozinho uma mensagem que começa com "[Lousa] Seu colega Construtor terminou", com o que ele disse e a branch dele. Se o Revisor estiver trabalhando, a mensagem espera ele parar. Com a linha em "perguntar", ela mostra "▶ Passar para Revisor" e só passa quando você clica. Depois de 3 repasses seguidos sem você digitar em nenhum quadro do time, a linha pausa e mostra "Limite de 3 repasses: Continuar?"; o clique passa e retoma. A resposta "ok" à apresentação do time não é repassada.

## Fatia 31 — juntar o time (D39, D44)

- [ ] 79. Num time de agentes em cópias separadas (ex.: Construtor → Revisor), depois que os dois fizeram commit, clique na linha → "⇢ Juntar o time". A janela lista as cópias na ordem de entrega. "Juntar N cópias" junta uma por vez na pasta original e diz o resultado de cada uma: "✓ … juntada em main", "Ficou de fora (tem alteração não salva)" para a cópia com mudança sem commit, e "Parou em …: Conflito" no primeiro conflito, com "Pedir ao agente de … para resolver". As cópias continuam abertas; feche os quadros para apagá-las.
