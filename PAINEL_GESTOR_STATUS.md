# Painel do Gestor — status da implementação

Implementação do handoff em [`docs/handoff-painel-gestor/`](./docs/handoff-painel-gestor/)
(as três abas: Regiões, Rede de Indicações, Relatório Expresso).

**Decisão tomada:** construir as três abas fiéis ao handoff usando os **dados de
demonstração** (os 15 líderes de Goiânia e os números da demo), para apresentação ao
cliente. A troca por dados reais é um passo posterior — ver "Como trocar por dados reais".

**Estado geral:** código escrito, build e lint passando. **Ainda não rodei a suíte de
testes completa nem validei no navegador** — foi onde a implementação parou.

---

## O que já está feito

### Infraestrutura
- [x] `leaflet` + `react-leaflet` instalados
- [x] `src/data/demoPanelData.js` — base de demonstração isolada e marcada com
  `isDemoData`, com comentário no topo explicando de onde cada dado deve vir em
  produção
- [x] Tokens e classes do painel no `src/index.css` (`.panel-card`, `.panel-tab`,
  `.filter-btn`, `.kpi-grid`, `.switch`, `.map-pin`, `pulse-dot`, e o CSS do Leaflet)
- [x] Responsividade do painel: abaixo de 1100px os grids de duas colunas empilham e
  os KPIs vão de 4 para 2 colunas

### Abas
- [x] **Shell de navegação** (`ManagerDashboard.jsx`) com 4 abas: as 3 do handoff +
  "Cadastro de Líderes" (o CRUD real que já existia, preservado)
- [x] **Aba Regiões** (`panel/RegionsTab.jsx`) — mapa Leaflet centrado em Goiânia
  (zoom 11), pinos em forma de gota dimensionados pela base, círculos de alcance
  (`400 + eleitores * 0.9` metros), popup por líder, 4 KPIs derivados dos dados,
  filtro de desempenho (todos/alto/médio/alerta) que adiciona e remove camadas,
  card "Líder selecionado", lista lateral clicável com `setView` zoom 14, legenda e
  estado vazio
- [x] **Aba Rede de Indicações** (`panel/NetworkTab.jsx`) — 4 KPIs derivados, pódio
  com o 1º lugar destacado em verde escuro, tabela completa com posição, avatar,
  estrelas, barra comparativa de eleitores e "+N na semana" colorido por faixa; as
  três ordenações (mais eleitores / melhor rating / maior crescimento) re-renderizam
  pódio e tabela juntos
- [x] **Aba Relatório Expresso** (`panel/ReportTab.jsx`) — 4 KPIs, seleção de
  frequência, horário e escopo, toggles dos 6 blocos, lista de destinatários com o
  total **derivado da soma de pessoas** (14, não fixo), prévia da mensagem no estilo
  WhatsApp atualizada em tempo real, botão de teste com feedback de 2,4s e a nota de
  confiança

### Regras de negócio extraídas para módulos testáveis
- [x] `panel/leaderMetrics.js` — rating (um décimo de estrela a cada 50 eleitores,
  limitado entre 1 e 5), ordenações, cor do "+N na semana", formatação pt-BR
- [x] `panel/buildReportMessage.js` — montagem da mensagem do WhatsApp, com cada
  bloco entrando só se o toggle estiver ligado

### Testes escritos (mas ainda não executados)
- [x] `tests/component/leaderMetrics.test.jsx` — 11 casos (rating nos limites,
  as três ordenações, imutabilidade do array, faixas de cor, formatação)
- [x] `tests/component/buildReportMessage.test.jsx` — 7 casos (cabeçalho e rodapé
  sempre presentes, blocos desligados omitidos, somas corretas, ranking por
  crescimento, só bases em alerta listadas, frequência/horário refletidos)

---

## O que falta

### Imediato (era o próximo passo)
- [ ] **Rodar `npm test`** — os 18 testes novos nunca foram executados; podem falhar
- [ ] **Validar no navegador** — nenhuma das três abas foi vista rodando ainda. O
  mapa Leaflet em particular costuma precisar de ajuste (altura do container,
  `invalidateSize` ao trocar de aba)
- [ ] Commitar (nada disso foi commitado ainda)

### Pontos do handoff ainda não implementados
- [ ] **Chip "Dados sincronizados · há 4 minutos"** no cabeçalho da aba Regiões
- [ ] **Botão "Abrir ficha do líder"** no card de líder selecionado (o handoff prevê
  o botão, mas não existe tela de ficha para onde levar)
- [ ] **Botão "Adicionar" destinatário** — está no handoff, mas sem um fluxo real de
  cadastro de destinatário decidido, deixei de fora em vez de colocar um botão morto
- [ ] `invalidateSize()` do mapa ao voltar para a aba Regiões (o handoff pede
  explicitamente; hoje o mapa desmonta e remonta ao trocar de aba, o que funciona,
  mas perde o estado de zoom/posição)
- [ ] Escopo do relatório (`Todos os líderes` / `Somente Região Central` / etc.) é
  exibido e selecionável, mas **ainda não filtra** o conteúdo da prévia

### Para sair da demo (quando os dados reais existirem)
- [ ] **lat/lng no cadastro de líder** — hoje o líder tem só `regiao` como texto
  livre. O mapa precisa de coordenadas; o caminho natural é geocodificar o endereço
  no momento do cadastro
- [ ] **Contagem de eleitores por líder** — depende da coleção
  `campaigns/{campaignId}/voters`, que é escopo do Dev B e ainda não existe
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

### Como trocar por dados reais
Toda a fronteira está em um lugar só: `src/data/demoPanelData.js` e a linha
`const panelLeaders = DEMO_LEADERS` no `ManagerDashboard.jsx`. As três abas recebem os
líderes por prop (`<RegionsTab leaders={...} />`), então basta passar os líderes do
Firestore no formato esperado (`{ id, nome, regiao, bairro, lat, lng, eleitores,
semana, perf }`) e remover o `DemoBanner`.

---

## Observações

- O aviso de dados de demonstração (`DemoBanner`) aparece no topo das três abas do
  handoff, para ninguém confundir número ilustrativo com dado real da campanha. Ele
  some sozinho quando `isDemoData` virar `false`.
- A aba "Cadastro de Líderes" foi mantida separada justamente porque é a única que
  opera em dados reais — ela não mostra o banner.
- O handoff é do "Bem pro Brasil"; adaptei os textos para "Bem para Goiás" (título da
  mensagem do relatório e URL do rodapé). Os assets `logo-brasil-*.png` do handoff
  **não** foram usados — o painel segue usando a `logo-mark.png` já no projeto.
