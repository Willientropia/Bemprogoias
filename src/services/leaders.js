import { collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeToLeaders(campaignId, onChange) {
  const q = query(
    collection(db, `campaigns/${campaignId}/members`),
    where("role", "==", "leader")
  );
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function updateLeader(campaignId, uid, { name, whatsapp, regiao, raioKm }) {
  return updateDoc(doc(db, `campaigns/${campaignId}/members`, uid), {
    name,
    whatsapp,
    regiao,
    raioKm,
  });
}

// Remove o perfil do líder (members/{uid} + o espelho users/{uid}). O login
// no Firebase Auth continua existindo — removê-lo exigiria Admin SDK, fora
// do alcance do client. Sem papel/perfil, o usuário não consegue mais
// acessar nada no app mesmo que ainda faça login.
export function deleteLeader(campaignId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, `campaigns/${campaignId}/members`, uid));
  batch.delete(doc(db, "users", uid));
  return batch.commit();
}
