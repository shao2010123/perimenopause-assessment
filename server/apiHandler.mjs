import { submitReportToFeishu, uploadReportHtmlToFeishu, uploadReportPdfToFeishu } from './submitReport.mjs';

async function readRequestBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
  }
  return {
    bytes: Buffer.byteLength(raw),
    payload: raw ? JSON.parse(raw) : {},
  };
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function createSubmitReportHandler({ submitReport = submitReportToFeishu } = {}) {
  return async function submitReportHandler(request, response) {
    if (request.method !== 'POST') {
      sendJson(response, 405, { success: false, error: '仅支持 POST 提交' });
      return;
    }

    try {
      const { bytes, payload: snapshot } = await readRequestBody(request);
      console.log(`[submit-report] received ${bytes} bytes reportId=${snapshot.reportId ?? ''}`);
      const result = await submitReport(snapshot);
      console.log(`[submit-report] result success=${result.success} recordId=${result.recordId ?? ''}`);
      sendJson(response, 200, result);
    } catch (error) {
      console.error('[submit-report] failed', error);
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : '提交飞书失败',
      });
    }
  };
}

export function createUploadReportPdfHandler({ uploadReportPdf = uploadReportPdfToFeishu } = {}) {
  return async function uploadReportPdfHandler(request, response) {
    if (request.method !== 'POST') {
      sendJson(response, 405, { success: false, error: '仅支持 POST 提交' });
      return;
    }

    try {
      const { bytes, payload } = await readRequestBody(request);
      console.log(
        `[upload-report-pdf] received ${bytes} bytes reportId=${payload.reportId ?? ''} recordId=${payload.recordId ?? ''} fileName=${payload.fileName ?? ''}`,
      );
      const result = await uploadReportPdf(payload);
      console.log(`[upload-report-pdf] result success=${result.success} recordId=${result.recordId ?? ''}`);
      sendJson(response, 200, result);
    } catch (error) {
      console.error('[upload-report-pdf] failed', error);
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : '上传 PDF 到飞书失败',
      });
    }
  };
}

export function createUploadReportHtmlHandler({ uploadReportHtml = uploadReportHtmlToFeishu } = {}) {
  return async function uploadReportHtmlHandler(request, response) {
    if (request.method !== 'POST') {
      sendJson(response, 405, { success: false, error: '仅支持 POST 提交' });
      return;
    }

    try {
      const { bytes, payload } = await readRequestBody(request);
      console.log(
        `[upload-report-html] received ${bytes} bytes reportId=${payload.reportId ?? ''} recordId=${payload.recordId ?? ''} fileName=${payload.fileName ?? ''}`,
      );
      const result = await uploadReportHtml(payload);
      console.log(`[upload-report-html] result success=${result.success} recordId=${result.recordId ?? ''}`);
      sendJson(response, 200, result);
    } catch (error) {
      console.error('[upload-report-html] failed', error);
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : '上传 HTML 到飞书失败',
      });
    }
  };
}

export const submitReportHandler = createSubmitReportHandler();
export const uploadReportPdfHandler = createUploadReportPdfHandler();
export const uploadReportHtmlHandler = createUploadReportHtmlHandler();
