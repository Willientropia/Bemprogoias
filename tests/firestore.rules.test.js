import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { Timestamp, collection, deleteDoc, doc, getDocs, getDoc, limit, orderBy, query, updateDoc, where, setDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "leader-b-uid"), { role: "leader", campaignId: "campB" });

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
      campaignId: "campA",
      leaderId: "leader-a-uid",
      name: "Eleitor A",
      validationStatus: "validado",
      createdAt: Timestamp.fromDate(new Date("2026-08-11T12:00:00Z")),
    });
    await setDoc(doc(db, "campaigns/campA/voters", "voter-other-1"), {
      campaignId: "campA",
      leaderId: "other-leader-uid",
      name: "Eleitor de outro líder",
      validationStatus: "pendente",
      createdAt: Timestamp.fromDate(new Date("2026-08-10T12:00:00Z")),
    });
    await setDoc(doc(db, "campaigns/campB/voters", "voter-b-1"), {
      campaignId: "campB",
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
        campaignId: "campA",
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

describe("configuração do Relatório Expresso", () => {
  it("gestor salva apenas o WhatsApp e o horário do relatório da própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(updateDoc(doc(managerA, "campaigns/campA"), {
      reportRecipientWhatsapp: "(62) 9 9999-0000",
      reportDeliveryTime: "21:00",
      reportSettingsUpdatedAt: Timestamp.now(),
    }));
  });

  it("gestor não altera outros campos da campanha por este fluxo", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(updateDoc(doc(managerA, "campaigns/campA"), {
      name: "Campanha adulterada",
      reportRecipientWhatsapp: "(62) 9 9999-0000",
      reportDeliveryTime: "21:00",
      reportSettingsUpdatedAt: Timestamp.now(),
    }));
  });

  it("gestor não configura relatório de outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(updateDoc(doc(managerA, "campaigns/campB"), {
      reportRecipientWhatsapp: "(62) 9 9999-0000",
      reportDeliveryTime: "21:00",
      reportSettingsUpdatedAt: Timestamp.now(),
    }));
  });

  it("horário fora do formato hh:mm é recusado", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(updateDoc(doc(managerA, "campaigns/campA"), {
      reportRecipientWhatsapp: "(62) 9 9999-0000",
      reportDeliveryTime: "25:99",
      reportSettingsUpdatedAt: Timestamp.now(),
    }));
  });

  it("líder não configura relatório", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(updateDoc(doc(leaderA, "campaigns/campA"), {
      reportRecipientWhatsapp: "(62) 9 9999-0000",
      reportDeliveryTime: "21:00",
      reportSettingsUpdatedAt: Timestamp.now(),
    }));
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

describe("cadastro de eleitores pelo líder (app mobile)", () => {
  const novoEleitor = (leaderId, campaignId = "campA") => ({
    campaignId,
    leaderId,
    name: "Eleitor Novo",
    normalizedName: "eleitor novo",
    rg: "123456789",
    titulo: "900000000001",
    zona: "12",
    secao: "345",
    whatsapp: "(62) 9 1234-5678",
    lat: -16.6799,
    lng: -49.255,
    locationMode: "gps",
    validationStatus: "pendente",
    syncStatus: "sincronizado",
    createdAt: Timestamp.now(),
  });

  it("líder cadastra um eleitor vinculado a si mesmo", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(leaderA, "campaigns/campA/voters/novo-do-lider-a"), novoEleitor("leader-a-uid"))
    );
  });

  it("líder não cadastra eleitor em nome de outro líder", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(
      setDoc(doc(leaderA, "campaigns/campA/voters/tentativa-alheia"), novoEleitor("other-leader-uid"))
    );
  });

  it("líder não cadastra eleitor em outra campanha", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(
      setDoc(doc(leaderA, "campaigns/campB/voters/tentativa-campanha-b"), novoEleitor("leader-a-uid", "campB"))
    );
  });

  it("líder edita um eleitor próprio", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(
      updateDoc(doc(leaderA, "campaigns/campA/voters/voter-a-1"), { whatsapp: "(62) 9 0000-1111" })
    );
  });

  it("líder não edita eleitor de outro líder", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(
      updateDoc(doc(leaderA, "campaigns/campA/voters/voter-other-1"), { name: "Alterado" })
    );
  });

  it("líder remove um eleitor próprio", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "campaigns/campA/voters/descartavel-do-lider"), {
        campaignId: "campA",
        leaderId: "leader-a-uid",
        name: "Para remover",
        createdAt: Timestamp.now(),
      });
    });
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(deleteDoc(doc(leaderA, "campaigns/campA/voters/descartavel-do-lider")));
  });

  it("líder não remove eleitor de outro líder", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(deleteDoc(doc(leaderA, "campaigns/campA/voters/voter-other-1")));
  });

  it("líder lê o próprio eleitor por get direto", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(getDoc(doc(leaderA, "campaigns/campA/voters/voter-a-1")));
  });

  it("líder não lê eleitor de outro líder por get direto", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(getDoc(doc(leaderA, "campaigns/campA/voters/voter-other-1")));
  });

  it("usuário não autenticado não cadastra eleitor", async () => {
    const anonymous = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonymous, "campaigns/campA/voters/anonimo"), novoEleitor("leader-a-uid"))
    );
  });

  it("gestor cadastra e remove eleitores da própria campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(managerA, "campaigns/campA/voters/do-gestor"), novoEleitor("leader-a-uid"))
    );
    await assertSucceeds(deleteDoc(doc(managerA, "campaigns/campA/voters/do-gestor")));
  });

  it("gestor não cadastra eleitor em outra campanha", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "campaigns/campB/voters/invasao"), novoEleitor("leader-b-uid", "campB"))
    );
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
      const database = ctx.firestore();
      await setDoc(doc(database, "users", "disposable-leader-uid"), { role: "leader", campaignId: "campA" });
      await setDoc(doc(database, "campaigns/campA/members", "disposable-leader-uid"), { role: "leader" });
    });
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertSucceeds(deleteDoc(doc(managerA, "campaigns/campA/members/disposable-leader-uid")));
    await assertSucceeds(deleteDoc(doc(managerA, "users/disposable-leader-uid")));
  });

  it("gestor não consegue remover um gestor", async () => {
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
      const database = ctx.firestore();
      await setDoc(doc(database, "users", "disposable-manager-uid"), { role: "manager", campaignId: "campA" });
      await setDoc(doc(database, "campaigns/campA/members", "disposable-manager-uid"), { role: "manager" });
    });
    const admin = testEnv.authenticatedContext("admin-uid").firestore();
    await assertSucceeds(deleteDoc(doc(admin, "campaigns/campA/members/disposable-manager-uid")));
    await assertSucceeds(deleteDoc(doc(admin, "users/disposable-manager-uid")));
  });
});

describe("proteção contra mudança indevida de campanha ou papel", () => {
  it("gestor não traz para sua campanha o espelho de um líder alheio", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "users/leader-b-uid"), { role: "leader", campaignId: "campA" })
    );
  });

  it("gestor não transforma um membro gestor em líder", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    await assertFails(
      setDoc(doc(managerA, "campaigns/campA/members/manager-a-uid"), {
        role: "leader",
        campaignId: "campA",
      })
    );
  });
});

describe("eleitores e reservas de deduplicação", () => {
  it("líder reserva RG para si, mas não para outro líder", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(leaderA, "campaigns/campA/voterKeys/rg_123"), {
        campaignId: "campA",
        leaderId: "leader-a-uid",
        voterId: "voter-a",
        field: "rg",
        value: "123",
      })
    );
    await assertFails(
      setDoc(doc(leaderA, "campaigns/campA/voterKeys/rg_456"), {
        campaignId: "campA",
        leaderId: "leader-b-uid",
        voterId: "voter-b",
        field: "rg",
        value: "456",
      })
    );
  });

  it("líder não reserva chave usando campanha divergente", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertFails(
      setDoc(doc(leaderA, "campaigns/campA/voterKeys/rg_789"), {
        campaignId: "campB",
        leaderId: "leader-a-uid",
        voterId: "voter-a",
        field: "rg",
        value: "789",
      })
    );
  });
});

describe("localização em tempo real do líder", () => {
  it("líder compartilha somente a própria posição", async () => {
    const leaderA = testEnv.authenticatedContext("leader-a-uid").firestore();
    await assertSucceeds(
      setDoc(doc(leaderA, "campaigns/campA/leaderLocations/leader-a-uid"), {
        campaignId: "campA",
        leaderId: "leader-a-uid",
        lat: -16.68,
        lng: -49.26,
        sharing: true,
      })
    );
    await assertFails(
      setDoc(doc(leaderA, "campaigns/campA/leaderLocations/leader-b-uid"), {
        campaignId: "campA",
        leaderId: "leader-b-uid",
        lat: 0,
        lng: 0,
        sharing: true,
      })
    );
  });

  it("somente o gestor da campanha lista as posições", async () => {
    const managerA = testEnv.authenticatedContext("manager-a-uid").firestore();
    const managerB = testEnv.authenticatedContext("manager-b-uid").firestore();
    await assertSucceeds(getDocs(collection(managerA, "campaigns/campA/leaderLocations")));
    await assertFails(getDocs(collection(managerB, "campaigns/campA/leaderLocations")));
  });
});
