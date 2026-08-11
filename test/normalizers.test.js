import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRg,
  normalizeTitle,
  normalizeWhatsApp,
  toDisplayText,
  validateVoter
} from '../src/utils/normalizers.js';

test('toDisplayText descarta valores que a tela não consegue imprimir', () => {
  assert.equal(toDisplayText('  Ana Souza  '), 'Ana Souza');
  assert.equal(toDisplayText(133), '133');
  assert.equal(toDisplayText(null), '');
  assert.equal(toDisplayText(undefined), '');
  assert.equal(toDisplayText({ valor: 'registro antigo' }), '');
  assert.equal(toDisplayText(['a', 'b']), '');
  assert.equal(toDisplayText(true), '');
});

test('normaliza documentos e WhatsApp para deduplicação', () => {
  assert.equal(normalizeRg('12.345.678-9'), '123456789');
  assert.equal(normalizeTitle('1234 5678 9012'), '123456789012');
  assert.equal(normalizeWhatsApp('(62) 99999-0000'), '5562999990000');
  assert.equal(normalizeWhatsApp('+55 62 99999-0000'), '5562999990000');
});

test('título é opcional e RG/localização são obrigatórios', () => {
  const valid = {
    nome: 'Ana Souza', rg: '12.345.678-9', titulo: '', zona: '133', secao: '245',
    whatsapp: '(62) 99999-0000', localizacao: { modo: 'manual', endereco: 'Rua 1, Goiânia - GO' }
  };
  assert.deepEqual(validateVoter(valid), {});
  const errors = validateVoter({ ...valid, rg: '', localizacao: { modo: 'gps' } });
  assert.ok(errors.rg);
  assert.ok(errors.localizacao);
  assert.equal(errors.titulo, undefined);
});
