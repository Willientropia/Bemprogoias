# Progresso — Dev A (Administração & Identidade)

Acompanhamento do que já foi feito e do que falta, para a trilha do Dev A
(ver divisão de trabalho no [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md), seção 4).
Atualizar este arquivo à medida que cada item avançar.

## Feito

- [x] Projeto **Vite + React** criado e conectado ao repo (`github.com/Willientropia/Bemprogoias`)
- [x] **Firebase criado** — projeto `bemprogoias-80ab1` (Auth + Firestore + Storage)
- [x] Authentication habilitado (Email/Password)
- [x] Firestore criado (modo produção, region `southamerica-east1` ou a escolhida)
- [x] `src/services/firebase.js` — inicialização do app, Firestore com **cache offline persistente** habilitado
- [x] `.env` / `.env.example` configurados (credenciais fora do git)
- [x] `firestore.rules` — isolamento por `campaignId` e papel (`super_admin` / `manager` / `leader`)
- [x] `firestore.indexes.json` — índice composto `leaderId` + `createdAt` (rules e indexes já com **deploy feito** no projeto)
- [x] `src/contexts/AuthContext.jsx` — sessão + leitura de `role`/`campaignId` via custom claims
- [x] `src/components/ProtectedRoute.jsx` — bloqueio de rota por papel
- [x] Rotas base (`/login`, `/super-admin`, `/manager`) com redirecionamento por papel
- [x] Páginas placeholder: `LoginPage`, `SuperAdminDashboard`, `ManagerDashboard`
- [x] Commit inicial + push para `main`
- [x] `scripts/createSuperAdmin.js` — bootstrap do usuário super admin via Admin SDK
- [x] Primeiro super admin criado (`willie.engenharia@gmail.com`) e validado no login
- [x] **CRUD de Campanhas completo** (`src/services/campaigns.js`, `CampaignForm.jsx`, listagem no `SuperAdminDashboard`) — criar, editar, excluir testado no navegador
- [x] `TopBar` compartilhado com botão de logout (usado em Super Admin e Gestor)
- [x] `docs/design-reference/` — mockups visuais de referência (gerados via Claude) para a identidade "Universe Deep Space"

## Próximos passos (em ordem sugerida)

### 1. CRUD de Gestores (Super Admin cria, dentro de uma campanha)
- [ ] Formulário de criação de gestor (email/senha inicial)
- [ ] Cloud Function ou script para criar o usuário Auth + custom claim `role: "manager"` + `campaignId`
- [ ] Listagem de gestores por campanha

### 2. CRUD de Líderes (Gestor)
- [ ] Formulário: usuário/login, senha, WhatsApp, nome completo, região de atuação, raio de influência (km)
- [ ] Criação do usuário Auth do líder + custom claim `role: "leader"` + `campaignId` (via Cloud Function, já que o gestor não deve ter permissão admin direta no client)
- [ ] Listagem/edição/remoção de líderes da própria campanha

### 3. Mapa do Gestor
- [ ] Escolher biblioteca de mapa (Leaflet é o candidato mais leve/gratuito para web+Electron+Capacitor)
- [ ] Plotar cada líder como marcador + círculo de raio (km) centrado na região
- [ ] Plotar eleitores como pontos (somente leitura, dado do Dev B)

### 4. Empacotamento Electron (Windows)
- [ ] Configurar Electron apontando para o build do Vite
- [ ] Restringir o shell Electron a rotas de `super_admin`/`manager` (líder não usa desktop)

### 5. Auto-update / OTA
- [ ] Integração com GitHub Releases API
- [ ] Electron auto-update (ex: `electron-updater`)
- [ ] Campo `minAppVersion` em `campaigns/{campaignId}` no Firebase para forçar atualização

## Notas / decisões tomadas

- **Índices de campo único não vão no `firestore.indexes.json`** — Firestore já cria automaticamente para `rg` e `titulo` isolados. Só índices compostos precisam ser declarados (ex: `leaderId` + `createdAt`). Erro visto: `this index is not necessary, configure using single field index controls`.
- Custom claims (`role`, `campaignId`) só podem ser setadas via **Admin SDK** (backend/script), nunca do client — vai exigir Cloud Functions ou scripts administrativos para os fluxos de criação de gestor/líder.
- **`getIdTokenResult()` sem `forceRefresh` pode retornar claims desatualizadas** mesmo após logout/login — o SDK reaproveita o token em cache se ainda não expirou. `AuthContext.jsx` usa `getIdTokenResult(true)` para sempre forçar um token novo do servidor. Causou `permission-denied` nas primeiras tentativas de CRUD mesmo com a claim já setada no Firebase.
- **Exclusão de campanha não faz cascade delete** — apagar uma campanha hoje não remove `managers`/`leaders`/`voters` associados (ficam órfãos). Resolver quando implementar Cloud Functions administrativas.
- CSS/identidade visual "Universe Deep Space" (seção 5 do spec) ainda não aplicado ao código — há mockups de referência em `docs/design-reference/`, mas as páginas atuais são só estrutura funcional.

## Contrato com o Dev B

- Modelo de dados Firestore (`campaigns/{campaignId}/leaders`, `.../voters`) é fonte única da verdade — qualquer mudança de schema avisar o outro dev.
- Dev A entrega o mecanismo de auto-update desktop (Electron); Dev B replica a lógica para APK/PWA reusando o campo `minAppVersion`.
- Dev A é dono do componente de mapa (gestor); Dev B reusa esse componente para o modo "pin no mapa" do cadastro de eleitor.
