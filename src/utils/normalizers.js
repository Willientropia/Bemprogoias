export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function normalizeRg(value = '') {
  return onlyDigits(value);
}

export function normalizeTitle(value = '') {
  return onlyDigits(value);
}

export function normalizeWhatsApp(value = '') {
  const digits = onlyDigits(value);
  if (!digits) return '';
  return (digits.length === 10 || digits.length === 11) ? `55${digits}` : digits;
}

export function formatWhatsApp(value = '') {
  let digits = onlyDigits(value);
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, ddd, first, last) =>
      [ddd && `(${ddd}`, ddd?.length === 2 && ') ', first, last && `-${last}`].filter(Boolean).join('')
    );
  }
  return digits.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, (_, ddd, first, last) =>
    [ddd && `(${ddd}`, ddd?.length === 2 && ') ', first, last && `-${last}`].filter(Boolean).join('')
  );
}

export function formatRg(value = '') {
  const digits = onlyDigits(value).slice(0, 12);
  return digits.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,1}).*/, (_, a, b, c, d) =>
    [a, b && `.${b}`, c && `.${c}`, d && `-${d}`].join('')
  );
}

export function createId(prefix = 'voter') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Cadastros antigos do Firestore podem guardar objeto, booleano ou nulo em
// campos que a interface imprime como texto. Renderizar isso derruba a tela
// inteira ("Objects are not valid as a React child"), então tudo que vem do
// banco passa por aqui antes de virar JSX.
export function toDisplayText(value) {
  if (value == null) return '';
  if (['string', 'number', 'bigint'].includes(typeof value)) return String(value).trim();
  return '';
}

export function toSearchText(voter = {}) {
  const safeVoter = voter && typeof voter === 'object' ? voter : {};
  return [safeVoter.nome, safeVoter.nomeCompleto, safeVoter.rg, safeVoter.titulo, safeVoter.whatsapp]
    .filter((value) => value != null && ['string', 'number', 'bigint'].includes(typeof value))
    .map(String)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function validateVoter(input) {
  const errors = {};
  if (!input.nome?.trim()) errors.nome = 'Informe o nome da pessoa.';
  if (!normalizeRg(input.rg)) errors.rg = 'Informe o RG.';
  if (!input.zona?.trim()) errors.zona = 'Informe a zona.';
  if (!input.secao?.trim()) errors.secao = 'Informe a seção.';
  if (normalizeWhatsApp(input.whatsapp).length < 12) errors.whatsapp = 'Informe um WhatsApp com DDD.';
  if (!input.localizacao?.modo) errors.localizacao = 'Escolha como informar a localização.';
  if (input.localizacao?.modo === 'manual' && !input.localizacao.endereco?.trim()) {
    errors.localizacao = 'Digite o endereço.';
  }
  if (['gps', 'mapa'].includes(input.localizacao?.modo) &&
      (!Number.isFinite(input.localizacao.lat) || !Number.isFinite(input.localizacao.lng))) {
    errors.localizacao = 'Capture ou marque uma posição válida.';
  }
  return errors;
}
