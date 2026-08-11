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
- [x] **Aba Relatório Expresso** (`panel/ReportTab.jsx`) — 4 KPIs, seleção de
  frequência, horário e escopo, toggles dos 6 blocos, lista de destinatários com o
  total **derivado da soma de pessoas** (14, não fixo), prévia da mensagem no estilo
  WhatsApp atualizada em tempo real, botão de teste com feedback de 2,4s e a nota de
  confiança

### Regras de negócio extraídas para módulos testáveis
- [x] `panel/leaderMetrics.js` — rating relativo pelos eleitores validados (maior =
  5,0; menor = 1,0), ordenações, cor do "+N na semana", formatação pt-BR
- [x] `panel/buildReportMessage.js` — montagem da mensagem do WhatsApp, com cada
  bloco entrando só se o toggle estiver ligado
- [x] `panel/reportScope.js` — filtros de líderes usados pela prévia conforme o
  escopo selecionado
- [x] `panel/panelLeaders.js` — valida e adapta os documentos vindos do Firestore;
  líderes incompletos continuam no cadastro, mas não quebram mapa/ranking

### Testes escritos e executados
- [x] `tests/component/leaderMetrics.test.jsx` — 11 casos (rating nos limites,
  as três ordenações, imutabilidade do array, faixas de cor, formatação)
- [x] `tests/component/buildReportMessage.test.jsx` — 7 casos (cabeçalho e rodapé
  sempre presentes, blocos desligados omitidos, somas corretas, ranking por
  crescimento, só bases em alerta listadas, frequência/horário refletidos)
- [x] `tests/component/reportScope.test.jsx` — 5 casos (todos, Região Central,
  bases em alerta, top 20 imutável e atualização da prévia pela interface)
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
- [ ] **Botão "Adicionar" destinatário** — está no handoff, mas sem um fluxo real de
  cadastro de destinatário decidido, deixei de fora em vez de colocar um botão morto
- [x] `invalidateSize()` do mapa ao voltar para a aba Regiões; a aba permanece
  montada para preservar zoom, posição, filtro e líder selecionado
- [x] Escopo do relatório (`Todos os líderes` / `Somente Região Central` / etc.)
  filtra o conteúdo da prévia

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
- [ ] **Persistir a configuração do Relatório Expresso** — frequência, horário,
  escopo, blocos e destinatários vivem só no estado do componente; nada é salvo
- [ ] **Envio real no WhatsApp** — o botão de teste só muda o próprio rótulo; não há
  integração com a WhatsApp Business API

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
