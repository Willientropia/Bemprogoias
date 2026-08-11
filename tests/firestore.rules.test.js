import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { Timestamp, collection, deleteDoc, doc, getDocs, getDoc, limit, orderBy, query, where, setDoc } from "firebase/firestore";

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

    await setDoc(doc(db, "campaigns/campA/voters", "voter-a-1"), {
      leaderId: "leader-a-uid",
      name: "Eleitor A",
      validationStatus: "validado",
      createdAt: Timestamp.fromDate(new Date("2026-08-11T12:00:00Z")),
    });
    await setDoc(doc(db, "campaigns/campA/voters", "voter-other-1"), {
      leaderId: "other-leader-uid",
      name: "Eleitor de outro líder",
      validationStatus: "pendente",
      createdAt: Timestamp.fromDate(new Date("2026-08-10T12:00:00Z")),
    });
    await setDoc(doc(db, "campaigns/campB/voters", "voter-b-1"), {
      leaderId: "leader-b-uid",
      name: "Eleitor B",
      createdAt: Timestamp.fromDate(new Date("2026-08-09T12:00:00Z")),
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

describe("consulta de eleitores pelo painel", () => {
  it("gestor pagina os eleitores da própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    const votersQuery = query(
      collection(managerA, "campaigns/campA/voters"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snapshot = await assertSucceeds(getDocs(votersQuery));
    expect(snapshot.size).toBe(2);
  });

  it("gestor não consulta eleitores de outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(getDocs(collection(managerA, "campaigns/campB/voters")));
  });

  it("líder consulta somente eleitores vinculados ao próprio uid", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    const ownVoters = query(
      collection(leaderA, "campaigns/campA/voters"),
      where("leaderId", "==", "leader-a-uid")
    );
    const snapshot = await assertSucceeds(getDocs(ownVoters));
    expect(snapshot.docs.map((document) => document.id)).toEqual(["voter-a-1"]);
  });

  it("líder não lista os eleitores de todos os líderes", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(getDocs(collection(leaderA, "campaigns/campA/voters")));
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

describe("remoção de líder pelo gestor", () => {
  it("gestor consegue remover um líder da própria campanha (members + users)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users", "disposable-leader-uid"), { role: "leader", campaignId: "campA" });
      await setDoc(doc(db, "campaigns/campA/members", "disposable-leader-uid"), { role: "leader" });
    });

    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(deleteDoc(doc(managerA, "campaigns/campA/members/disposable-leader-uid")));
    await assertSucceeds(deleteDoc(doc(managerA, "users/disposable-leader-uid")));
  });

  it("gestor não consegue remover um gestor (só super_admin)", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(deleteDoc(doc(managerA, "campaigns/campA/members/manager-a-uid")));
  });

  it("gestor não consegue remover líder de outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(deleteDoc(doc(managerA, "campaigns/campB/members/leader-b-uid")));
  });
});

describe("remoção pelo super_admin", () => {
  it("super_admin consegue remover um gestor", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users", "disposable-manager-uid"), { role: "manager", campaignId: "campA" });
      await setDoc(doc(db, "campaigns/campA/members", "disposable-manager-uid"), { role: "manager" });
    });

    const admin = testEnv.authenticatedContext("admin-uid").firestore();
    await assertSucceeds(deleteDoc(doc(admin, "campaigns/campA/members/disposable-manager-uid")));
    await assertSucceeds(deleteDoc(doc(admin, "users/disposable-manager-uid")));
  });
});
