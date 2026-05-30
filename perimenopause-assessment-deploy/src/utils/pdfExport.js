import { DISCLAIMER } from '../data/constants.js';
import { getAllRefsForPDF } from '../data/references.js';
import html2pdfModule from 'html2pdf.js';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildReferencesSection() {
  const refs = getAllRefsForPDF();
  let html = `
    <section style="page-break-before: always; padding: 40px 30px; background: #ffffff; min-height: 1120px; box-sizing: border-box;">
      <h2 style="font-size: 16px; color: #4A3B5C; margin-bottom: 20px; border-bottom: 2px solid #E8C4C4; padding-bottom: 8px;">
        参考文献
      </h2>
      <div style="font-size: 10px; color: #7B6B8A; line-height: 1.8;">
  `;

  refs.forEach((ref) => {
    const parts = [];
    parts.push(`[${escapeHtml(ref.id)}]`);
    if (ref.authors) parts.push(escapeHtml(ref.authors));
    if (ref.title) parts.push(`<i>${escapeHtml(ref.title)}</i>`);
    if (ref.journal) parts.push(escapeHtml(ref.journal));
    if (ref.year) parts.push(escapeHtml(ref.year));
    if (ref.volume) parts.push(escapeHtml(ref.volume));
    if (ref.pmid) parts.push(`PMID: ${escapeHtml(ref.pmid)}`);
    if (ref.pmc) parts.push(escapeHtml(ref.pmc));

    html += `
      <p style="margin-bottom: 6px; text-indent: -2em; padding-left: 2em;">
        ${parts.join('. ')}.
      </p>
    `;
  });

  html += `
      </div>
    </section>
  `;

  return html;
}

export function buildDisclaimerSection() {
  return `
    <section style="page-break-before: always; padding: 40px 30px; background: #ffffff; min-height: 1120px; box-sizing: border-box;">
      <h2 style="font-size: 16px; color: #4A3B5C; margin-bottom: 20px; border-bottom: 2px solid #E8C4C4; padding-bottom: 8px;">
        免责声明
      </h2>
      <p style="font-size: 12px; color: #7B6B8A; line-height: 1.9;">
        ${escapeHtml(DISCLAIMER)}
      </p>
    </section>
  `;
}

function preparePdfNode(target, userInfo = {}) {
  const wrapper = document.createElement('div');
  const clone = target.cloneNode(true);
  const width = Math.max(Math.ceil(target.getBoundingClientRect().width), 720);

  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${width}px`;
  wrapper.style.background = '#ffffff';
  wrapper.style.zIndex = '-1';

  wrapper.appendChild(clone);

  const phoneContainer = clone.querySelector('[data-report-phone]');
  const phoneValueNode = phoneContainer?.querySelector('.report-phone-value');
  if (phoneValueNode && userInfo.phone) {
    phoneValueNode.textContent = userInfo.phone;
  }

  clone.querySelectorAll('[data-pdf-disclaimer]').forEach((node) => node.remove());

  const appendix = document.createElement('div');
  appendix.innerHTML = `${buildReferencesSection()}${buildDisclaimerSection()}`;
  clone.append(...appendix.children);

  document.body.appendChild(wrapper);
  return wrapper;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportReportToPdf({ target, userInfo, reportId }) {
  const wrapper = preparePdfNode(target, userInfo);
  const filename = `${userInfo?.name || '围绝经期'}-${reportId || '健康测评报告'}.pdf`;

  try {
    const html2pdf = html2pdfModule.default ?? html2pdfModule;

    const worker = html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.82 },
        html2canvas: { scale: 1.35 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(wrapper);
    const pdfBlob = await worker.outputPdf('blob');
    downloadBlob(pdfBlob, filename);
    return { blob: pdfBlob, filename };
  } finally {
    wrapper.remove();
  }
}
