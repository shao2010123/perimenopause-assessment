const COLOR_PROPERTIES = [
  ['backgroundColor', 'rgba(255, 255, 255, 0.7)'],
  ['borderTopColor', 'rgba(255, 255, 255, 0.7)'],
  ['borderRightColor', 'rgba(255, 255, 255, 0.7)'],
  ['borderBottomColor', 'rgba(255, 255, 255, 0.7)'],
  ['borderLeftColor', 'rgba(255, 255, 255, 0.7)'],
  ['caretColor', 'auto'],
  ['color', '#3d3147'],
  ['outlineColor', 'transparent'],
  ['textDecorationColor', 'currentColor'],
];

function hasUnsupportedColorFunction(value) {
  return typeof value === 'string' && /\b(?:color-mix|oklab|oklch)\(/i.test(value);
}

function getSupportedColor(value, fallback) {
  if (!value || hasUnsupportedColorFunction(value)) return fallback;
  return value;
}

function getSupportedShadow(value) {
  if (!value || hasUnsupportedColorFunction(value)) return 'none';
  return value;
}

function sanitizeInlineStyles(clone) {
  clone.querySelectorAll('*').forEach((node) => {
    if (!node.style) return;
    const computed = typeof window !== 'undefined' && window.getComputedStyle
      ? window.getComputedStyle(node)
      : null;

    COLOR_PROPERTIES.forEach(([property, fallback]) => {
      node.style[property] = getSupportedColor(computed?.[property] ?? node.style[property], fallback);
    });
    node.style.borderColor = getSupportedColor(computed?.borderColor ?? node.style.borderColor, 'rgba(255, 255, 255, 0.7)');

    node.style.boxShadow = getSupportedShadow(computed?.boxShadow ?? node.style.boxShadow);
    node.style.textShadow = getSupportedShadow(computed?.textShadow ?? node.style.textShadow);
  });
}

export function applyPdfExportAdjustments(clone, userInfo = {}) {
  clone.querySelectorAll('details').forEach((node) => {
    node.open = true;
  });

  sanitizeInlineStyles(clone);

  const phoneContainer = clone.querySelector('[data-report-phone]');
  const phoneValueNode = phoneContainer?.querySelector('.report-phone-value');
  if (phoneValueNode && userInfo.phone) {
    phoneValueNode.textContent = userInfo.phone;
  }

  clone.querySelectorAll('[data-pdf-hidden]').forEach((node) => node.remove());
  clone.querySelectorAll('[data-pdf-disclaimer]').forEach((node) => node.remove());
}
