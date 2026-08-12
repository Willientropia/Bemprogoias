# Painel do Gestor — status da implementação

Implementação do handoff em [`docs/handoff-painel-gestor/`](./docs/handoff-painel-gestor/)
e da seção adicional de Eleitores.

**Decisão tomada:** construir as três seções fiéis ao handoff usando uma **campanha
de demonstração persistida no Firestore**. Os 15 líderes fictícios alimentam o mesmo
fluxo de dados usado por uma campanha normal. A campanha também possui 300 eleitores
fictícios distribuídos em uma curva desigual entre os 16 líderes atuais, incluindo Adiel.

**Estado geral:** código escrito; seed aplicado no Firestore, build, lint e suíte de
testes passando. **A validação visual automatizada no navegador ainda está pendente.**

---

## O que já está feito

### Infraestrutura
- [x] `leaflet` + `react-leaflet` instalados
- [x] `src/data/demoPanelData.js` — fonte versionada dos 15 líderes usada apenas
  pelo script de seed; o painel não lê mais a constante diretamente
- [x] `scripts/seedDemoCampaign.js` — seed idempotente em
  `campaigns/{campaignId}/members/demo-l1..demo-l15`, com os espelhos mínimos em
  `users/{id}` necessários para edição/remoção pelas Security Rules
- [x] `scripts/seedDemoVoters.js` — mantém no máximo 300 eleitores únicos,
  geolocalizados, pagináveis e vinculados aos líderes; remove apenas excedentes do
  próprio seed e recalcula totais, validados e métricas de produção
- [x] Tokens e classes do painel no `src/index.css` (`.panel-card`, sidebar,
  `.filter-btn`, `.kpi-grid`, `.switch`, `.map-pin`, `pulse-dot`, e o CSS do Leaflet)
- [x] Sidebar à esquerda com as cinco seções do gestor, recolhimento persistido no
  desktop e drawer com backdrop/fechamento no celular
- [x] Responsividade do painel: grids empilham, KPIs passam de 4 para 2 e depois 1
  coluna, pódio vira lista, formulário do relatório empilha e o mapa reduz a altura

### Abas
- [x] **Shell de navegação** (`ManagerDashboard.jsx`) com as seções na sidebar
  esquerda: Regiões, Rede de Indicações, Eleitores, Relatório Expresso e Cadastro
  de Líderes
- [x] **Aba Regiões** (`panel/RegionsTab.jsx`) — mapa Leaflet centrado em Goiânia
  (zoom 11), pinos em forma de gota dimensionados pela base, círculos de alcance
  (`400 + eleitores * 0.9` metros), popup por líder, 4 KPIs derivados dos dados,
  filtro de desempenho (todos/alto/médio/alerta) que adiciona e remove camadas,
  card "Líder selecionado", lista lateral clicável com `setView` zoom 14, legenda e
  estado vazio
- [x] **Aba Rede de Indicações** (`panel/NetworkTab.jsx`) — 4 KPIs derivados, pódio
  com o 1º lugar destacado em verde escuro, tabela completa com posição, avatar,
  estrelas, barra comparativa de eleitores e "+N na semana" colorido por faixa; as
  três ordenações (mais validados / melhor rating / maior crescimento) re-renderizam
  pódio e tabela juntos
- [x] **Eleitores** (`panel/VotersTab.jsx`) — 4 KPIs, produção validada por todos os
  líderes, explicação do processo de validação, filtros por líder/status, busca local,
  tabela com motivo da evidência e paginação de 50 em 50
- [x] **Aba Relatório Expresso** (`panel/ReportTab.jsx`) — fechamento diário
  obrigatório de todos os líderes, um único WhatsApp do gestor persistido na campanha,
  horário configurável, blocos complementares, prévia em tempo real e teste que abre a
  mensagem pronta no WhatsApp do gestor

### Regras de negócio extraídas para módulos testáveis
- [x] `panel/leaderMetrics.js` — rating relativo pelos eleitores validados (maior =
  5,0; menor = 1,0), ordenações, cor do "+N na semana", formatação pt-BR
- [x] `panel/buildReportMessage.js` — montagem da mensagem do WhatsApp, com cada
  bloco entrando só se o toggle estiver ligado
- [x] `panel/panelLeaders.js` — valida e adapta os documentos vindos do Firestore;
  líderes incompletos continuam no cadastro, mas não quebram mapa/ranking

### Testes escritos e executados
- [x] `tests/component/leaderMetrics.test.jsx` — 11 casos (rating nos limites,
  as três ordenações, imutabilidade do array, faixas de cor, formatação)
- [x] `tests/component/buildReportMessage.test.jsx` — 7 casos (cabeçalho e rodapé,
  todos os líderes sempre presentes, soma e ordenação do dia, alertas e horário)
- [x] `tests/component/ReportTab.test.jsx` — destinatário único do gestor,
  persistência de telefone/horário e abertura da prévia no WhatsApp
- [x] Testes de layout/sidebar, integração do dashboard com as assinaturas do
  Firestore e filtragem dos líderes aptos ao painel
- [x] Testes do cadastro geolocalizado, gerador de eleitores e página de consulta

---

## O que falta

### Imediato (era o próximo passo)
- [x] **Rodar `npm test`** — suíte completa passando
- [ ] **Validar visualmente no navegador** nos breakpoints desktop/tablet/celular
- [x] Implementação inicial commitada no `main` (`13ceada`)

### Pontos do handoff ainda não implementados
- [x] **Chip "Dados sincronizados · há 4 minutos"** no cabeçalho da aba Regiões
- [ ] **Botão "Abrir ficha do líder"** no card de líder selecionado (o handoff prevê
  o botão, mas não existe tela de ficha para onde levar)
- [x] **Destinatário do relatório** — o gestor cadastra um único WhatsApp; líderes
  nunca recebem o relatório automático
- [x] `invalidateSize()` do mapa ao voltar para a aba Regiões; a aba permanece
  montada para preservar zoom, posição, filtro e líder selecionado
- [x] O relatório não possui escopo variável: todos os líderes entram no fechamento diário

### Para sair da demo (quando os dados reais existirem)
- [x] **lat/lng no cadastro de líder** — o gestor escolhe um ponto de atuação e o
  cadastro persiste bairro, região e coordenadas; o Adiel existente foi migrado
- [x] **Contagem demonstrativa de eleitores por líder** — 300 documentos em
  `campaigns/{campaignId}/voters`, sendo 273 validados, com totais coerentes nos membros
- [ ] **Classificação de desempenho** (`alto`/`medio`/`alerta`) — o handoff recomenda
  calcular no backend por regra explícita e auditável (ex.: crescimento na semana
  contra a média da própria base), não classificar à mão
- [ ] **Números estáticos da demo** — demandas abertas, sentimento do Rádio Peão IA e
  presença nos conselhos estão fixos em `DEMO_STATIC_STATS`; nenhum tem origem no
  sistema hoje
- [x] **Persistir destino e horário do Relatório Expresso** — salvos no documento da
  campanha com regra que limita o gestor a esses campos
- [ ] **Disparo automático pela WhatsApp Business API** — o teste já abre a mensagem
  pronta no número do gestor; o agendamento sem intervenção ainda exige provedor/API

### Fluxo dos dados
As seções analíticas assinam `campaigns/{campaignId}/members` pelo serviço
`subscribeToLeaders`. O adaptador `panel/panelLeaders.js` seleciona documentos com
`name`, `regiao`, `bairro`, `lat`, `lng`, `eleitores`, `semana` e `perf`. A fonte
`DEMO_LEADERS` só é importada por `scripts/seedDemoCampaign.js`.
A seção Eleitores usa consultas paginadas em `services/voters.js` e índices compostos
de `leaderId`, `validationStatus` e `createdAt`.

---

## Observações

- O aviso de demonstração (`DemoBanner`) depende de `campaign.isDemo` no Firestore.
- A aba "Cadastro de Líderes" foi mantida separada justamente porque é a única que
  opera em dados reais — ela não mostra o banner.
- O handoff é do "Bem pro Brasil"; adaptei os textos para "Bem para Goiás" (título da
  mensagem do relatório e URL do rodapé). Os assets `logo-brasil-*.png` do handoff
  **não** foram usados — o painel segue usando a `logo-mark.png` já no projeto.

---

## Aplicativo Windows (Electron) — status

**Feito e commitado:**
- `electron/main.cjs` e `electron/preload.cjs` com `contextIsolation` e `sandbox`
  ligados; links externos abrem no navegador do sistema e uma segunda execução
  foca a janela existente em vez de abrir outro painel no mesmo Firestore.
- Build separado da interface (`npm run build:electron`): base relativa, porque
  `/assets` aponta para a raiz do disco em `file://`, e sem service worker.
- `HashRouter` no desktop, escolhido em tempo de execução — o `BrowserRouter`
  precisa de um servidor respondendo qualquer rota com o index.
- `electron-builder` configurado para NSIS x64. **O instalador é gerado**
  (`BemProGoias-Setup-1.0.7.exe`, ~101 MB) e contém `dist/` e `electron/`.

**`ELECTRON_RUN_AS_NODE` (resolvido — mas leia se o app não abrir):**

Durante o desenvolvimento o app abria e fechava em silêncio (exit 0), com
`require('electron')` devolvendo a string do caminho do executável em vez da
API, e `app` chegando `undefined`.

A causa era a variável de ambiente **`ELECTRON_RUN_AS_NODE=1`**, que instrui o
binário do Electron a se comportar como Node puro: sem processo principal, sem
janela, sem API. Ela vinha do terminal em que os comandos rodavam (o próprio
Claude Code roda sobre Electron e a define para seus subprocessos), não do
projeto.

Como reconhecer: `electron --version` imprime a versão do **Node** (v24…) em
vez da do Electron (v43…). Como contornar num terminal afetado:

```bash
env -u ELECTRON_RUN_AS_NODE npx electron .
```

Num terminal comum (PowerShell, cmd, Git Bash fora do agente) a variável não
existe e nada disso é necessário.

**Armadilha do empacotamento (resolvida, mas vale saber):** o electron-builder
respeita o `.gitignore`, onde `dist` está listado. O primeiro pacote saiu sem a
interface e sem o processo principal. Por isso `build.files` começa com
`"!**/*"` e inclui explicitamente o que entra.

**EPERM ao gerar o instalador:** o Windows Defender segura a pasta durante o
rename de `win-unpacked.tmp`. Gerar fora da árvore do projeto contorna:
`npx electron-builder --win --publish never -c.directories.output=C:/tmp/bpg-release`
