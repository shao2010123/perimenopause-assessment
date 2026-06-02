import { useState } from 'react';
import { submitReportThenUploadPdf, uploadReportHtml } from '../api/saveReport.js';
import { isRequiredPhoneFilled } from '../utils/contactValidation.js';
import { exportReportToHtml } from '../utils/htmlExport.js';
import { buildHtmlSavedParts, HTML_BUSY_ERROR_MESSAGE } from '../utils/pdfStatusMessage.js';

function PdfExport({ targetRef, userInfo, reportId, createdAt, answers, result }) {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState(null);
  const canExport = isRequiredPhoneFilled(userInfo?.phone);
  const filename = `${userInfo?.name || '围绝经期'}-${reportId || '健康测评报告'}.html`;

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
        createPdf: () => exportReportToHtml({
          target: targetRef.current,
          userInfo,
          reportId,
        }),
        uploadPdf: ({ reportId: uploadReportId, recordId, pdfBlob, fileName }) => uploadReportHtml({
          reportId: uploadReportId,
          recordId,
          htmlBlob: pdfBlob,
          fileName,
        }),
      });

      if (!syncResult.success) {
        setStatus({
          type: 'error',
          message: HTML_BUSY_ERROR_MESSAGE,
        });
        return;
      }

      setStatus({
        type: 'success',
        messageParts: buildHtmlSavedParts(syncResult.reportFileName || filename),
        openUrl: syncResult.reportOpenUrl,
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: HTML_BUSY_ERROR_MESSAGE,
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
        {isExporting ? '正在保存 HTML...' : canExport ? '保存HTML报告' : '填写手机号后保存HTML报告'}
      </button>
      {status ? (
        <p
          className={`text-xs leading-5 ${
            status.type === 'success' ? 'text-[#4B8F61]' : 'text-[var(--color-accent-coral)]'
          }`}
          role="status"
        >
          {status.type === 'success' && status.messageParts ? (
            <>
              {status.messageParts.prefix}
              {status.openUrl ? (
                <a
                  href={status.openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#2F7D4B] underline decoration-[#4B8F61]/45 underline-offset-2"
                >
                  {status.messageParts.filename}
                </a>
              ) : (
                <span className="font-semibold text-[#2F7D4B]">{status.messageParts.filename}</span>
              )}
              {status.messageParts.suffix}
            </>
          ) : (
            status.message
          )}
        </p>
      ) : null}
    </div>
  );
}

export default PdfExport;
