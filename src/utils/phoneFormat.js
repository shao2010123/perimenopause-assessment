export function maskPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\s+/g, '');
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}
