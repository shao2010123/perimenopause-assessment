function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createOpenUrl(blob) {
  return URL.createObjectURL(blob);
}

function getPageStyles() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules ?? []).map((rule) => rule.cssText).join('\n');
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

function buildHtmlDocument({ title, bodyClass, reportHtml, styles }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${styles}</style>
  <style>
    body { min-height: 100vh; }
    .report-html-shell { width: min(100%, 64rem); margin: 0 auto; padding: 20px 16px 48px; }
    @media (min-width: 640px) { .report-html-shell { padding: 32px 24px 64px; } }
  </style>
</head>
<body class="${bodyClass}">
  <main class="report-html-shell">
${reportHtml}
  </main>
</body>
</html>
`;
}

export function applyHtmlExportAdjustments(clone) {
  const removedActionContainers = new Set();
  clone.querySelectorAll('[data-pdf-hidden]').forEach((node) => {
    if (node.parentElement) removedActionContainers.add(node.parentElement);
    node.remove();
  });

  removedActionContainers.forEach((node) => {
    if (!node.textContent?.trim() && node.children.length === 0) {
      node.remove();
    }
  });

  clone.querySelectorAll('[data-report-phone]').forEach((node) => node.remove());
  clone.querySelectorAll('details').forEach((node) => {
    if (String(node.className).includes('group rounded-[10px]')) {
      node.open = false;
    }
  });
}

export function exportReportToHtml({ target, userInfo, reportId }) {
  const clone = target.cloneNode(true);
  applyHtmlExportAdjustments(clone);

  const filename = `${userInfo?.name || '围绝经期'}-${reportId || '健康测评报告'}.html`;
  const html = buildHtmlDocument({
    title: document.title || '围绝经期健康测评报告',
    bodyClass: document.body.className,
    reportHtml: clone.outerHTML,
    styles: getPageStyles(),
  });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, filename);
  return { blob, filename, openUrl: createOpenUrl(blob) };
}
