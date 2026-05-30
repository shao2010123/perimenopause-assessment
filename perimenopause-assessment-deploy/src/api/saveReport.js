const REPORTS_KEY = 'perimenopause_reports';
const MAX_UPLOAD_PDF_BYTES = 15 * 1024 * 1024;

function readReports() {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(window.localStorage.getItem(REPORTS_KEY) || '[]');
  } catch {
    return [];
  }
}

async function submitReportToRemote(reportData, existingReport) {
  if (!reportData?.result || typeof fetch !== 'function') {
    return existingReport?.remoteSync ?? null;
  }

  if (existingReport?.remoteSync?.success) {
    return existingReport.remoteSync;
  }

  try {
    const response = await fetch('/api/submit-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      return {
        success: false,
        error: payload.error ?? `HTTP ${response.status}`,
        syncedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      recordId: payload.recordId ?? null,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '提交失败',
      syncedAt: new Date().toISOString(),
    };
  }
}

export async function saveReport(reportData) {
  if (typeof window === 'undefined') {
    return { success: false, reportId: reportData?.reportId ?? null };
  }

  const existing = readReports();
  const existingReport = existing.find((item) => item.reportId === reportData.reportId);
  const reportWithSync = existingReport?.remoteSync
    ? { ...reportData, remoteSync: existingReport.remoteSync }
    : reportData;
  const nextReports = existingReport
    ? existing.map((item) => (item.reportId === reportData.reportId ? reportWithSync : item))
    : [reportWithSync, ...existing];

  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(nextReports));
  return { success: true, reportId: reportData.reportId, remoteSync: reportWithSync.remoteSync ?? null };
}

export async function submitReport(reportData) {
  if (typeof window === 'undefined') {
    return { success: false, reportId: reportData?.reportId ?? null };
  }

  const existing = readReports();
  const existingReport = existing.find((item) => item.reportId === reportData.reportId);
  const remoteSync = await submitReportToRemote(reportData, existingReport);
  const reportWithSync = remoteSync ? { ...reportData, remoteSync } : reportData;
  const nextReports = existingReport
    ? existing.map((item) => (item.reportId === reportData.reportId ? reportWithSync : item))
    : [reportWithSync, ...existing];

  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(nextReports));
  return { success: remoteSync?.success === true, reportId: reportData.reportId, remoteSync };
}

export async function getReports() {
  return readReports();
}

export function clearReports() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REPORTS_KEY);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('PDF 读取失败'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadReportPdf({ reportId, recordId, pdfBlob, fileName }) {
  if (!recordId || !pdfBlob || typeof fetch !== 'function') {
    return { success: false, error: '缺少飞书记录或 PDF 文件' };
  }

  if (Number(pdfBlob.size) > MAX_UPLOAD_PDF_BYTES) {
    return { success: false, error: 'PDF 文件过大，请重新生成后再试' };
  }

  try {
    const pdfBase64 = await blobToBase64(pdfBlob);
    const response = await fetch('/api/upload-report-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId,
        reportId,
        fileName,
        pdfBase64,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
      return {
        success: false,
        error: payload.error ?? `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      recordId: payload.recordId ?? recordId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF 上传失败',
    };
  }
}

export async function submitReportThenUploadPdf({
  reportData,
  createPdf,
  submit = submitReport,
  uploadPdf = uploadReportPdf,
}) {
  const saveResult = await submit(reportData);
  const recordId = saveResult.remoteSync?.recordId;

  if (!saveResult.success || !recordId) {
    return {
      success: false,
      recordSaved: false,
      pdfUploaded: false,
      error: saveResult.remoteSync?.error ?? '飞书记录保存失败',
    };
  }

  try {
    const pdf = await createPdf();
    const uploadResult = await uploadPdf({
      reportId: reportData.reportId,
      recordId,
      pdfBlob: pdf?.blob,
      fileName: pdf?.filename,
    });

    if (!uploadResult.success) {
      return {
        success: false,
        recordSaved: true,
        pdfUploaded: false,
        recordId,
        error: uploadResult.error ?? 'PDF 上传失败',
      };
    }

    return {
      success: true,
      recordSaved: true,
      pdfUploaded: true,
      recordId,
    };
  } catch (error) {
    return {
      success: false,
      recordSaved: true,
      pdfUploaded: false,
      recordId,
      error: error instanceof Error ? error.message : 'PDF保存失败，请稍后重试。',
    };
  }
}
