import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";
import { app, db } from "./firebase";

// Cria um usuário Auth (email/senha) sem afetar a sessão logada no app,
// usando uma segunda instância do Firebase App só para esse propósito.
// Necessário porque createUserWithEmailAndPassword troca automaticamente
// o usuário atual da instância Auth usada — e aqui é o Super Admin/Gestor
// criando login para outra pessoa, não trocando a própria sessão.
async function createAuthUser(email, password) {
  const secondaryAppName = `provisioning-${Date.now()}`;
  const secondaryApp = initializeApp(app.options, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return credential.user.uid;
  } finally {
    await secondaryAuth.signOut().catch(() => {});
    await deleteApp(secondaryApp);
  }
}

// Grava o perfil em dois lugares: users/{uid} (espelho mínimo, usado pela
// sessão logada para saber o próprio papel) e campaigns/{campaignId}/members/{uid}
// (perfil completo, isolado por campanha — ver firestore.rules).
async function writeProfile(uid, { role, campaignId, ...profile }) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), { role, campaignId });
  batch.set(doc(db, `campaigns/${campaignId}/members`, uid), {
    role,
    campaignId,
    ...profile,
    createdAt: new Date().toISOString(),
  });
  await batch.commit();
}

export async function createManager({ email, password, name, whatsapp, campaignId }) {
  const uid = await createAuthUser(email, password);
  await writeProfile(uid, { role: "manager", campaignId, name, whatsapp, email });
  return uid;
}

export async function createLeader({
  email,
  password,
  name,
  whatsapp,
  campaignId,
  regiao,
  bairro,
  lat,
  lng,
  raioKm,
}) {
  const uid = await createAuthUser(email, password);
  await writeProfile(uid, {
    role: "leader",
    campaignId,
    name,
    whatsapp,
    email,
    regiao,
    bairro,
    lat,
    lng,
    raioKm,
    eleitores: 0,
    eleitoresValidados: 0,
    hoje: 0,
    semana: 0,
    perf: "alerta",
  });
  return uid;
}
