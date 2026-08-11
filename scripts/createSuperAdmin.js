// Cria (ou reaproveita) um usuário Auth e aplica a custom claim role=super_admin.
//
// Uso:
//   node scripts/createSuperAdmin.js <email> <senha>
//
// Requer o arquivo serviceAccountKey.json na raiz do projeto
// (Firebase Console > Project Settings > Service Accounts > Generate new private key).
// Esse arquivo já está no .gitignore — nunca commitar.

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
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

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Usuário já existe: ${user.uid}`);
  } catch {
    user = await auth.createUser({ email, password });
    console.log(`Usuário criado: ${user.uid}`);
  }

  await auth.setCustomUserClaims(user.uid, { role: "super_admin" });
  console.log(`Claim role=super_admin aplicada a ${email}.`);
  console.log("Se o usuário já estava logado em algum dispositivo, é preciso deslogar/logar de novo para o token atualizar.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
