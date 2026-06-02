import { describe, expect, it } from 'vitest';
import { applyPdfExportAdjustments } from './pdfDom.js';
import { getLongPagePdfSize, getPdfWrapperStyle } from './pdfLayout.js';

describe('applyPdfExportAdjustments', () => {
  it('keeps report layout while expanding collapsed sections for PDF', () => {
    const details = [{ open: false }, { open: false }];
    const hiddenNode = { removed: false, remove() { this.removed = true; } };
    const clone = {
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === 'details') return details;
        if (selector === '[data-pdf-hidden]') return [hiddenNode];
        if (selector === '[data-pdf-disclaimer]') return [];
        return [];
      },
    };

    applyPdfExportAdjustments(clone, { phone: '13900139015' });

    expect(details.every((item) => item.open)).toBe(true);
    expect(hiddenNode.removed).toBe(true);
  });

  it('removes modern color functions from the cloned report before rendering', () => {
    const nodes = [
      {
        style: {
          backgroundColor: 'color-mix(in oklab, var(--color-white) 70%, transparent)',
          borderColor: 'oklab(80% 0.01 0.02)',
          color: 'rgb(61, 49, 71)',
          boxShadow: '0 8px 18px color-mix(in oklab, #E8798A 20%, transparent)',
        },
      },
    ];
    const clone = {
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '*') return nodes;
        return [];
      },
    };

    applyPdfExportAdjustments(clone);

    expect(nodes[0].style.backgroundColor).toBe('rgba(255, 255, 255, 0.7)');
    expect(nodes[0].style.borderColor).toBe('rgba(255, 255, 255, 0.7)');
    expect(nodes[0].style.color).toBe('rgb(61, 49, 71)');
    expect(nodes[0].style.boxShadow).toBe('none');
  });

  it('uses supported computed colors when the browser can resolve them', () => {
    const nodes = [
      {
        style: {
          backgroundColor: '',
          borderTopColor: '',
          borderRightColor: '',
          borderBottomColor: '',
          borderLeftColor: '',
          color: '',
          boxShadow: '',
        },
      },
    ];
    const clone = {
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '*') return nodes;
        return [];
      },
    };

    global.window = {
      getComputedStyle() {
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderTopColor: 'rgba(255, 255, 255, 0.7)',
          borderRightColor: 'rgba(255, 255, 255, 0.7)',
          borderBottomColor: 'rgba(255, 255, 255, 0.7)',
          borderLeftColor: 'rgba(255, 255, 255, 0.7)',
          color: 'rgb(61, 49, 71)',
          boxShadow: '0 8px 24px rgba(61, 49, 71, 0.05)',
        };
      },
    };

    applyPdfExportAdjustments(clone);

    expect(nodes[0].style.backgroundColor).toBe('rgba(255, 255, 255, 0.75)');
    expect(nodes[0].style.borderTopColor).toBe('rgba(255, 255, 255, 0.7)');
    expect(nodes[0].style.color).toBe('rgb(61, 49, 71)');
    expect(nodes[0].style.boxShadow).toBe('0 8px 24px rgba(61, 49, 71, 0.05)');

    delete global.window;
  });
});

describe('getPdfWrapperStyle', () => {
  it('keeps the export clone fully opaque so the PDF is readable', () => {
    expect(getPdfWrapperStyle(720)).toMatchObject({
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '2147483647',
      width: '720px',
    });
  });

  it('sizes the PDF as one continuous page matching the report aspect ratio', () => {
    expect(getLongPagePdfSize({ width: 1080, height: 3240 })).toEqual({
      widthMm: 210,
      heightMm: 630,
    });
  });
});
