import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import {
  createSubmitReportHandler,
  createUploadReportHtmlHandler,
  createUploadReportPdfHandler,
} from './apiHandler.mjs';

function createRequest(method, body) {
  const request = Readable.from(body ? [JSON.stringify(body)] : []);
  request.method = method;
  return request;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value = '') {
      this.body += value;
    },
  };
}

describe('createSubmitReportHandler', () => {
  it('accepts POST JSON and returns the Feishu record id', async () => {
    const submitReport = vi.fn(async () => ({ success: true, recordId: 'rec_456' }));
    const handler = createSubmitReportHandler({ submitReport });
    const response = createResponse();

    await handler(createRequest('POST', { reportId: 'RPT-API-001' }), response);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true, recordId: 'rec_456' });
    expect(submitReport).toHaveBeenCalledWith({ reportId: 'RPT-API-001' });
  });

  it('rejects non-POST requests', async () => {
    const handler = createSubmitReportHandler({ submitReport: vi.fn() });
    const response = createResponse();

    await handler(createRequest('GET'), response);

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toMatchObject({ success: false });
  });
});

describe('createUploadReportPdfHandler', () => {
  it('accepts POST JSON and uploads a PDF attachment', async () => {
    const uploadReportPdf = vi.fn(async () => ({ success: true, recordId: 'rec_456' }));
    const handler = createUploadReportPdfHandler({ uploadReportPdf });
    const response = createResponse();

    await handler(
      createRequest('POST', {
        recordId: 'rec_456',
        reportId: 'RPT-API-001',
        pdfBase64: 'JVBERi0xLjQ=',
      }),
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true, recordId: 'rec_456' });
    expect(uploadReportPdf).toHaveBeenCalledWith({
      recordId: 'rec_456',
      reportId: 'RPT-API-001',
      pdfBase64: 'JVBERi0xLjQ=',
    });
  });
});

describe('createUploadReportHtmlHandler', () => {
  it('accepts POST JSON and uploads an HTML attachment', async () => {
    const uploadReportHtml = vi.fn(async () => ({ success: true, recordId: 'rec_456' }));
    const handler = createUploadReportHtmlHandler({ uploadReportHtml });
    const response = createResponse();

    await handler(
      createRequest('POST', {
        recordId: 'rec_456',
        reportId: 'RPT-API-001',
        htmlBase64: 'PGh0bWw+PC9odG1sPg==',
      }),
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ success: true, recordId: 'rec_456' });
    expect(uploadReportHtml).toHaveBeenCalledWith({
      recordId: 'rec_456',
      reportId: 'RPT-API-001',
      htmlBase64: 'PGh0bWw+PC9odG1sPg==',
    });
  });
});
