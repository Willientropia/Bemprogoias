# Progresso — Dev A (Administração & Identidade)

Acompanhamento do que já foi feito e do que falta, para a trilha do Dev A
(ver divisão de trabalho no [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md), seção 4).
Para uma descrição de como o sistema funciona **hoje** (sem histórico), ver [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md).
Atualizar este arquivo à medida que cada item avançar.

## Feito

- [x] Projeto **Vite + React** criado e conectado ao repo (`github.com/Willientropia/Bemprogoias`)
- [x] **Firebase criado** — projeto `bemprogoias-80ab1` (Auth + Firestore), plano gratuito (Spark)
- [x] Authentication habilitado (Email/Password)
- [x] Firestore criado (modo produção)
- [x] `src/services/firebase.js` — inicialização do app, Firestore com **cache offline persistente** habilitado
- [x] `.env` / `.env.example` configurados (credenciais fora do git)
- [x] Rotas base (`/login`, `/super-admin`, `/manager`) com redirecionamento por papel, `ProtectedRoute`
- [x] `scripts/createSuperAdmin.js` — bootstrap do primeiro usuário super admin
- [x] **Modelo de papéis via Firestore** (`users/{uid}` + `campaigns/{campaignId}/members/{uid}`) —
  sem custom claims, sem Cloud Functions, funciona no plano gratuito. Ver `ESTADO_ATUAL.md` para o
  desenho completo.
- [x] **Security Rules validadas com testes automatizados** (`tests/firestore.rules.test.js`,
  rodando no Firestore Emulator via `npm run test:rules`) — cobrem isolamento entre campanhas,
  inclusive um vazamento real que os testes pegaram e foi corrigido (ver Notas).
- [x] **CRUD de Campanhas completo** (criar, editar, excluir) — Super Admin
- [x] **CRUD de Gestores completo** (criar, editar, remover) — Super Admin, dentro de cada campanha
- [x] **CRUD de Líderes completo** (criar, editar, remover) — Gestor, dentro da própria campanha
- [x] `TopBar` compartilhado com botão de logout
- [x] `docs/design-reference/` — mockups visuais de referência (gerados via Claude) para a
  identidade "Universe Deep Space"
- [x] **Suite de testes automatizados unificada** (`npm test`) — testes de componente (Vitest +
  Testing Library, `tests/component/`) cobrindo `ProtectedRoute`, `CampaignForm`,
  `ManagerListItem`; mais os testes de Security Rules já existentes. Roda tudo com um comando só,
  sem precisar abrir o app manualmente para validar mudanças — ver seção "Testes" no `README.md`.

## Próximos passos (em ordem sugerida)

### 1. Mapa do Gestor
- [ ] Escolher biblioteca de mapa (Leaflet é o candidato mais leve/gratuito para web+Electron+Capacitor)
- [ ] Plotar cada líder como marcador + círculo de raio (km) centrado na região (`regiao`/`raioKm`
  já existem no perfil do líder)
- [ ] Plotar eleitores como pontos (somente leitura, dado do Dev B)

### 2. Empacotamento Electron (Windows)
- [ ] Configurar Electron apontando para o build do Vite
- [ ] Restringir o shell Electron a rotas de `super_admin`/`manager` (líder não usa desktop)

### 3. Auto-update / OTA
- [ ] Integração com GitHub Releases API
- [ ] Electron auto-update (ex: `electron-updater`)
- [ ] Campo `minAppVersion` em `campaigns/{campaignId}` no Firebase para forçar atualização

## Notas / decisões tomadas

- **Papéis via Firestore, não custom claims.** Decisão explícita para não depender do plano
  Blaze (pago) do Firebase — custom claims exigiriam Cloud Functions/Admin SDK para todo fluxo de
  criação de usuário. Trade-off aceito: migrar para custom claims é um passo futuro possível
  quando o projeto for para produção/plano pago, mas não é urgente.
- **Nunca modele papéis como uma coleção plana `users` consultável por query sem isolamento
  estrutural.** Uma primeira versão desse modelo guardava o perfil completo (nome, whatsapp,
  região, raio) em `users/{uid}` na raiz, e um gestor conseguia, via query
  (`where campaignId == X`), *em teoria* ficar restrito — mas o teste automatizado provou que
  `allow list` no Firestore não re-filtra por campo por documento do jeito esperado, e um gestor
  da campanha A conseguia ler líderes da campanha B. Corrigido movendo os perfis completos para
  `campaigns/{campaignId}/members/{uid}`, onde o isolamento vem do próprio path. `users/{uid}`
  hoje guarda só um espelho mínimo (`role`, `campaignId`), sempre acessado por `get()` de doc
  único, nunca por `list`. **Lição:** qualquer regra nova que envolva `list`/query deve vir
  acompanhada de um teste automatizado antes do deploy — não confiar em raciocínio manual sobre
  Security Rules.
- **Índices de campo único não vão no `firestore.indexes.json`** — Firestore já cria
  automaticamente para campos isolados. Só índices compostos precisam ser declarados.
- **Exclusão de campanha não faz cascade delete** — apagar uma campanha hoje não remove
  `members`/`voters` associados (ficam órfãos). Resolver mais adiante.
- **Remover gestor/líder não apaga o login no Firebase Auth**, só os documentos de perfil
  (`members/{uid}` + `users/{uid}`). Apagar o login exigiria Admin SDK, fora do alcance do client.
  Na prática não é um problema de segurança — sem perfil, a pessoa consegue logar mas não acessa
  nada (nenhuma rota nem dado libera sem `role`/`campaignId`) — só deixa um usuário "morto" na
  lista do Firebase Auth. Se isso incomodar, dá pra limpar manualmente pelo Console ou por outro
  script tipo `createSuperAdmin.js`.
- Testes de rules cobrem hoje: leitura/listagem isolada por campanha, criação/edição restrita por
  papel, e remoção (`delete`) de `members`/`users` restrita a quem deveria (super_admin sempre;
  gestor só remove líderes da própria campanha).
- **Dois configs de Vitest** (`vitest.config.js` para componentes/jsdom,
  `vitest.rules.config.js` para rules/emulador) porque não dá para compartilhar um único
  `include`/`environment` — os testes de rules precisam do Firestore Emulator (via
  `firebase emulators:exec`) e ambiente Node puro, os de componente precisam de jsdom e não devem
  rodar o emulador. `npm test` roda os dois em sequência.
- Testes de componente **mockam os `services/*.js`** (nunca falam com o Firebase de verdade) —
  são rápidos (~2s) e não exigem rede nem emulador. Cobrem lógica/UI, não pegam bugs visuais/CSS.
- CSS/identidade visual "Universe Deep Space" (seção 5 do spec) ainda não aplicado ao código — há
  mockups de referência em `docs/design-reference/`, mas as páginas atuais são só estrutura
  funcional.

## Contrato com o Dev B

- Modelo de dados Firestore é fonte única da verdade — ver `ESTADO_ATUAL.md` para o schema
  completo. Qualquer mudança avisar o outro dev.
- Perfis de usuário (inclusive líder: nome, whatsapp, região, raio) vivem em
  `campaigns/{campaignId}/members/{uid}` — o Dev B deve ler daqui, não de `users/{uid}` (que é só
  o espelho mínimo de sessão).
- Dev A entrega o mecanismo de auto-update desktop (Electron); Dev B replica a lógica para
  APK/PWA reusando o campo `minAppVersion`.
- Dev A é dono do componente de mapa (gestor); Dev B reusa esse componente para o modo "pin no
  mapa" do cadastro de eleitor.
