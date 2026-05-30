import { isRequiredPhoneFilled } from './contactValidation.js';

describe('contact validation', () => {
  it('requires report phone to be filled before export', () => {
    expect(isRequiredPhoneFilled('')).toBe(false);
    expect(isRequiredPhoneFilled('   ')).toBe(false);
    expect(isRequiredPhoneFilled('13800138000')).toBe(true);
  });
});
