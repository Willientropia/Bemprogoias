# Bem para Goiás — App de Acompanhamento de Líderes Regionais em Campanha

**Documento de especificação + prompt de desenvolvimento**
**Versão:** 1.0
**Stack:** React + Firebase | APK Android (Capacitor) | PWA iOS | Electron (Windows)

---

## 1. Resumo do produto

O **Bem para Goiás** é uma plataforma multi-campanha para acompanhamento de líderes regionais e cadastro de eleitores durante campanhas eleitorais. Cada campanha é isolada das demais (dados, usuários e permissões separados), funcionando como "vários apps em um só" sob um mesmo código-base.

A plataforma tem **três perfis de acesso**, em hierarquia:

1. **Super Admin (Desenvolvedor):** você. Cadastra e administra campanhas inteiras, cria os gestores de cada campanha e tem visão global sobre todas as campanhas. Acessa via Electron (Windows) e Web.
2. **Gestor de Campanha (Regional):** cadastra e gerencia os líderes da sua campanha, visualiza no mapa as áreas de influência de cada líder e acompanha os eleitores cadastrados. Acessa via Electron (Windows) e Web.
3. **Líder:** cadastra os eleitores com quem teve contato. Vê **somente os próprios eleitores**. Acessa via App (APK Android e PWA iOS) — não usa Electron.

O eixo do produto é: o gestor cadastra líderes com uma **região de atuação e raio de influência (km)**; o líder sai a campo e cadastra eleitores (com localização), inclusive **offline**; o gestor acompanha tudo por um **mapa** com as áreas de influência plotadas.

---

## 2. Regras de negócio essenciais

### 2.1 Multi-campanha (isolamento)
- Todo dado pertence a uma `campaignId`.
- Um gestor só enxerga dados da própria campanha. Um líder só enxerga a própria campanha e os próprios eleitores.
- O Super Admin transita entre campanhas.

### 2.2 Cadastro de Líder (feito pelo Gestor)
Campos do líder:
- Usuário (login)
- Senha
- Número de WhatsApp
- Nome completo
- Região de atuação
- Raio de influência (km)

A **região + raio** servem **apenas para visualização no mapa** (círculo de influência plotado para o gestor). **Não** há geofencing, validação de distância nem alerta quando um eleitor cai fora do raio — é puramente ilustrativo no mapa.

### 2.3 Cadastro de Eleitor (feito pelo Líder)
Campos do eleitor:
- Número de título — **opcional**
- Zona e Seção (de votação)
- Número de WhatsApp
- Nome da pessoa
- Localização
- RG

**Deduplicação:** ao cadastrar, se o **RG** ou o **Número de Título** já existirem, o líder deve ser **informado que o eleitor já existe** (aviso claro, bloqueando ou confirmando a ação). A checagem de duplicidade deve considerar o escopo definido pelo gestor (recomendado: dentro da mesma campanha).

### 2.4 Localização do eleitor — três modos
O cadastro de localização deve aceitar **os três**:
1. **GPS do celular** no momento do cadastro (captura automática da posição).
2. **Digitação manual** (endereço).
3. **Pin no mapa** (usuário arrasta/toca para marcar).

> **Permissões nativas:** a captura por GPS depende de autorização de localização do Android/iOS. **Implementar o fluxo de solicitação de permissão** (request + tratamento de negação/uso apenas em foreground) **desde o início**, para evitar retrabalho. O mesmo vale para qualquer permissão nativa necessária (ex.: localização em background, se aplicável).

### 2.5 WhatsApp
- O número de WhatsApp é um campo de contato **e** deve permitir **abrir a conversa via link** (`https://wa.me/<numero>`).
- Estruturar essa parte de forma modular, pois **futuramente** haverá outra função de mensageria integrada.

### 2.6 Auto-atualização (OTA via GitHub)
O app deve conseguir **se atualizar sozinho**:
- Buscar a **release mais recente via GitHub** (GitHub Releases API) e atualizar o app diretamente do próprio dispositivo.
- Firebase serve como gatilho/controle (ex.: sinalizar versão mínima obrigatória, forçar atualização).
- No **Android (APK)**: baixar o APK da release e disparar a instalação (requer permissão de "instalar apps de fontes desconhecidas" — implementar o fluxo).
- No **Electron (Windows)**: usar mecanismo de auto-update apontando para as releases do GitHub.
- No **PWA (iOS)**: atualização via service worker (novo build publicado → atualização do cache/assets), já que iOS não permite instalar binário fora da App Store.

### 2.7 Offline-first
- O **líder** precisa cadastrar eleitores **em campo, sem sinal**.
- Habilitar **persistência offline do Firestore** com **sincronização automática** ao reconectar.
- Deve funcionar no **PWA** e no **APK**.
- Tratar conflitos e o caso de deduplicação quando o cadastro foi feito offline (a checagem de RG/Título pode só ser confirmada no sync — avisar o líder nesse momento se houver duplicidade).

---

## 3. Arquitetura e plataformas

| Alvo | Tecnologia | Quem usa |
|---|---|---|
| **Base do app** | React (JS), responsivo | — |
| **Backend / DB** | Firebase (Firestore, Auth, Storage) | — |
| **APK Android** | React empacotado com **Capacitor** (mesmo código web) | Líder |
| **PWA iOS** | Mesmo código React servido como **PWA** | Líder |
| **App Web** | React responsivo (mesmo código) | Gestor / Super Admin |
| **WEBAPP desktop** | **Electron** (Windows) | Gestor / Super Admin (e Dev) |

**Princípio:** **um único código-base React**. Android via Capacitor, iOS via PWA, desktop via Electron. Evitar forks de código por plataforma — usar detecção de plataforma e camadas de abstração para o que é nativo (GPS, instalação de APK, auto-update).

### 3.1 Firebase — modelagem sugerida
```
campaigns/{campaignId}
  ├─ name, createdAt, minAppVersion, ...
  ├─ managers/{managerId}      # gestores da campanha
  ├─ leaders/{leaderId}        # login, senha(hash/Auth), whatsapp,
  │                            # nomeCompleto, regiao, raioKm, geo(lat/lng)
  └─ voters/{voterId}          # titulo(opc), zona, secao, whatsapp,
                               # nome, localizacao(lat/lng/endereco/modo), rg,
                               # leaderId (dono), createdAt, syncStatus
```
- **Auth:** Firebase Authentication. Papéis (super_admin / manager / leader) via **custom claims** + `campaignId`.
- **Security Rules:** leitura/escrita restrita por papel e por campanha. Líder só lê/escreve os próprios `voters`. Gestor lê `leaders` e `voters` da sua campanha. Super Admin tudo.
- **Índices:** por `rg` e `titulo` (deduplicação), por `leaderId`, por `campaignId`.

### 3.2 Mapa
- Plotar, para o gestor, cada líder como um **marcador** + **círculo de raio (km)** centrado na região dele.
- Plotar eleitores como pontos (apenas para gestor/super admin).
- Biblioteca de mapa a definir (ex.: Leaflet/Mapbox/Google Maps) — escolher uma que funcione bem em web, Capacitor e Electron.

### 3.3 Responsividade
- Layout responsivo obrigatório (mobile-first para o app do líder; desktop para o painel do gestor/Electron).

---

## 4. Divisão do trabalho para 2 pessoas (por domínio — menor conflito)

A divisão é **por domínio/feature**, com fronteiras claras para minimizar conflitos de merge. Cada dev é dono de módulos independentes; o contrato entre eles é o **modelo de dados do Firestore** e a **camada de serviços compartilhada**.

### Trilha compartilhada (definir juntos primeiro — 1 a 2 dias)
Antes de paralelizar, ambos acordam:
- Estrutura das coleções Firestore e nomes de campos (seção 3.1).
- Camada de serviços/SDK (`/services/firebase.js`, tipos de dados).
- Sistema de papéis (custom claims) e Security Rules base.
- Design system / tokens de UI (cores, componentes base) e roteamento.
- Configuração do projeto React + Capacitor + Electron (esqueleto de build).

### Dev A — "Administração & Identidade"
Dono de tudo que é **acima do líder**: campanhas, gestão e infraestrutura de plataforma.
- **Super Admin:** CRUD de campanhas, criação de gestores, visão global multi-campanha.
- **Gestor:** CRUD de líderes (usuário, senha, WhatsApp, nome, região, raio).
- **Autenticação e papéis:** Firebase Auth, custom claims, Security Rules, isolamento por campanha.
- **Mapa do gestor:** plotagem dos líderes + círculos de raio de influência.
- **Empacotamento desktop:** app **Electron** (Windows) para gestor/dev.
- **Auto-update / OTA:** integração com GitHub Releases (Electron auto-update + versão mínima via Firebase).

### Dev B — "Campo & Eleitores"
Dono de tudo que o **líder** faz no app.
- **App do líder:** login, navegação, UI mobile.
- **CRUD de eleitores:** formulário completo (título opcional, zona/seção, WhatsApp, nome, localização, RG).
- **Deduplicação:** checagem de RG/Título e aviso "eleitor já existe".
- **Localização (3 modos):** GPS + permissões nativas, digitação manual, pin no mapa.
- **Offline-first:** persistência do Firestore, fila de sync, tratamento de conflito/dedup no reconecte.
- **WhatsApp:** abertura de conversa via `wa.me` (modular para expansão futura).
- **Empacotamento mobile:** **Capacitor (APK Android)** + **PWA iOS** (service worker, instalação, permissões).

### Pontos de integração (contratos entre A e B)
- Modelo de dados Firestore = fonte única da verdade.
- Auto-update: A entrega o mecanismo desktop; B replica a lógica de update mobile (APK/PWA) reusando o controle de versão de A no Firebase.
- Mapa: A é dono do mapa do gestor; B reusa o componente de mapa para o "pin no mapa" do eleitor.

---

## 5. Identidade visual (referência do material enviado)

Reaproveitar a linguagem visual do branding existente ("Universe Deep Space"):

| Token | Cor |
|---|---|
| Background | `#000000` (preto absoluto) |
| Primary | `#fff6df` (dourado claro) |
| Secondary | `#00e3fd` (turquesa/ciano) |
| Tertiary | `#0055ff` (azul estelar) |
| Accent | `#FF0000` (vermelho) |

- Fundo preto com **2 gradientes radiais** sobrepostos (azul + ciano).
- Tipografia: `Space Grotesk` / `Inter`.
- Adaptar para uso de campo (líder): priorizar **legibilidade e formulários rápidos** sobre efeitos visuais pesados; manter estética no painel do gestor.

---

## 6. Prompt de desenvolvimento (pronto para uso)

> **Contexto:** Construa o "Bem para Goiás", uma plataforma multi-campanha para acompanhamento de líderes regionais e cadastro de eleitores em campanhas eleitorais, a partir de um único código-base React (JS), com backend Firebase.
>
> **Plataformas (mesmo código-base):**
> - APK Android via **Capacitor**;
> - **PWA** para iOS (service worker, instalável, offline);
> - **App Web** responsivo;
> - **WEBAPP desktop em Electron** (Windows), exclusivo para gestores e dev.
>
> **Perfis (hierarquia, isolados por campanha):**
> 1. **Super Admin (dev):** cria campanhas e gestores; visão global; usa Electron/Web.
> 2. **Gestor:** cria e gerencia líderes; vê o mapa com áreas de influência; usa Electron/Web.
> 3. **Líder:** cadastra eleitores; vê só os próprios; usa APK/PWA.
>
> **Líder (cadastrado pelo gestor):** usuário, senha, WhatsApp, nome completo, região de atuação, raio de influência (km). O raio serve **apenas** para desenhar a área de influência no mapa do gestor — sem geofencing.
>
> **Eleitor (cadastrado pelo líder):** número de título (opcional), zona e seção, WhatsApp, nome, localização, RG. Se RG ou título já existirem, **avisar que o eleitor já existe**. Localização deve aceitar **três modos**: GPS do dispositivo, endereço digitado e pin no mapa — **implementar solicitação de permissão de localização nativa (Android/iOS)** desde já para evitar retrabalho.
>
> **WhatsApp:** abrir conversa via link `wa.me`; deixar modular para futura mensageria.
>
> **Firebase:** Firestore (multi-campanha, dados por `campaignId`), Auth com papéis por custom claims, Security Rules isolando por papel/campanha, índices para dedup por RG/título.
>
> **Offline-first:** persistência do Firestore com sync automático no reconecte, funcionando em PWA e APK; tratar dedup no momento do sync.
>
> **Auto-atualização (OTA):** buscar a release mais recente via **GitHub Releases**; Firebase controla versão mínima/força de atualização. Android baixa e instala o APK (com permissão de fontes desconhecidas); Electron usa auto-update; PWA atualiza via service worker.
>
> **UI:** responsiva, mobile-first para o líder e desktop para o gestor; identidade "Universe Deep Space" (preto `#000000`, dourado `#fff6df`, ciano `#00e3fd`, azul `#0055ff`, vermelho `#FF0000`; fontes Space Grotesk/Inter; 2 gradientes radiais).
>
> **Organização do time (2 devs, por domínio):**
> - **Dev A — Administração & Identidade:** Super Admin, gestão de líderes, Auth/papéis/Security Rules, mapa do gestor, Electron, auto-update.
> - **Dev B — Campo & Eleitores:** app do líder, CRUD de eleitores + dedup, localização (3 modos + permissões), offline-first + sync, WhatsApp, Capacitor (APK) e PWA (iOS).
> - **Contrato compartilhado:** modelo de dados Firestore + camada de serviços; definir antes de paralelizar.
>
> Entregue o esqueleto do projeto, o modelo de dados do Firestore, as Security Rules base, a camada de serviços compartilhada e a configuração de build (React + Capacitor + Electron + PWA), e então implemente os módulos das duas trilhas em paralelo.

---

## 7. Checklist de permissões e requisitos nativos (não esquecer)
- [ ] Permissão de **localização** (Android/iOS) — request + tratamento de negação.
- [ ] Permissão de **instalar apps de fontes desconhecidas** (Android) para o OTA do APK.
- [ ] **Service worker** configurado (PWA offline + update no iOS).
- [ ] **Persistência offline** do Firestore ativada e testada sem sinal.
- [ ] **Deep link** `wa.me` funcionando nas três plataformas.
- [ ] **Auto-update** validado em Electron e Android.
