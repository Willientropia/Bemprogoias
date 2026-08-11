import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { collection, doc, getDocs, getDoc, query, where, setDoc } from "firebase/firestore";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, "users", "admin-uid"), { role: "super_admin" });
    await setDoc(doc(db, "users", "manager-a-uid"), { role: "manager", campaignId: "campA" });
    await setDoc(doc(db, "users", "manager-b-uid"), { role: "manager", campaignId: "campB" });
    await setDoc(doc(db, "users", "leader-a-uid"), { role: "leader", campaignId: "campA" });

    await setDoc(doc(db, "campaigns", "campA"), { name: "Campanha A" });
    await setDoc(doc(db, "campaigns", "campB"), { name: "Campanha B" });

    await setDoc(doc(db, "campaigns/campA/members", "manager-a-uid"), { role: "manager" });
    await setDoc(doc(db, "campaigns/campB/members", "manager-b-uid"), { role: "manager" });
    await setDoc(doc(db, "campaigns/campA/members", "leader-a-uid"), {
      role: "leader",
      name: "Líder A",
    });
    await setDoc(doc(db, "campaigns/campB/members", "leader-b-uid"), {
      role: "leader",
      name: "Líder B",
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("gestor consultando líderes da própria campanha (campaigns/{id}/members)", () => {
  it("lista os líderes da própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    const q = query(
      collection(managerA, "campaigns/campA/members"),
      where("role", "==", "leader")
    );
    const snapshot = await assertSucceeds(getDocs(q));
    expect(snapshot.docs.map((d) => d.id)).toEqual(["leader-a-uid"]);
  });

  it("não consegue listar membros de outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    const q = query(collection(managerA, "campaigns/campB/members"));
    await assertFails(getDocs(q));
  });

  it("não consegue ler diretamente (get) um membro de outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(getDoc(doc(managerA, "campaigns/campB/members/leader-b-uid")));
  });

  it("consegue criar um líder na própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(managerA, "campaigns/campA/members/new-leader-uid"), {
        role: "leader",
        name: "Novo Líder",
      })
    );
  });

  it("não consegue criar um gestor (só super_admin pode)", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "campaigns/campA/members/rogue-manager-uid"), {
        role: "manager",
        name: "Gestor Indevido",
      })
    );
  });
});

describe("líder não pode listar outros membros", () => {
  it("query em members falha para um líder", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    const q = query(collection(leaderA, "campaigns/campA/members"));
    await assertFails(getDocs(q));
  });

  it("líder consegue ler o próprio perfil", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(getDoc(doc(leaderA, "campaigns/campA/members/leader-a-uid")));
  });
});

describe("super_admin", () => {
  it("consegue listar membros de qualquer campanha", async () => {
    const admin = testEnv.authenticatedContext("admin-uid").firestore();
    const q = query(collection(admin, "campaigns/campB/members"));
    await assertSucceeds(getDocs(q));
  });
});

describe("espelho users/{uid} escrito pelo gestor ao criar líder", () => {
  it("gestor consegue criar o espelho de um líder da própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(managerA, "users/new-leader-uid"), { role: "leader", campaignId: "campA" })
    );
  });

  it("gestor não consegue criar espelho de líder para outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "users/sneaky-uid"), { role: "leader", campaignId: "campB" })
    );
  });

  it("gestor não consegue criar espelho com role diferente de leader", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "users/sneaky-admin-uid"), { role: "super_admin", campaignId: "campA" })
    );
  });
});
