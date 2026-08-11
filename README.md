# Bem pro Goiás

Plataforma multi-campanha para acompanhamento de líderes regionais e cadastro de eleitores. Ver [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md) para a especificação completa.

Stack: React (Vite) + Firebase (Auth, Firestore, Storage). Disponível como Web/PWA e Capacitor
(Android) a partir do mesmo código-base; o empacotamento Electron (Windows) está planejado.

## Setup

```bash
npm install
cp .env.example .env   # preencher com as credenciais do Firebase (ver Firebase Console > Project Settings)
npm run dev
```

## Firebase

```bash
npx firebase login
npx firebase use bemprogoias-80ab1
```

- `firestore.rules` — Security Rules (isolamento por `campaignId` e papel: `super_admin` / `manager` / `leader`)
- `firestore.indexes.json` — índices para deduplicação de eleitores por RG/título
- Papéis atribuídos via documentos Firestore (`users/{uid}` + `campaigns/{campaignId}/members/{uid}`), não custom claims — ver [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md) para o desenho completo

## Testes

```bash
npm test              # roda tudo: testes de componente + Security Rules
npm run test:components   # só componentes React (Vitest + Testing Library, rápido, sem Firebase)
npm run test:rules         # só Security Rules (roda no Firestore Emulator local)
```

`test:rules` sobe o Firestore Emulator automaticamente e o derruba ao final — não precisa de projeto Firebase real nem de rede.

## Estrutura

```
src/
  services/firebase.js   # inicialização do app Firebase (Auth, Firestore com cache offline, Storage)
  contexts/AuthContext    # sessão + papel do usuário logado
  config/roles.js         # constantes de papéis
  components/             # componentes compartilhados (ex: ProtectedRoute)
  pages/
    auth/                 # login
    super-admin/           # painel do super admin (dono: Dev A)
    manager/                # painel do gestor (dono: Dev A)
    leader/                 # app de campo do líder (dono: Dev B)
```

O app do líder inclui CRUD/deduplicação de eleitores, três modos de localização, operação offline, WhatsApp, PWA/APK e compartilhamento voluntário da posição em tempo real enquanto o app está aberto. Ver [`docs/DEV_B_HANDOFF.md`](./docs/DEV_B_HANDOFF.md).

## Times

- **Dev A — Administração & Identidade:** Super Admin, gestão de líderes, Auth/papéis/Security Rules, mapa do gestor, Electron, auto-update.
- **Dev B — Campo & Eleitores:** app do líder, CRUD de eleitores + dedup, localização (3 modos), offline-first, WhatsApp, Capacitor (APK) e PWA (iOS).

## Onboarding de um novo colaborador

Checklist para quem está entrando no projeto agora (ex: Dev B):

1. **Acesso ao GitHub** — pedir para ser adicionado como colaborador em `github.com/Willientropia/Bemprogoias` (Settings → Collaborators).
2. **Clonar e instalar:**
   ```bash
   git clone https://github.com/Willientropia/Bemprogoias
   cd Bemprogoias
   npm install
   ```
3. **Credenciais do Firebase** — o `.env` **não vem pelo git** (contém a API key). Copiar o template...
   ```bash
   cp .env.example .env
   ```
   ...e preencher com os valores enviados por fora do git (Slack/WhatsApp) por quem já tem o projeto Firebase configurado. Os valores ficam em Firebase Console → ⚙️ Project Settings → Your apps → SDK setup and configuration.
4. **Acesso ao Firebase Console** — pedir para ser adicionado em Firebase Console → ⚙️ Project Settings → **Users and permissions** → Add member, com papel Editor (necessário para rodar `firebase deploy` e ver Firestore/Auth).
5. **Rodar localmente:**
   ```bash
   npm run dev
   ```
6. **Ler antes de codar:** [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md) (como o sistema funciona hoje), [`PROGRESS.md`](./PROGRESS.md) (o que já está pronto e o que falta) e [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md) seção 4 (divisão de trabalho e o que é dono de quem).
7. **Rodar os testes** (`npm test`) para confirmar que o ambiente está funcionando antes de começar a mexer em código.
