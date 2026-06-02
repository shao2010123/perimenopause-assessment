export function isRequiredPhoneFilled(phone) {
  return String(phone ?? '').trim().length > 0;
}
