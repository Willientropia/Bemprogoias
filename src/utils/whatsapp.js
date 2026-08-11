export function whatsappNumber(value, defaultCountryCode = "55") {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith(defaultCountryCode) && digits.length >= 12) return digits;
  return digits.length === 10 || digits.length === 11 ? `${defaultCountryCode}${digits}` : digits;
}

export function whatsappUrl(value, message = "") {
  const number = whatsappNumber(value);
  if (!number) return "";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}
