import { collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeToManagers(campaignId, onChange) {
  const q = query(
    collection(db, `campaigns/${campaignId}/members`),
    where("role", "==", "manager")
  );
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function updateManager(campaignId, uid, { name, whatsapp }) {
  return updateDoc(doc(db, `campaigns/${campaignId}/members`, uid), { name, whatsapp });
}

// Remove o perfil do gestor (members/{uid} + o espelho users/{uid}). O login
// no Firebase Auth continua existindo — removê-lo exigiria Admin SDK. Sem
// papel/perfil, o usuário não consegue mais acessar nada no app.
export function deleteManager(campaignId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, `campaigns/${campaignId}/members`, uid));
  batch.delete(doc(db, "users", uid));
  return batch.commit();
}
