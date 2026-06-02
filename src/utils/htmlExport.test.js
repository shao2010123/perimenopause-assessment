import { describe, expect, it } from 'vitest';
import { applyHtmlExportAdjustments } from './htmlExport.js';

describe('applyHtmlExportAdjustments', () => {
  it('removes contact and edit controls while keeping symptom details collapsed', () => {
    const phone = { removed: false, remove() { this.removed = true; } };
    const editButton = {
      removed: false,
      parentElement: {
        textContent: '',
        children: [],
        removed: false,
        remove() { this.removed = true; },
      },
      remove() { this.removed = true; },
    };
    const symptomDetail = { className: 'group rounded-[10px] bg-white/35 px-2 py-1', open: true };
    const footerDetail = { className: 'rounded-[14px] border border-white/70', open: true };
    const clone = {
      querySelectorAll(selector) {
        if (selector === '[data-pdf-hidden]') return [editButton];
        if (selector === '[data-report-phone]') return [phone];
        if (selector === 'details') return [symptomDetail, footerDetail];
        return [];
      },
    };

    applyHtmlExportAdjustments(clone);

    expect(phone.removed).toBe(true);
    expect(editButton.removed).toBe(true);
    expect(editButton.parentElement.removed).toBe(true);
    expect(symptomDetail.open).toBe(false);
    expect(footerDetail.open).toBe(true);
  });
});
