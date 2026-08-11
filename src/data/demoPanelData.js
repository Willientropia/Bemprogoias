// DADOS DE DEMONSTRAÇÃO — não são dados reais da campanha.
//
// O painel do gestor (Regiões / Rede de Indicações / Relatório Expresso) foi
// construído a partir do handoff de design, que especifica números e uma base
// de 15 líderes de Goiânia para apresentação ao cliente.
//
// DEMO_LEADERS é a fonte versionada do seed idempotente executado por
// scripts/seedDemoCampaign.js. O app não lê esta constante diretamente: as
// três telas consultam campaigns/{campaignId}/members no Firestore. Assim a
// demonstração percorre o mesmo caminho de dados de uma campanha normal.
//
// RECIPIENTS / REPORT_BLOCKS continuam locais até existir persistência para a
// configuração do Relatório Expresso.

export const DEMO_LEADERS = [
  { id: "l1", nome: "Ana Ribeiro", regiao: "Região Central", bairro: "Setor Central", lat: -16.6799, lng: -49.255, eleitores: 2140, semana: 86, perf: "alto" },
  { id: "l2", nome: "Carlos Mendes", regiao: "Região Sul", bairro: "Setor Bueno", lat: -16.705, lng: -49.279, eleitores: 1980, semana: 74, perf: "alto" },
  { id: "l3", nome: "Júlia Faria", regiao: "Região Sul", bairro: "Setor Marista", lat: -16.696, lng: -49.268, eleitores: 1410, semana: 39, perf: "medio" },
  { id: "l4", nome: "Pedro Oliveira", regiao: "Região Oeste", bairro: "Setor Oeste", lat: -16.682, lng: -49.272, eleitores: 1660, semana: 58, perf: "alto" },
  { id: "l5", nome: "Sandra Lima", regiao: "Região Oeste", bairro: "Setor Campinas", lat: -16.67, lng: -49.296, eleitores: 1230, semana: 31, perf: "medio" },
  { id: "l6", nome: "Rafael Souza", regiao: "Região Norte", bairro: "Setor Norte Ferroviário", lat: -16.662, lng: -49.256, eleitores: 980, semana: 12, perf: "alerta" },
  { id: "l7", nome: "Marcos Antunes", regiao: "Região Leste", bairro: "Jardim Goiás", lat: -16.7, lng: -49.238, eleitores: 1870, semana: 69, perf: "alto" },
  { id: "l8", nome: "Luana Ferreira", regiao: "Região Leste", bairro: "Vila Nova", lat: -16.672, lng: -49.238, eleitores: 1120, semana: 27, perf: "medio" },
  { id: "l9", nome: "Roberto Dias", regiao: "Região Sudoeste", bairro: "Jardim América", lat: -16.708, lng: -49.301, eleitores: 1540, semana: 44, perf: "medio" },
  { id: "l10", nome: "Patrícia Gomes", regiao: "Região Sul", bairro: "Setor Pedro Ludovico", lat: -16.718, lng: -49.26, eleitores: 1290, semana: 35, perf: "medio" },
  { id: "l11", nome: "Eduardo Lima", regiao: "Região Norte", bairro: "Goiânia 2", lat: -16.63, lng: -49.29, eleitores: 760, semana: 8, perf: "alerta" },
  { id: "l12", nome: "Carla Mendonça", regiao: "Região Sudoeste", bairro: "Vila Pedroso", lat: -16.66, lng: -49.21, eleitores: 640, semana: 6, perf: "alerta" },
  { id: "l13", nome: "Vitor Camargo", regiao: "Aparecida de Goiânia", bairro: "Centro", lat: -16.823, lng: -49.244, eleitores: 2020, semana: 78, perf: "alto" },
  { id: "l14", nome: "Helena Prado", regiao: "Senador Canedo", bairro: "Centro", lat: -16.708, lng: -49.093, eleitores: 1180, semana: 29, perf: "medio" },
  { id: "l15", nome: "Bruno Teixeira", regiao: "Trindade", bairro: "Centro", lat: -16.651, lng: -49.489, eleitores: 1350, semana: 41, perf: "medio" },
];

export const DEMO_RECIPIENTS = [
  { id: "r1", nome: "Ana Ribeiro", telefone: "(62) 9 9123-4567", papel: "Coordenação geral", pessoas: 1 },
  { id: "r2", nome: "Carlos Mendes", telefone: "(62) 9 9871-2210", papel: "Coordenação Sul", pessoas: 1 },
  { id: "r3", nome: "Equipe Marketing", telefone: "(62) 9 9440-1188", papel: "Grupo — 6 membros", pessoas: 6 },
  { id: "r4", nome: "Coordenadores Regionais", telefone: "(62) 9 9317-4402", papel: "Grupo — 5 membros", pessoas: 5 },
  { id: "r5", nome: "Gabinete", telefone: "(62) 9 9002-7755", papel: "Chefia de gabinete", pessoas: 1 },
];

export const DEFAULT_REPORT_BLOCKS = [
  { id: "resumo", label: "Resumo de eleitores indicados", ativo: true },
  { id: "ranking", label: "Ranking dos 5 melhores líderes", ativo: true },
  { id: "alerta", label: "Bases em alerta (queda de desempenho)", ativo: true },
  { id: "demandas", label: "Demandas abertas no dia", ativo: true },
  { id: "sentimento", label: "Sentimento das redes (Rádio Peão IA)", ativo: false },
  { id: "presenca", label: "Presença nas reuniões de conselho", ativo: false },
];

// Números que a demo exibe mas que ainda não têm origem no sistema.
export const DEMO_STATIC_STATS = {
  relatoriosEnviados: "1.284",
  taxaEntrega: "98,6%",
  demandasAbertas: 12,
  demandasCriticas: 2,
  demandasAndamento: 7,
  sentimentoPositivo: 63,
  sentimentoDelta: 9,
  presencaConselhos: 82,
};

export const PERF_COLORS = {
  alto: "#1f6b34",
  medio: "#d9a520",
  alerta: "#c0392b",
};

export const PERF_LABELS = {
  alto: "Alto desempenho",
  medio: "Desempenho médio",
  alerta: "Base em alerta",
};

export const GOIANIA_CENTER = [-16.6869, -49.2648];
