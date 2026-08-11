export const GOIANIA_LOCATIONS = [
  { id: "setor-central", bairro: "Setor Central", regiao: "Região Central", lat: -16.6799, lng: -49.255 },
  { id: "setor-bueno", bairro: "Setor Bueno", regiao: "Região Sul", lat: -16.705, lng: -49.279 },
  { id: "setor-marista", bairro: "Setor Marista", regiao: "Região Sul", lat: -16.696, lng: -49.268 },
  { id: "setor-oeste", bairro: "Setor Oeste", regiao: "Região Oeste", lat: -16.682, lng: -49.272 },
  { id: "campinas", bairro: "Setor Campinas", regiao: "Região Oeste", lat: -16.67, lng: -49.296 },
  { id: "norte-ferroviario", bairro: "Setor Norte Ferroviário", regiao: "Região Norte", lat: -16.662, lng: -49.256 },
  { id: "jardim-goias", bairro: "Jardim Goiás", regiao: "Região Leste", lat: -16.7, lng: -49.238 },
  { id: "vila-nova", bairro: "Vila Nova", regiao: "Região Leste", lat: -16.672, lng: -49.238 },
  { id: "jardim-america", bairro: "Jardim América", regiao: "Região Sudoeste", lat: -16.708, lng: -49.301 },
  { id: "pedro-ludovico", bairro: "Setor Pedro Ludovico", regiao: "Região Sul", lat: -16.718, lng: -49.26 },
  { id: "goiania-2", bairro: "Goiânia 2", regiao: "Região Norte", lat: -16.63, lng: -49.29 },
  { id: "vila-pedroso", bairro: "Vila Pedroso", regiao: "Região Sudoeste", lat: -16.66, lng: -49.21 },
  { id: "aparecida-centro", bairro: "Centro", regiao: "Aparecida de Goiânia", lat: -16.823, lng: -49.244 },
  { id: "senador-canedo-centro", bairro: "Centro", regiao: "Senador Canedo", lat: -16.708, lng: -49.093 },
  { id: "trindade-centro", bairro: "Centro", regiao: "Trindade", lat: -16.651, lng: -49.489 },
];

export function findLocationPreset(leader) {
  return GOIANIA_LOCATIONS.find((location) => (
    (Number.isFinite(leader?.lat) && Number.isFinite(leader?.lng)
      && Math.abs(location.lat - leader.lat) < 0.0001
      && Math.abs(location.lng - leader.lng) < 0.0001)
    || (leader?.bairro === location.bairro && leader?.regiao === location.regiao)
  ));
}
