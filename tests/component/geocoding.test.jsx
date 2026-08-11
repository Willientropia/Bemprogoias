import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatAddress, reverseGeocode } from '../../src/services/geocoding';

const nominatimResponse = {
  address: {
    road: 'Rua 4',
    house_number: '120',
    suburb: 'Setor Central',
    city: 'Goiânia',
    state: 'Goiás',
    'ISO3166-2-lvl4': 'BR-GO',
    postcode: '74020-050'
  }
};

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('endereço a partir das coordenadas', () => {
  it('converte a coordenada em endereço e confirma o CEP no ViaCEP', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse(nominatimResponse))
      .mockResolvedValueOnce(jsonResponse({
        logradouro: 'Rua 4', bairro: 'Setor Central', localidade: 'Goiânia', uf: 'GO'
      }));

    const result = await reverseGeocode(-16.6799, -49.2553);

    expect(fetch.mock.calls[0][0]).toContain('nominatim.openstreetmap.org/reverse');
    expect(fetch.mock.calls[1][0]).toContain('viacep.com.br/ws/74020050/json/');
    expect(result).toMatchObject({ cep: '74020050', cidade: 'Goiânia', uf: 'GO', fonte: 'OpenStreetMap + ViaCEP' });
    expect(result.endereco).toBe('Rua 4, 120 — Setor Central — Goiânia - GO · CEP 74020050');
  });

  it('mantém o endereço do mapa quando o ViaCEP falha', async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse(nominatimResponse))
      .mockRejectedValueOnce(new Error('rede indisponível'));

    const result = await reverseGeocode(-16.6799, -49.2553);

    expect(result.fonte).toBe('OpenStreetMap');
    expect(result.endereco).toContain('Setor Central');
  });

  it('recusa coordenada inválida sem chamar a rede', async () => {
    await expect(reverseGeocode(null, undefined)).rejects.toThrow(/Coordenada inválida/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('avisa quando o mapa não reconhece endereço no ponto', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ address: {} }));

    await expect(reverseGeocode(-16.6799, -49.2553)).rejects.toThrow(/não reconheceu um endereço/i);
  });

  it('monta o endereço sem os campos que faltam', () => {
    expect(formatAddress({ cidade: 'Anápolis', uf: 'GO' })).toBe('Anápolis - GO');
  });
});
