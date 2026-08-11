// Cria (ou reaproveita) um usuário Auth e grava o perfil users/{uid}
// com role=super_admin no Firestore.
//
// Uso:
//   node scripts/createSuperAdmin.js <email> <senha>
//
// Requer o arquivo serviceAccountKey.json na raiz do projeto
// (Firebase Console > Project Settings > Service Accounts > Generate new private key).
// Esse arquivo já está no .gitignore — nunca commitar.

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: node scripts/createSuperAdmin.js <email> <senha>");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Usuário já existe: ${user.uid}`);
  } catch {
    user = await auth.createUser({ email, password });
    console.log(`Usuário criado: ${user.uid}`);
  }

  await db.collection("users").doc(user.uid).set(
    { role: "super_admin", email, createdAt: new Date().toISOString() },
    { merge: true }
  );
  console.log(`Perfil users/${user.uid} gravado com role=super_admin.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
