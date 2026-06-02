import { getRequiredPhoneError, isRequiredPhoneFilled, isValidRequiredPhone } from './contactValidation.js';

describe('contact validation', () => {
  it('requires report phone to be filled before export', () => {
    expect(isRequiredPhoneFilled('')).toBe(false);
    expect(isRequiredPhoneFilled('   ')).toBe(false);
    expect(isRequiredPhoneFilled('13800138000')).toBe(true);
  });

  it('requires report phone to be exactly 11 digits', () => {
    expect(isValidRequiredPhone('13800138000')).toBe(true);
    expect(isValidRequiredPhone('1380013800')).toBe(false);
    expect(isValidRequiredPhone('138001380000')).toBe(false);
    expect(isValidRequiredPhone('1380013800a')).toBe(false);
    expect(isValidRequiredPhone('138 0013 8000')).toBe(false);
  });

  it('returns the matching phone validation message', () => {
    expect(getRequiredPhoneError('')).toBe('保存 HTML 报告前请填写手机号。');
    expect(getRequiredPhoneError('1380013800')).toBe('请输入 11 位手机号。');
    expect(getRequiredPhoneError('13800138000')).toBe('');
  });
});
