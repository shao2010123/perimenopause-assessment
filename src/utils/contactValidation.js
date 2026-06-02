export const REQUIRED_PHONE_EMPTY_MESSAGE = '保存 HTML 报告前请填写手机号。';
export const REQUIRED_PHONE_INVALID_MESSAGE = '请输入 11 位手机号。';

export function isRequiredPhoneFilled(phone) {
  return String(phone ?? '').trim().length > 0;
}

export function isValidRequiredPhone(phone) {
  return /^\d{11}$/.test(String(phone ?? '').trim());
}

export function getRequiredPhoneError(phone) {
  if (!isRequiredPhoneFilled(phone)) return REQUIRED_PHONE_EMPTY_MESSAGE;
  if (!isValidRequiredPhone(phone)) return REQUIRED_PHONE_INVALID_MESSAGE;
  return '';
}
