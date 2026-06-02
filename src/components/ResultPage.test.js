import { describe, expect, it } from 'vitest';
import { REPORT_ACTION_PRIMARY_CLASS, REPORT_ACTION_SECONDARY_CLASS } from './ResultPage.jsx';

describe('ResultPage report action layout', () => {
  it('places export and restart actions on a four-to-one row at desktop sizes', () => {
    expect(REPORT_ACTION_PRIMARY_CLASS).toContain('sm:basis-4/5');
    expect(REPORT_ACTION_SECONDARY_CLASS).toContain('sm:basis-1/5');
  });
});
