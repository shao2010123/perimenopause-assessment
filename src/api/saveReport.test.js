import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getReports,
  saveReport,
  submitReport,
  submitReportThenUploadPdf,
  uploadReportPdf,
  uploadReportHtml,
} from './saveReport.js';

function createLocalStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
  };
}

describe('saveReport', () => {
  beforeEach(() => {
    global.window = { localStorage: createLocalStorage() };
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, recordId: 'rec_123' }),
    }));
  });

  it('stores a completed report locally without submitting to Feishu', async () => {
    const report = {
      reportId: 'RPT-001',
      answers: { Q0_NAME: '测试用户' },
      result: { primaryPattern: 'C' },
    };

    const result = await saveReport(report);

    expect(result.remoteSync).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect((await getReports())[0]).toMatchObject({
      reportId: 'RPT-001',
      result: { primaryPattern: 'C' },
    });
  });

  it('submits a completed report to Feishu only when requested', async () => {
    const report = {
      reportId: 'RPT-001',
      answers: { Q0_NAME: '测试用户' },
      result: { primaryPattern: 'C' },
    };

    const first = await submitReport(report);
    const second = await submitReport(report);

    expect(first.remoteSync).toMatchObject({ success: true, recordId: 'rec_123' });
    expect(second.remoteSync).toMatchObject({ success: true, recordId: 'rec_123' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/submit-report', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }));
    expect((await getReports())[0]).toMatchObject({
      reportId: 'RPT-001',
      remoteSync: { success: true, recordId: 'rec_123' },
    });
  });

  it('returns failure when Feishu submission fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: '飞书写入失败' }),
    });
    const report = {
      reportId: 'RPT-001',
      answers: { Q0_NAME: '测试用户' },
      result: { primaryPattern: 'C' },
    };

    const result = await submitReport(report);

    expect(result).toMatchObject({
      success: false,
      reportId: 'RPT-001',
      remoteSync: { success: false, error: '飞书写入失败' },
    });
  });

  it('uploads a generated PDF to the Feishu attachment endpoint', async () => {
    global.FileReader = class FileReaderMock {
      readAsDataURL() {
        this.result = 'data:application/pdf;base64,JVBERi0xLjQ=';
        this.onload();
      }
    };

    const result = await uploadReportPdf({
      reportId: 'RPT-001',
      recordId: 'rec_123',
      pdfBlob: new Blob(['pdf']),
      fileName: 'RPT-001.pdf',
    });

    expect(result).toMatchObject({ success: true, recordId: 'rec_123' });
    expect(fetch).toHaveBeenLastCalledWith('/api/upload-report-pdf', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: 'rec_123',
        reportId: 'RPT-001',
        fileName: 'RPT-001.pdf',
        pdfBase64: 'JVBERi0xLjQ=',
      }),
    }));
  });

  it('rejects oversized PDF uploads before calling Feishu', async () => {
    const result = await uploadReportPdf({
      reportId: 'RPT-001',
      recordId: 'rec_123',
      pdfBlob: { size: 19 * 1024 * 1024 },
      fileName: 'RPT-001.pdf',
    });

    expect(result).toMatchObject({
      success: false,
      error: 'PDF 文件过大，请重新生成后再试',
    });
    expect(fetch).not.toHaveBeenCalledWith('/api/upload-report-pdf', expect.anything());
  });

  it('uploads a generated HTML report to the Feishu attachment endpoint', async () => {
    global.FileReader = class FileReaderMock {
      readAsDataURL() {
        this.result = 'data:text/html;base64,PGh0bWw+PC9odG1sPg==';
        this.onload();
      }
    };

    const result = await uploadReportHtml({
      reportId: 'RPT-001',
      recordId: 'rec_123',
      htmlBlob: new Blob(['<html></html>'], { type: 'text/html' }),
      fileName: 'RPT-001.html',
    });

    expect(result).toMatchObject({ success: true, recordId: 'rec_123' });
    expect(fetch).toHaveBeenLastCalledWith('/api/upload-report-html', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: 'rec_123',
        reportId: 'RPT-001',
        fileName: 'RPT-001.html',
        htmlBase64: 'PGh0bWw+PC9odG1sPg==',
      }),
    }));
  });

  it('submits report data before generating and uploading the HTML report', async () => {
    const calls = [];
    const report = {
      reportId: 'RPT-001',
      answers: { Q0_NAME: '测试用户' },
      result: { primaryPattern: 'C' },
    };
    const submit = vi.fn(async () => {
      calls.push('submit');
      return { success: true, remoteSync: { success: true, recordId: 'rec_123' } };
    });
    const createHtml = vi.fn(async () => {
      calls.push('createHtml');
      return { blob: new Blob(['html']), filename: 'RPT-001.html', openUrl: 'blob:report-html' };
    });
    const uploadHtml = vi.fn(async () => {
      calls.push('uploadHtml');
      return { success: true, recordId: 'rec_123' };
    });

    const result = await submitReportThenUploadPdf({
      reportData: report,
      createPdf: createHtml,
      submit,
      uploadPdf: uploadHtml,
    });

    expect(calls).toEqual(['submit', 'createHtml', 'uploadHtml']);
    expect(result).toMatchObject({
      success: true,
      recordSaved: true,
      pdfUploaded: true,
      reportFileName: 'RPT-001.html',
      reportOpenUrl: 'blob:report-html',
    });
    expect(uploadHtml).toHaveBeenCalledWith({
      reportId: 'RPT-001',
      recordId: 'rec_123',
      pdfBlob: expect.any(Blob),
      fileName: 'RPT-001.html',
    });
  });

  it('keeps the report submitted when PDF generation fails', async () => {
    const report = {
      reportId: 'RPT-001',
      answers: { Q0_NAME: '测试用户' },
      result: { primaryPattern: 'C' },
    };
    const uploadPdf = vi.fn();

    const result = await submitReportThenUploadPdf({
      reportData: report,
      submit: vi.fn(async () => ({
        success: true,
        remoteSync: { success: true, recordId: 'rec_123' },
      })),
      createPdf: vi.fn(async () => {
        throw new Error('PDF生成失败');
      }),
      uploadPdf,
    });

    expect(result).toMatchObject({
      success: false,
      recordSaved: true,
      pdfUploaded: false,
      recordId: 'rec_123',
      error: 'PDF生成失败',
    });
    expect(uploadPdf).not.toHaveBeenCalled();
  });
});
