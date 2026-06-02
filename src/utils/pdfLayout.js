export function getPdfWrapperStyle(width) {
  return {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${width}px`,
    background: '#ffffff',
    opacity: '1',
    pointerEvents: 'none',
    zIndex: '2147483647',
  };
}

export function getLongPagePdfSize({ width, height }, widthMm = 210) {
  const safeWidth = Math.max(Number(width) || 1, 1);
  const safeHeight = Math.max(Number(height) || safeWidth, 1);

  return {
    widthMm,
    heightMm: Math.round((safeHeight / safeWidth) * widthMm),
  };
}
