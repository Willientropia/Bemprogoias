# Handoff: Painel do Gestor — Bem pro Brasil

## Overview

Painel administrativo restrito a **gestores** da plataforma "Bem pro Brasil" (plataforma de participação popular para uma candidatura legislativa — deputado federal, deputado estadual e senador, partido Solidariedade). Enquanto o app público serve apoiadores, este painel serve a coordenação de campanha e tem exatamente **três abas**:

1. **Regiões** — mapa interativo de Goiânia com a localização dos líderes regionais.
2. **Rede de Indicações** — ranking dos líderes com rating pela quantidade de eleitores validados.
3. **Relatório Expresso** — configuração de um bot que envia no WhatsApp os relatórios dos líderes ao fim de cada dia (ou na frequência configurada).

Conceito de domínio importante: cada cidade/região/segmentação pode ter um **presidente de conselho de participação pública local**. Se a campanha tem 250 líderes, ela pode ter até 250 conselhos. O objetivo do produto é ampliar a base de eleitores e engajar o público nos projetos do mandato.

---

## About the Design Files

Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram a aparência e o comportamento pretendidos, **não código de produção para copiar diretamente**.

A tarefa é **recriar esses designs no ambiente já existente do codebase de destino** (React, Vue, React Native, SwiftUI, nativo, etc.), usando os padrões, bibliotecas e convenções já estabelecidos nele. Se ainda não existe um ambiente, escolha o framework mais apropriado para o projeto e implemente os designs nele.

Um ponto de atenção técnica: a aba **Regiões** depende de um mapa real (Leaflet + tiles do OpenStreetMap no protótipo). No codebase de destino, use a biblioteca de mapas já adotada (Leaflet/react-leaflet, MapLibre, Mapbox GL, Google Maps, MapKit) — o que importa é que a geometria seja **dados geográficos reais**, nunca um desenho de mapa feito à mão.

## Fidelity

**High-fidelity (hifi).** Cores, tipografia, espaçamentos, estados e microinterações estão definidos e devem ser reproduzidos fielmente, usando as bibliotecas e componentes já existentes no codebase.

---

## Design Tokens

### Cores

| Token | Hex | Uso |
|---|---|---|
| Verde escuro (marca) | `#143a1c` | Sidebar, painéis de destaque, fundo do login |
| Verde ação | `#1f6b34` | Botões primários, valores positivos, "alto desempenho" |
| Verde ação (hover) | `#1a5c2c` | Hover do botão primário |
| Dourado (marca) | `#f3c41c` | Item de nav ativo, números de destaque, selos |
| Dourado escuro (texto) | `#b8860b` / `#a5852a` / `#8a6d12` | Texto sobre fundos creme |
| Âmbar (médio) | `#d9a520` | "Desempenho médio" |
| Vermelho (alerta) | `#c0392b` | "Base em alerta", erros, prioridade crítica |
| WhatsApp | `#25d366` | Elementos do bot de WhatsApp |
| Bolha WhatsApp | `#dcf8c6` | Fundo da mensagem enviada |
| Fundo WhatsApp | `#e6ddd4` | Fundo do chat na prévia |
| Fundo da página | `#f4f4f2` | Fundo do `main` |
| Superfície | `#ffffff` | Cards |
| Borda | `#e8e8e3` | Borda dos cards |
| Borda de input | `#dcdcd4` | Inputs e selects |
| Divisor | `#f0efe9` | Linhas entre itens de lista |
| Fundo sutil | `#f7f7f3` | Cabeçalho de tabela, blocos internos |
| Creme (destaque) | `#fdf8e3` fundo / `#efe3ab` borda | Avisos, metas |
| Texto principal | `#1c2b1f` | Corpo |
| Título | `#16331c` | Headings |
| Texto forte em lista | `#243528` | Nomes em listas |
| Texto secundário | `#6b7669` | Subtítulos |
| Texto terciário | `#8a8b80` | Apoio |
| Texto fraco / label | `#9aa397` | Labels em caixa alta |
| Cinza barra | `#eef0ec` | Trilha das barras de progresso |
| Chip neutro | `#eef0ee` fundo / `#6b7280` texto | Status neutro |
| Chip positivo | `#e3f1e8` fundo / `#1f6b34` texto | Status positivo |
| Chip alerta | `#fbe9e6` fundo / `#c0392b` texto | Status negativo |

### Tipografia

- **Display/títulos:** `Spectral` (serif), pesos 500/600/700/800.
- **Interface/corpo:** `Public Sans` (sans-serif), pesos 400/500/600/700.
- Escala usada:
  - H1 de tela: Spectral 700, **36px**, `line-height: 1.05`, cor `#16331c`
  - H1 do login: Spectral 700, `clamp(30px, 3.4vw, 42px)`, `line-height: 1.08`
  - H2/H3 de card: Spectral 700, **17–19px**
  - KPI numérico: Spectral 700, **31px**, `line-height: 1`
  - KPI grande (pódio): Spectral 700, **32px**
  - Nome em lista: Public Sans 600, **13,5–14px**
  - Corpo: Public Sans 400, **13–15px**, `line-height: 1.5–1.62`
  - Subtítulo de tela: **15px**, cor `#6b7669`
  - Label de seção (caixa alta): **12px**, peso 700, `letter-spacing: 1.5px`, cor `#9aa397`
  - Label de KPI (caixa alta): **11,5px**, peso 600, `letter-spacing: 0.7px`, cor `#9aa397`
  - Meta em lista: **11,5–12px**, cor `#9aa397`

### Espaçamento, raios e sombras

- Padding do conteúdo principal: `40px 44px 70px`, largura máxima **1240px**, centralizado.
- Gap padrão entre cards: **15–18px**; grid de KPIs: 4 colunas, gap 15px.
- Raios: **9–10px** (botões de filtro), **11px** (inputs, botões), **12px** (chips de info), **14px** (cards), **16–18px** (cards grandes/painéis), **22px** (card do logo no login), **999px** (chips e barras).
- Sombras: card do logo no login `0 22px 60px rgba(0,0,0,.32)`; popup do mapa `0 12px 34px rgba(20,58,28,.22)`; pino do mapa `0 4px 12px rgba(0,0,0,.32)`; knob do toggle `0 1px 4px rgba(0,0,0,.2)`.
- Animação de entrada de tela: `bg-fade` — `from { opacity:0; translateY(8px) } to { opacity:1; translateY(0) }`, **0.4s ease both**.
- Pulso de status "ao vivo": `pulse-dot` — `0%,100% { opacity:1; scale(1) } 50% { opacity:.35; scale(.7) }`, **1.5s infinite**.
- Transições: nav `background .18s, color .18s`; filtros `all .18s`; toggle `background .22s` + `transform .22s`; barras de progresso `width .6s`.

---

## Shell da aplicação (comum às três abas)

### Layout

Linha flex de altura total: **sidebar fixa de 250px** + `main` com scroll próprio (`overflow-y: auto`, fundo `#f4f4f2`).

### Sidebar

- Fundo `#143a1c`, texto branco, padding `22px 16px`, coluna flex.
- **Topo — marca:** quadrado branco 44×44, raio 11px, padding 4px, com o emblema da logo (`object-fit: contain`); ao lado, "BEM PRO BRASIL" (Spectral 700, 14,5px, `letter-spacing: .4px`) e a linha "PAINEL DO GESTOR" (7,5px, `letter-spacing: 1.3px`, cor `#f3c41c` — é o que diferencia do app público). Borda inferior `1px solid rgba(255,255,255,.08)`, `padding-bottom: 20px`, `margin-bottom: 16px`.
- **Nav:** coluna com gap 3px. Cada item: `display:flex`, gap 11px, padding `11px 13px`, raio 10px, ícone SVG 18px (`stroke: currentColor`, `stroke-width: 2`), label 13,5px peso 500.
  - Repouso: fundo transparente, texto `rgba(255,255,255,.72)`
  - Hover: fundo `rgba(255,255,255,.07)`, texto `#fff`
  - **Ativo: fundo `#f3c41c`, texto `#143a1c`, peso 700**
  - Itens: Regiões (ícone de pino), Rede de Indicações (ícone de nós conectados), Relatório Expresso (ícone de balão de conversa)
- **Rodapé:** empurrado com `margin-top: auto`, borda superior `rgba(255,255,255,.08)`. Avatar circular 34px com fundo `#f3c41c`, texto `#143a1c`, peso 700, exibindo a inicial do gestor; ao lado o nome (13px, peso 600, truncado com ellipsis) e "Gestora · Goiânia" (11px, `rgba(255,255,255,.5)`); à direita, botão de sair (ícone 17px, `rgba(255,255,255,.45)`, hover `#f3c41c`).

### Comportamento da navegação

Trocar de aba: alterna a classe ativa, mostra apenas a seção correspondente, **reseta o scroll do `main` para o topo** e, ao voltar para a aba do mapa, chama o equivalente a `invalidateSize()` do mapa (com ~80ms de atraso) para ele recalcular as dimensões do contêiner.

---

## Tela: Login do gestor

**Propósito:** acesso restrito à coordenação; na apresentação, é a primeira tela vista pelo cliente.

**Layout:** linha flex, `align-items: stretch`, `min-height: 100vh`.

- **Painel esquerdo (44% da largura):** fundo `#143a1c`, coluna flex com `justify-content: space-between`, gap 28px, padding `38px 44px`, **`overflow-y: auto`** (requisito: o conteúdo precisa poder crescer e rolar — nada pode ser cortado em telas curtas de ~650–768px).
  - Brilho decorativo: círculo de 520px, `radial-gradient(circle, rgba(243,196,28,.15), transparent 70%)`, posicionado em `top:-190px; right:-150px`, `pointer-events: none`.
  - Card branco do logo: raio 22px, padding `20px 26px`, `max-width: 300px`, `align-self: flex-start`, `flex-shrink: 0`, com a logo completa (`max-width: 248px`).
  - Selo: "ACESSO RESTRITO · GESTORES" — pill com fundo `rgba(243,196,28,.16)`, borda `rgba(243,196,28,.4)`, texto `#f3c41c`, 11px, peso 700, `letter-spacing: 2px`.
  - Título: "Coordene a / base que elege." (quebra de linha explícita).
  - Parágrafo: "Mapa dos líderes, desempenho da rede de indicações e relatórios automáticos no WhatsApp — a operação do mandato em um só painel."
  - Três estatísticas (Spectral 700, 28px, `#f3c41c` + label 12px): **250** líderes ativos · **12** regiões mapeadas · **38.4k** eleitores na base.
  - Rodapé: "Solidariedade · Candidatura legislativa · Painel interno" (11px, `rgba(255,255,255,.4)`, `flex-shrink: 0`).
- **Painel direito (flex:1):** centralizado, padding `38px 44px`, `overflow-y: auto`, formulário com `max-width: 390px`.
  - Título "Entrar como gestor" (Spectral 700, 28px) + linha de apoio "Use suas credenciais de coordenação."
  - Campo **Nome do gestor** (placeholder "Ex: Ana Ribeiro").
  - Campo **Código de gestor** (placeholder "Ex: GESTOR2026", `letter-spacing: 1px`).
  - Inputs: largura total, padding `13px 15px`, borda `1px solid #dcdcd4`, raio 11px, fundo branco, 14px, sem outline.
  - Mensagem de erro: 12,5px, `#c0392b`, oculta por padrão.
  - Botão primário: largura total, `#1f6b34`, texto branco, raio 11px, padding 15px, peso 700, 14,5px.
  - Aviso de demonstração: fundo `#fdf8e3`, borda `#efe3ab`, raio 11px, padding `13px 15px`, texto `#8a6d12` 12,5px — "Demonstração: use o código **GESTOR2026**".

**Validação:** o código é normalizado (trim + maiúsculas) e comparado com `GESTOR2026`; se não bater, exibe "Código inválido. Use GESTOR2026 para a demonstração." e **não** avança. O nome é opcional (default "Ana Ribeiro") e alimenta o nome e a inicial do avatar na sidebar. `Enter` no campo de código submete. Em produção, substituir por autenticação real com papel/permissão de gestor.

---

## Aba 1: Regiões (mapa interativo)

**Propósito:** o gestor vê onde estão os líderes regionais em Goiânia, o alcance de cada base e quais bases precisam de atenção.

### Layout

1. **Cabeçalho** (linha, `space-between`, wrap): à esquerda H1 "Regiões de Goiânia" + subtítulo "Mapa interativo com a localização dos líderes regionais e o alcance de cada base"; à direita um chip de status — fundo `#143a1c`, raio 12px, padding `11px 16px`, com bolinha de 8px `#7fe0a0` pulsante, o rótulo "Dados sincronizados" e o valor "há 4 minutos".
2. **Grid de 4 KPIs** (gap 15px, cards com padding 19px): LÍDERES NO MAPA · ELEITORES MAPEADOS (valor em `#1f6b34`) · REGIÕES COBERTAS · BASES EM ALERTA (valor em `#c0392b`). **Todos derivados dos dados**, não fixos.
3. **Barra de filtros:** label "DESEMPENHO" seguido de quatro botões — Todos / Alto / Médio / Em alerta. Estilo: fundo branco, borda `#e0e0d9`, raio 9px, padding `8px 14px`, 12,5px peso 600, cor `#5c6657`; hover muda borda e texto para `#1f6b34`; **ativo: fundo e borda `#143a1c`, texto branco**.
4. **Grid de duas colunas** — `1fr 336px`, gap 18px, `align-items: start`:
   - **Esquerda:** card com o mapa (altura **540px**, cantos com overflow escondido) e, abaixo, uma faixa de legenda separada por borda superior, padding `13px 20px`: "LEGENDA" + três itens com bolinha de 11px (verde `#1f6b34` "Alto desempenho", âmbar `#d9a520` "Desempenho médio", vermelho `#c0392b` "Base em alerta") e, alinhado à direita, "O círculo representa o alcance estimado da base".
   - **Direita:** duas peças empilhadas (gap 14px):
     - **Card "LÍDER SELECIONADO"** — estado vazio com o texto "Clique em um marcador do mapa para ver o líder da região, sua base de eleitores e o histórico de atividade."
     - **Card "LÍDERES POR REGIÃO"** — lista com `max-height: 300px` e scroll.

### O mapa

- Centro inicial: **Goiânia, `[-16.6869, -49.2648]`, zoom 11**. Zoom por scroll e controles habilitados.
- Tiles do OpenStreetMap com a atribuição obrigatória "© OpenStreetMap contributors" (`maxZoom: 19`). Se o codebase usa outro provedor, respeitar a atribuição exigida por ele.
- Para **cada líder**, dois elementos:
  - **Círculo de alcance:** raio em metros = `400 + eleitores * 0.9`; cor conforme desempenho; `weight: 1.4`, `opacity: .55`, `fillOpacity: .13`.
  - **Pino personalizado:** tamanho = `30 + round(eleitores / 220)` px (pinos maiores = bases maiores). Forma de gota: `border-radius: 50% 50% 50% 4px` com `transform: rotate(-45deg)`, borda branca de 2,5px, sombra; dentro, a **inicial do nome** contra-rotacionada (`rotate(45deg)`) em Spectral 700, 12px, branco. Ancoragem na ponta inferior do pino.
- **Popup do pino:** largura mínima 190px — nome (Spectral 700, 16px), "bairro · região" (12px `#8a8b80`), total de eleitores (Spectral, 20px, na cor do desempenho) + a palavra "eleitores", e a linha de estrelas do rating. Wrapper com raio 13px.
- **Clique no pino** preenche o card "Líder selecionado".

### Card "Líder selecionado" (estado preenchido)

Avatar circular de 42px na cor do desempenho com a inicial (Spectral 700, 16px, branco); nome (Spectral 700, 17px) e "bairro · região"; um chip com o rótulo do desempenho (fundo = cor do desempenho com ~12% de opacidade, texto na cor cheia); grid 2×1 com dois blocos `#f7f7f3` raio 10px — **ELEITORES** (total formatado) e **NA SEMANA** (`+n`, em `#1f6b34`); a seção "RATING DE INDICAÇÕES" com as estrelas; e um botão primário de largura total "Abrir ficha do líder".

### Lista "Líderes por região"

Ordenada por eleitores (desc) e **respeitando o filtro de desempenho ativo**. Cada linha é clicável: bolinha de 9px na cor do desempenho, nome (13,5px peso 600) com o bairro abaixo (11,5px `#9aa397`), e à direita o total de eleitores em negrito na cor do desempenho. Borda inferior `#f0efe9`.

**Clicar em uma linha:** dá `setView` para as coordenadas do líder no **zoom 14** com animação, abre o popup dele e preenche o card de detalhe.

**Estado vazio (filtro sem resultados):** "Nenhum líder neste filtro." centralizado, 13px, `#9aa397`.

### Filtro de desempenho

Ao selecionar um valor, **pinos e círculos que não correspondem são removidos do mapa** (e readicionados quando voltam a corresponder), e a lista lateral é re-renderizada com o mesmo critério. `todos` mostra tudo.

### Dados dos líderes (15 registros, seed da demo)

Campos: `nome`, `regiao`, `bairro`, `lat`, `lng`, `eleitores`, `semana` (novos na semana), `perf` (`alto` | `medio` | `alerta`).

| Nome | Região | Bairro/Local | Lat | Lng | Eleitores | Semana | Perf |
|---|---|---|---|---|---|---|---|
| Ana Ribeiro | Região Central | Setor Central | -16.6799 | -49.2550 | 2140 | 86 | alto |
| Carlos Mendes | Região Sul | Setor Bueno | -16.7050 | -49.2790 | 1980 | 74 | alto |
| Júlia Faria | Região Sul | Setor Marista | -16.6960 | -49.2680 | 1410 | 39 | medio |
| Pedro Oliveira | Região Oeste | Setor Oeste | -16.6820 | -49.2720 | 1660 | 58 | alto |
| Sandra Lima | Região Oeste | Setor Campinas | -16.6700 | -49.2960 | 1230 | 31 | medio |
| Rafael Souza | Região Norte | Setor Norte Ferroviário | -16.6620 | -49.2560 | 980 | 12 | alerta |
| Marcos Antunes | Região Leste | Jardim Goiás | -16.7000 | -49.2380 | 1870 | 69 | alto |
| Luana Ferreira | Região Leste | Vila Nova | -16.6720 | -49.2380 | 1120 | 27 | medio |
| Roberto Dias | Região Sudoeste | Jardim América | -16.7080 | -49.3010 | 1540 | 44 | medio |
| Patrícia Gomes | Região Sul | Setor Pedro Ludovico | -16.7180 | -49.2600 | 1290 | 35 | medio |
| Eduardo Lima | Região Norte | Goiânia 2 | -16.6300 | -49.2900 | 760 | 8 | alerta |
| Carla Mendonça | Região Sudoeste | Vila Pedroso | -16.6600 | -49.2100 | 640 | 6 | alerta |
| Vitor Camargo | Aparecida de Goiânia | Centro | -16.8230 | -49.2440 | 2020 | 78 | alto |
| Helena Prado | Senador Canedo | Centro | -16.7080 | -49.0930 | 1180 | 29 | medio |
| Bruno Teixeira | Trindade | Centro | -16.6510 | -49.4890 | 1350 | 41 | medio |

Em produção estes registros vêm da API; as coordenadas devem ser geocodificadas a partir do endereço/base do líder.

---

## Aba 2: Rede de Indicações

**Propósito:** avaliar e comparar líderes pela quantidade de eleitores validados, com rating e ranking.

### Regra de rating (importante)

`rating = 1 + 4 × (validados - mínimo) / (máximo - mínimo)` — o líder com mais eleitores validados recebe 5,0, o último recebe 1,0 e os demais são interpolados. Empates recebem a mesma nota. Exibido com **uma casa decimal**.

**Componente de estrelas:** cinco ícones SVG de 14px em linha, gap 2px. Uma estrela é "cheia" quando `rating >= i - 0.25` (preenchimento e traço `#f3c41c`); vazia usa `fill: none` e traço `#cfd3ca`. À direita, o valor numérico em negrito, 12px, `#8a6d12`, com `margin-left: 5px`.

### Layout

1. **Cabeçalho:** H1 "Rede de Indicações" + subtítulo "Desempenho dos líderes pelos eleitores validados — atualizado diariamente". À direita, três botões de ordenação (mesmo estilo dos filtros): **Mais validados** (padrão) / **Melhor rating** / **Maior crescimento**.
2. **Grid de 4 KPIs** (derivados): ELEITORES VALIDADOS (soma, em `#1f6b34`) · MÉDIA VALIDADA POR LÍDER (soma ÷ nº de líderes, arredondada) · RATING MÉDIO DA REDE (média dos ratings, 1 decimal, em `#b8860b`) · NOVOS ESTA SEMANA (soma de `semana`, prefixado com `+`, em `#1f6b34`).
3. **Pódio** — grid de 3 colunas, gap 16px, com os três primeiros da ordenação vigente:
   - O **1º lugar é destacado**: fundo `#143a1c`, borda igual ao fundo, texto branco, com o brilho radial dourado no canto superior direito; número em `#f3c41c`.
   - 2º e 3º: card branco normal, número em `#1f6b34`.
   - Cada card: medalha circular de 46px com o texto "1º"/"2º"/"3º" (Spectral 700, 18px, texto `#143a1c`) — cores das medalhas: `#f3c41c`, `#c8cbd0`, `#cd9b62`; nome (Spectral 700, 17px) e bairro; o total de eleitores (Spectral, 32px) seguido de "eleitores · +N na semana"; e a linha de estrelas.
4. **Tabela "CLASSIFICAÇÃO COMPLETA DOS LÍDERES"** — grid de colunas `52px 1fr 132px 108px 92px`, gap 14px:
   - Cabeçalho: fundo `#f7f7f3`, borda inferior, texto 11px peso 700 `letter-spacing: .8px` cor `#9aa397` — `#` · LÍDER · RATING · ELEITORES (à direita) · SEMANA (à direita).
   - Linhas (padding `13px 20px`, divisor `#f0efe9`):
     - **Posição:** Spectral 700, 16px — `#b8860b` para os três primeiros, `#c2c8bf` para os demais.
     - **Líder:** avatar circular de 36px na cor do desempenho com a inicial + nome (14px peso 600) e "bairro · região" (11,5px `#9aa397`).
     - **Rating:** componente de estrelas.
     - **Validados:** total em negrito 14px, e **abaixo uma barra comparativa** de 5px de altura, trilha `#eef0ec`, raio 999px, preenchida em `(validados / maior valor da lista) * 100%` na cor do desempenho.
     - **Semana:** `+N` em negrito 13px, com cor por faixa da base demo — `>= 5` → `#1f6b34`; `2–4` → `#b8860b`; `< 2` → `#c0392b`.

### Ordenação

- `eleitores` (padrão): desc por eleitores validados.
- `rating`: desc por rating, com desempate por validados.
- `crescimento`: desc por `semana`.

Trocar a ordenação re-renderiza **pódio e tabela juntos** (o pódio sempre mostra o top 3 do critério vigente).

---

## Aba 3: Relatório Expresso (bot de WhatsApp)

**Propósito:** configurar o bot que envia no WhatsApp o consolidado dos líderes ao fim de cada dia — com frequência, horário, escopo, conteúdo e destinatários configuráveis — e ver **em tempo real** como a mensagem vai chegar.

### Layout

1. **Cabeçalho:** H1 "Relatório Expresso" ao lado de um chip **BOT ATIVO** (fundo `#e3f1e8`, texto `#1f6b34`, com bolinha pulsante de 7px). Subtítulo: "Um bot envia no WhatsApp o consolidado dos líderes ao fim de cada dia — e na frequência que você definir". À direita, um chip de conexão em **`#25d366`** com o ícone do WhatsApp: "Conectado / WhatsApp Business".
2. **Grid de 4 KPIs:** RELATÓRIOS ENVIADOS (`1.284`, em `#1f6b34`) · TAXA DE ENTREGA (`98,6%`) · PRÓXIMO ENVIO (espelha o horário configurado) · DESTINATÁRIOS (**calculado a partir da lista de destinatários** — ver abaixo).
3. **Grid de duas colunas** — `1fr 372px`, gap 18px, `align-items: start`.

### Coluna esquerda — configuração (três cards, gap 16px)

**Card "Frequência de envio"** (título Spectral 700 18px + apoio "Com que intervalo o bot dispara o consolidado dos líderes"):
- Quatro botões de opção (estilo de filtro, seleção única): **Diário (fim do dia)** (padrão) · A cada 12 horas · A cada 6 horas · Semanal.
- Abaixo, grid 2×1: **Horário do disparo** (`input type="time"`, valor inicial `21:00`) e **Escopo do relatório** (select com: "Todos os líderes de Goiânia", "Somente Região Central", "Somente bases em alerta", "Top 20 líderes").

**Card "O que entra no relatório"** (apoio: "Os blocos ativados aparecem na mensagem do WhatsApp") — lista de blocos com **toggle** cada:

| Bloco | Padrão |
|---|---|
| Resumo de eleitores indicados | ligado |
| Ranking dos 5 melhores líderes | ligado |
| Bases em alerta (queda de desempenho) | ligado |
| Demandas abertas no dia | ligado |
| Sentimento das redes (Rádio Peão IA) | desligado |
| Presença nas reuniões de conselho | desligado |

Cada linha: rótulo à esquerda (13,5px — `#243528` quando ligado, `#9aa397` quando desligado) + toggle à direita, com divisor `#f0efe9`.
**Toggle:** 44×26px, raio 999px, sem borda; knob branco de 20px em `top:3px; left:3px` com sombra; ligado → fundo `#1f6b34` e knob deslocado 18px; desligado → fundo `#d5d8d1`.

**Card "Destinatários"** — título + botão "Adicionar" (estilo de filtro, com ícone de `+`). Cada destinatário é uma linha com fundo `#f7f7f3`, raio 11px, padding `12px 14px`: avatar circular de 36px em `#25d366` com a inicial, nome (13,5px peso 600), "telefone · papel" (11,5px `#9aa397`) e um chip "ativo" (`#e3f1e8` / `#1f6b34`).

Destinatários seed — **cada um tem uma contagem de pessoas** (grupos contam mais de um):

| Nome | Telefone | Papel | Pessoas |
|---|---|---|---|
| Ana Ribeiro | (62) 9 9123-4567 | Coordenação geral | 1 |
| Carlos Mendes | (62) 9 9871-2210 | Coordenação Sul | 1 |
| Equipe Marketing | (62) 9 9440-1188 | Grupo — 6 membros | 6 |
| Coordenadores Regionais | (62) 9 9317-4402 | Grupo — 5 membros | 5 |
| Gabinete | (62) 9 9002-7755 | Chefia de gabinete | 1 |

**Regra:** o KPI "DESTINATÁRIOS" e o texto de confirmação do envio de teste devem ser **derivados da soma dessas contagens** (total 14) — nunca um número fixo, para não haver contradição visível entre o número exibido e a lista.

### Coluna direita — prévia e ações (gap 14px)

**Card de prévia:** cabeçalho com o label "PRÉVIA DA MENSAGEM" e, à direita, quando o envio ocorre ("hoje 21:00"; se a frequência for Semanal, "toda segunda 21:00"). O corpo simula o chat: fundo `#e6ddd4`, padding `18px 16px 22px`, altura mínima 430px.
- Cabeçalho do contato: círculo de 34px `#143a1c` com o emblema da logo, "Relatório Expresso" (13px peso 700) e "bot oficial · online" (11px `#6b7669`).
- **Bolha da mensagem:** fundo `#dcf8c6`, raio `12px 12px 12px 3px`, padding `13px 15px`, sombra leve, 13px, `line-height: 1.62`, preservando quebras de linha (`white-space: pre-line`).
- Abaixo, à direita, o horário com dois ticks: `21:00 ✓✓` (10,5px, `#7a8a7d`).

**Botão "Enviar teste agora":** largura total, fundo `#25d366`, texto branco, raio 12px, padding 15px, peso 700, com ícone de envio. Ao clicar, o rótulo muda para "Teste enviado aos 14 destinatários ✓" e **volta ao original após 2,4s**.

**Nota de confiança:** faixa `#eef4f0` com borda `#d8e6dd`, raio 12px, ícone de escudo em `#1f6b34`, texto `#3a5a45` 12,5px: "Envio por WhatsApp Business API com registro de entrega. Nenhum dado do eleitor sai da plataforma — o relatório traz apenas números consolidados."

### Conteúdo gerado da mensagem (formato WhatsApp)

A mensagem é remontada a cada mudança de frequência, horário ou toggle. Estrutura (usa `*negrito*` e `_itálico_` do WhatsApp):

```
*BEM PRO BRASIL — Relatório Expresso*
_<frequência> · <horário> · Goiânia_
────────────────

📈 *Eleitores indicados hoje:* <soma de "semana">
Base total: <soma de "eleitores"> eleitores

🏆 *Top líderes do dia*
1. <nome> — +<semana>
... (5 primeiros por crescimento)

⚠️ *Bases em alerta:* <contagem>
• <nome> (<bairro>) — +<semana>

📋 *Demandas abertas hoje:* 12
Críticas: 2 · Em andamento: 7

📡 *Rádio Peão IA:* 63% positivo (▲9 pts)

🤝 *Presença nos conselhos:* 82% dos líderes

────────────────
Painel completo: bempro.br/gestor
```

Cada bloco só aparece se o seu toggle estiver ligado; os cabeçalho, os separadores e o rodapé são sempre incluídos. Os números dos blocos "Demandas", "Rádio Peão IA" e "Presença" são estáticos na demo — devem vir da API em produção.

---

## Interactions & Behavior (resumo)

- **Navegação:** troca de aba sem recarregar; reset de scroll; recálculo do tamanho do mapa ao reentrar na aba Regiões.
- **Login:** validação do código, mensagem de erro inline, `Enter` submete, nome alimenta a sidebar; o mapa só é inicializado **após** o login (com ~60ms de atraso, pois o contêiner precisa existir e ter dimensões).
- **Mapa:** hover nos pinos com `title`; clique no pino abre popup e preenche o detalhe; clique na lista dá `flyTo`/`setView` zoom 14 + popup + detalhe; filtro adiciona/remove camadas.
- **Rede:** troca de ordenação re-renderiza pódio e tabela.
- **Relatório Expresso:** frequência, horário e toggles atualizam a prévia **em tempo real**; botão de teste com feedback temporário de 2,4s.
- **Estados vazios:** lista do mapa sem resultados exibe mensagem própria.
- **Formatação de números:** sempre `pt-BR` (separador de milhar por ponto); percentuais com vírgula decimal.
- **Responsividade:** o protótipo é desktop-first (painel de gestão). Os painéis do login rolam de forma independente para não cortar conteúdo em telas curtas. Ao portar, defina os breakpoints conforme o padrão do codebase — sugestão: abaixo de ~1100px, empilhar os grids de duas colunas (mapa acima do painel lateral; configuração acima da prévia) e reduzir os grids de 4 KPIs para 2 colunas.

## State Management

- `auth`: `{ autenticado, nomeDoGestor }` — controla login vs. app.
- `abaAtiva`: `'mapa' | 'rede' | 'expresso'`.
- `filtroDesempenho`: `'todos' | 'alto' | 'medio' | 'alerta'` — afeta camadas do mapa e a lista lateral.
- `liderSelecionado`: índice/id do líder — alimenta o card de detalhe.
- `ordenacaoRede`: `'eleitores' | 'rating' | 'crescimento'`.
- `frequencia`, `horario`, `escopo`: configuração do bot.
- `blocos`: array de `{ rótulo, ativo }` — dirige a montagem da mensagem.
- `feedbackTeste`: booleano temporário (2,4s) do botão de envio.
- Instância do mapa + coleções de marcadores e círculos mantidas fora do ciclo de render (ref/singleton), nunca recriadas a cada render.

### Dados esperados da API (produção)

- `GET /gestor/lideres` → `[{ id, nome, regiao, bairro, lat, lng, eleitores, novosNaSemana, desempenho }]`
- `GET /gestor/rede/resumo` → totais e média da rede (ou calcular no cliente a partir da lista).
- `GET /gestor/relatorio-expresso/config` e `PUT` da mesma → `{ frequencia, horario, escopo, blocos[], destinatarios[] }`
- `POST /gestor/relatorio-expresso/teste` → dispara o envio de teste.
- `GET /gestor/relatorio-expresso/previa` → opcionalmente renderizar a prévia no servidor, garantindo que a mensagem exibida seja idêntica à enviada.

O campo `desempenho` deve ser calculado no backend por uma regra explícita (ex.: crescimento na semana comparado à média da própria base) para que "alerta" seja auditável, e não uma classificação manual.

## Assets

- `logo-brasil-full.png` — logo completa (emblema + wordmark), fundo removido; usada no login.
- `logo-brasil-mark.png` — apenas o emblema; usada na sidebar e no avatar do bot na prévia.

Ambas foram derivadas do logo enviado pelo cliente, com o fundo branco removido. **Substituir pelos arquivos vetoriais oficiais (SVG) no codebase de destino** — o ideal é ter a marca em SVG para as versões clara e escura.

Ícones: todos são SVG inline de traço (`stroke-width` 2–2.4, `stroke-linecap`/`linejoin` "round"), no estilo Lucide/Feather. Use a biblioteca de ícones já adotada no codebase; o único ícone preenchido é o glifo do WhatsApp.

Fontes: Spectral e Public Sans (Google Fonts). No codebase, servir localmente ou pelo mecanismo de fontes já usado.

## Files

- `Bem pro Brasil - Gestores.html` — **o protótipo desta entrega**: as três abas + login, autocontido (Leaflet e fontes por CDN).
- `Bem pro Brasil - Web.dc.html` — app público (apoiador), versão web, incluído como referência do sistema visual e das telas vizinhas (Painel Central, Regiões, Enquetes, Relatórios, Tópicos com período de discussão, Rede de Indicação, Perfil, Rádio Peão IA).
- `Bem pro Brasil - Mobile.dc.html` — app público, versão mobile, referência do mesmo sistema em telas pequenas.
- `logo-brasil-full.png`, `logo-brasil-mark.png` — assets da marca.

Os dois arquivos `.dc.html` são protótipos que dependem de um runtime próprio do ambiente de design; leia-os como **referência de layout, copy e tokens**, não como código a portar. O arquivo `Gestores.html` é HTML/CSS/JS puro e pode ser lido diretamente.
