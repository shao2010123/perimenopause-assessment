import { PATTERN_NAMES } from './constants.js';
import { getCoreRefs, getRefsByModule, patternRefMap } from './references.js';

describe('references helpers', () => {
  it('getRefsByModule("模式A") returns the expected core papers', () => {
    expect(getRefsByModule('模式A').map((ref) => ref.id)).toEqual([
      'R6',
      'R7a',
      'R7b',
      'R8',
      'R9',
    ]);
  });

  it('patternRefMap.B points to the revised pattern B evidence bundle', () => {
    expect(patternRefMap.B).toEqual(['R7a', 'R10', 'R11', 'R13']);
  });

  it('getCoreRefs exposes the 6 key references used in the result footer', () => {
    expect(getCoreRefs().map((ref) => ref.id)).toEqual(['R1', 'R4', 'R39', 'R40', 'R41', 'R42']);
  });

  it('pattern B uses the revised user-facing name', () => {
    expect(PATTERN_NAMES.B).toBe('雌孕激素比例失调型');
  });
});
