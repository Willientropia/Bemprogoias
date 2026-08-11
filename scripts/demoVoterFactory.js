const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Daniel", "Eliane", "Fabio", "Gabriela", "Henrique", "Isabela", "João",
  "Karen", "Lucas", "Mariana", "Nicolas", "Olivia", "Paulo", "Renata", "Samuel", "Tatiana", "Vinicius",
  "Aline", "Caio", "Débora", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Leandro",
];

const LAST_NAMES = [
  "Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Ferreira", "Gomes", "Henrique", "Inácio", "Jesus",
  "Lima", "Martins", "Nascimento", "Oliveira", "Pereira", "Queiroz", "Ribeiro", "Silva", "Teixeira", "Vieira",
  "Amaral", "Borges", "Castro", "Duarte", "Freitas", "Guimarães", "Lopes", "Mendes", "Rocha", "Souza",
];

const SOURCES = ["Visita em campo", "Indicação direta", "Evento regional", "WhatsApp", "Reunião comunitária"];
const LOCATION_MODES = [
  { id: "gps", label: "GPS do celular" },
  { id: "manual", label: "Endereço digitado" },
  { id: "pin", label: "Pin no mapa" },
];

function fraction(index, salt = 0) {
  const value = Math.imul(index + 1 + salt * 97, 2654435761) >>> 0;
  return value / 4294967296;
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function validationStatus(index) {
  // Espalha os status ao longo de cada líder, evitando blocos inteiros com o
  // mesmo resultado quando a base demo é pequena.
  const bucket = (index * 37) % 100;
  if (bucket < 91) return "validado";
  if (bucket < 98) return "pendente";
  return "revisao";
}

function validationEvidence(status) {
  if (status === "validado") {
    return {
      validationMethod: "documento_contato",
      validationReason: "Documento sem duplicidade e contato confirmado",
      validationChecks: { requiredFields: true, uniqueDocument: true, contactConfirmed: true, geoCoherent: true },
    };
  }
  if (status === "revisao") {
    return {
      validationMethod: "auditoria_manual",
      validationReason: "Divergência de localização encaminhada para auditoria",
      validationChecks: { requiredFields: true, uniqueDocument: true, contactConfirmed: false, geoCoherent: false },
    };
  }
  return {
    validationMethod: "contato_pendente",
    validationReason: "Aguardando confirmação do contato informado",
    validationChecks: { requiredFields: true, uniqueDocument: true, contactConfirmed: false, geoCoherent: true },
  };
}

function recentRate(performance) {
  if (performance === "alto") return 0.2;
  if (performance === "medio") return 0.12;
  return 0.05;
}

export function allocateVoterCounts(leaders, total) {
  if (leaders.length === 0) return [];

  // Mantém todos os líderes visíveis, mas cria uma curva de produção clara.
  // A ordem histórica só define quem ocupa cada faixa; o peso vem da posição,
  // não dos antigos milhares de registros da campanha demo.
  const minimum = total >= leaders.length * 3 ? 3 : 0;
  const ranked = leaders
    .map((leader, index) => ({
      index,
      value: Number(leader.eleitoresValidados ?? leader.eleitores) || 0,
      tieBreaker: String(leader.id ?? index),
    }))
    .sort((a, b) => b.value - a.value || a.tieBreaker.localeCompare(b.tieBreaker));
  const weights = ranked.map((_, rank) => Math.pow(leaders.length - rank, 1.8));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const distributable = total - minimum * leaders.length;
  const exact = weights.map((weight) => (weight / weightTotal) * distributable);
  const rankedCounts = exact.map((value) => Math.floor(value) + minimum);
  let remaining = total - rankedCounts.reduce((sum, count) => sum + count, 0);

  exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remaining <= 0) return;
      rankedCounts[index] += 1;
      remaining -= 1;
    });

  const counts = Array(leaders.length).fill(0);
  ranked.forEach(({ index }, rank) => { counts[index] = rankedCounts[rank]; });
  return counts;
}

export function buildDemoVoterRecords(leaders, total, now = new Date()) {
  const counts = allocateVoterCounts(leaders, total);
  const records = [];
  const summaries = {};
  let globalIndex = 0;

  leaders.forEach((leader, leaderIndex) => {
    const leaderTotal = counts[leaderIndex];
    const weeklyTotal = Math.max(1, Math.round(leaderTotal * recentRate(leader.perf)));

    for (let localIndex = 0; localIndex < leaderTotal; localIndex += 1) {
      // Três "dígitos" em bases diferentes geram milhares de combinações sem
      // repetir o nome completo dentro do volume suportado pelo seed.
      const firstName = FIRST_NAMES[globalIndex % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor(globalIndex / FIRST_NAMES.length) % LAST_NAMES.length];
      const secondLastName = LAST_NAMES[
        Math.floor(globalIndex / (FIRST_NAMES.length * LAST_NAMES.length)) % LAST_NAMES.length
      ];
      const name = `${firstName} ${lastName} ${secondLastName}`;
      const isRecent = localIndex < weeklyTotal;
      const daysAgo = isRecent
        ? Math.floor(fraction(globalIndex, 1) * 7)
        : 8 + Math.floor(fraction(globalIndex, 2) * 82);
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(8 + Math.floor(fraction(globalIndex, 3) * 12), Math.floor(fraction(globalIndex, 4) * 60), 0, 0);

      const angle = fraction(globalIndex, 5) * Math.PI * 2;
      const spread = 0.002 + fraction(globalIndex, 6) * 0.012;
      const locationMode = LOCATION_MODES[globalIndex % LOCATION_MODES.length];
      const phone = String(910000000 + globalIndex).padStart(9, "0");
      const status = validationStatus(globalIndex);
      const evidence = validationEvidence(status);
      const validatedAt = status === "validado"
        ? new Date(Math.min(now.getTime(), createdAt.getTime() + 24 * 60 * 60 * 1000))
        : null;

      records.push({
        id: `demo-voter-${String(globalIndex + 1).padStart(5, "0")}`,
        name,
        normalizedName: slugify(name),
        rg: String(100000000 + globalIndex),
        titulo: globalIndex % 9 === 0 ? null : String(900000000000 + globalIndex),
        zona: String(1 + (globalIndex % 147)),
        secao: String(10 + (globalIndex % 490)),
        whatsapp: `(62) ${phone.slice(0, 1)} ${phone.slice(1, 5)}-${phone.slice(5)}`,
        leaderId: leader.id,
        leaderName: leader.name ?? leader.nome,
        regiao: leader.regiao,
        bairro: leader.bairro,
        endereco: `${leader.bairro}, ${leader.regiao}`,
        lat: leader.lat + Math.cos(angle) * spread,
        lng: leader.lng + Math.sin(angle) * spread,
        locationMode: locationMode.id,
        locationModeLabel: locationMode.label,
        source: SOURCES[globalIndex % SOURCES.length],
        validationStatus: status,
        ...evidence,
        validatedAt,
        syncStatus: "sincronizado",
        createdAt,
        isDemo: true,
        demoSource: "voters-demo-v1",
      });
      globalIndex += 1;
    }
  });

  leaders.forEach((leader) => {
    const leaderRecords = records.filter((record) => record.leaderId === leader.id);
    const validated = leaderRecords.filter((record) => record.validationStatus === "validado");
    summaries[leader.id] = {
      eleitores: leaderRecords.length,
      eleitoresValidados: validated.length,
      hoje: validated.filter((record) => record.createdAt.toDateString() === now.toDateString()).length,
      semana: validated.filter((record) => now.getTime() - record.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000).length,
      perf: "alerta",
    };
  });

  const performanceRanking = [...leaders].sort((a, b) => (
    summaries[b.id].eleitoresValidados - summaries[a.id].eleitoresValidados
  ));
  performanceRanking.forEach((leader, index) => {
    const percentile = index / Math.max(1, performanceRanking.length - 1);
    summaries[leader.id].perf = percentile <= 0.3 ? "alto" : percentile <= 0.7 ? "medio" : "alerta";
  });

  return { records, summaries };
}
