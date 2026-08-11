// Endereço a partir das coordenadas do celular.
//
// Os Correios (e o ViaCEP, que é a API pública equivalente) resolvem CEP →
// endereço; nenhum dos dois aceita latitude/longitude como entrada. Então o
// caminho é em duas etapas: o Nominatim (OpenStreetMap, mesmo mapa já usado
// pelo app) converte a coordenada em endereço e CEP, e o ViaCEP normaliza esse
// CEP no padrão dos Correios quando ele vem. Se qualquer etapa falhar, a
// captura continua válida — o líder só digita o endereço na mão.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const VIACEP_URL = 'https://viacep.com.br/ws';
const REQUEST_TIMEOUT_MS = 8_000;

const noop = () => {};

async function fetchJson(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function pickCity(address = {}) {
  return address.city || address.town || address.village || address.municipality || address.county || '';
}

function pickNeighbourhood(address = {}) {
  return address.suburb || address.neighbourhood || address.city_district || address.quarter || '';
}

export function formatAddress({ logradouro, numero, bairro, cidade, uf, cep }) {
  const street = [logradouro, numero].filter(Boolean).join(', ');
  const city = [cidade, uf].filter(Boolean).join(' - ');
  const parts = [street, bairro, city].filter(Boolean);
  const base = parts.join(' — ');
  return cep ? [base, `CEP ${cep}`].filter(Boolean).join(' · ') : base;
}

export async function reverseGeocode(lat, lng, { onStep = noop } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Coordenada inválida para buscar o endereço.');
  }

  const query = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'pt-BR'
  });

  onStep('endereco: consultando mapa');
  const data = await fetchJson(`${NOMINATIM_URL}?${query}`);
  const address = data?.address || {};

  const resolved = {
    logradouro: address.road || '',
    numero: address.house_number || '',
    bairro: pickNeighbourhood(address),
    cidade: pickCity(address),
    uf: address['ISO3166-2-lvl4']?.replace('BR-', '') || address.state || '',
    cep: onlyDigits(address.postcode).slice(0, 8),
    fonte: 'OpenStreetMap'
  };
  onStep('endereco: mapa respondeu', resolved.cep ? `CEP ${resolved.cep}` : 'sem CEP');

  if (resolved.cep.length === 8) {
    try {
      onStep('endereco: refinando pelo CEP');
      const viaCep = await fetchJson(`${VIACEP_URL}/${resolved.cep}/json/`);
      if (!viaCep?.erro) {
        resolved.logradouro = viaCep.logradouro || resolved.logradouro;
        resolved.bairro = viaCep.bairro || resolved.bairro;
        resolved.cidade = viaCep.localidade || resolved.cidade;
        resolved.uf = viaCep.uf || resolved.uf;
        resolved.fonte = 'OpenStreetMap + ViaCEP';
        onStep('endereco: CEP confirmado');
      } else {
        onStep('endereco: CEP não encontrado no ViaCEP');
      }
    } catch (error) {
      // O CEP é um refinamento: sem ele, o endereço do mapa ainda serve.
      onStep('endereco: ViaCEP falhou', error);
    }
  }

  if (!resolved.logradouro && !resolved.cidade) {
    throw new Error('O mapa não reconheceu um endereço nesta coordenada.');
  }

  return { ...resolved, endereco: formatAddress(resolved) };
}
