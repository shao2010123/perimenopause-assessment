import { useState } from 'react';
import { submitReportThenUploadPdf } from '../api/saveReport.js';
import { isRequiredPhoneFilled } from '../utils/contactValidation.js';
import { exportReportToPdf } from '../utils/pdfExport.js';

function PdfExport({ targetRef, userInfo, reportId, createdAt, answers, result }) {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState(null);
  const canExport = isRequiredPhoneFilled(userInfo?.phone);

  async function handleExport() {
    if (!targetRef.current || isExporting || !canExport) return;

    setIsExporting(true);
    setStatus(null);

    try {
      const syncResult = await submitReportThenUploadPdf({
        reportData: {
          reportId,
          createdAt,
          userInfo,
          answers,
          result,
        },
        createPdf: () => exportReportToPdf({
          target: targetRef.current,
          userInfo,
          reportId,
        }),
      });

      if (!syncResult.success) {
        setStatus({
          type: 'error',
          message: syncResult.recordSaved ? `PDF保存失败：${syncResult.error}` : syncResult.error,
        });
        return;
      }

      setStatus({ type: 'success', message: 'PDF已保存，并已同步到飞书回收表。' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'PDF保存失败，请稍后重试。',
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex-1 space-y-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting || !canExport}
        className="primary-outline-button w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? '正在保存 PDF...' : canExport ? '保存PDF报告' : '填写手机号后保存PDF报告'}
      </button>
      {status ? (
        <p
          className={`text-xs leading-5 ${
            status.type === 'success' ? 'text-[#4B8F61]' : 'text-[var(--color-accent-coral)]'
          }`}
          role="status"
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

export default PdfExport;
