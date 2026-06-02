import { describe, expect, it, vi } from 'vitest';
import { testCases } from '../src/test/testCases.js';
import { calculate } from '../src/engine/calculator.js';
import { submitReportToFeishu, uploadReportHtmlToFeishu, uploadReportPdfToFeishu } from './submitReport.mjs';

describe('submitReportToFeishu', () => {
  it('exchanges app credentials and creates a Feishu base record', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, tenant_access_token: 'tenant_token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { record: { record_id_list: ['rec_abc'] } } }),
      });

    const result = await submitReportToFeishu(
      {
        reportId: 'RPT-SERVER-001',
        createdAt: '2026-05-29T08:30:00.000Z',
        userInfo: { name: '林女士', birthYear: 1984 },
        answers: testCases.case1,
        result: calculate(testCases.case1),
      },
      {
        fetchImpl,
        env: {
          FEISHU_APP_ID: 'cli_test_app',
          FEISHU_APP_SECRET: 'secret',
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_abc' });
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://open.feishu.cn/open-apis/base/v3/bases/base_token/tables/table_id/records',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer tenant_token' }),
      }),
    );
    const recordBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(recordBody['报告编号']).toBe('RPT-SERVER-001');
    expect(recordBody['姓名昵称']).toBe('林女士');
  });

  it('falls back to lark-cli when app credentials are not configured', async () => {
    const runCli = vi.fn(async () => ({
      stdout: JSON.stringify({
        ok: true,
        data: { record: { record_id_list: ['rec_cli'], fields: ['报告编号'], data: [['RPT-CLI-001']] } },
      }),
    }));

    const result = await submitReportToFeishu(
      {
        reportId: 'RPT-CLI-001',
        createdAt: '2026-05-29T08:30:00.000Z',
        userInfo: { name: '林女士', birthYear: 1984 },
        answers: testCases.case1,
        result: calculate(testCases.case1),
      },
      {
        runCli,
        env: {
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_cli' });
    expect(runCli).toHaveBeenCalledWith('lark-cli', [
      'base',
      '+record-upsert',
      '--base-token',
      'base_token',
      '--table-id',
      'table_id',
      '--json',
      expect.stringContaining('RPT-CLI-001'),
      '--as',
      'user',
    ]);
  });

  it('updates an existing CLI-created record when remote record id is provided', async () => {
    const runCli = vi.fn(async () => ({
      stdout: JSON.stringify({
        ok: true,
        data: { record: { record_id_list: ['rec_existing'] } },
      }),
    }));

    const result = await submitReportToFeishu(
      {
        reportId: 'RPT-CLI-UPDATE',
        remoteSync: { success: true, recordId: 'rec_existing' },
        createdAt: '2026-05-29T08:30:00.000Z',
        userInfo: { name: '林女士', birthYear: 1984, phone: '13800138000' },
        answers: testCases.case1,
        result: calculate(testCases.case1),
      },
      {
        runCli,
        env: {
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_existing' });
    expect(runCli).toHaveBeenCalledWith('lark-cli', expect.arrayContaining([
      '+record-upsert',
      '--record-id',
      'rec_existing',
    ]));
  });
});

describe('uploadReportPdfToFeishu', () => {
  it('uploads and attaches a PDF through Feishu OpenAPI when app credentials are configured', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, tenant_access_token: 'tenant_token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { field: { field_name: 'PDF报告', type: 17 } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { record: { fields: { PDF报告: [{ file_token: 'old_file', name: 'old.pdf' }] } } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0, data: { file_token: 'new_file' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 0 }),
      });
    const runCli = vi.fn();

    const result = await uploadReportPdfToFeishu(
      {
        recordId: 'rec_pdf',
        reportId: 'RPT-PDF-OPENAPI',
        fileName: '林女士-RPT-PDF-OPENAPI.pdf',
        pdfBase64: Buffer.from('%PDF-1.4 test').toString('base64'),
      },
      {
        fetchImpl,
        runCli,
        env: {
          FEISHU_APP_ID: 'cli_test_app',
          FEISHU_APP_SECRET: 'secret',
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
          FEISHU_PDF_FIELD_ID: 'fld_pdf',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_pdf' });
    expect(runCli).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://open.feishu.cn/open-apis/base/v3/bases/base_token/tables/table_id/fields/fld_pdf',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer tenant_token' }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      'https://open.feishu.cn/open-apis/drive/v1/medias/upload_all',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer tenant_token' }),
      }),
    );
    const patchedFields = JSON.parse(fetchImpl.mock.calls[4][1].body).fields;
    expect(patchedFields['PDF报告']).toEqual([
      { file_token: 'old_file', name: 'old.pdf' },
      { file_token: 'new_file', name: '林女士-RPT-PDF-OPENAPI.pdf' },
    ]);
  });

  it('uploads a PDF file to the configured attachment field', async () => {
    const runCli = vi.fn(async () => ({
      stdout: JSON.stringify({ ok: true }),
    }));

    const result = await uploadReportPdfToFeishu(
      {
        recordId: 'rec_pdf',
        reportId: 'RPT-PDF-001',
        fileName: '林女士-RPT-PDF-001.pdf',
        pdfBase64: Buffer.from('%PDF-1.4 test').toString('base64'),
      },
      {
        runCli,
        env: {
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
          FEISHU_PDF_FIELD_ID: 'PDF报告',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_pdf' });
    expect(runCli).toHaveBeenCalledWith('lark-cli', expect.arrayContaining([
      '+record-upload-attachment',
      '--record-id',
      'rec_pdf',
      '--field-id',
      'PDF报告',
      '--name',
      '林女士-RPT-PDF-001.pdf',
    ]));
  });
});

describe('uploadReportHtmlToFeishu', () => {
  it('uploads an HTML file to the configured attachment field', async () => {
    const runCli = vi.fn(async () => ({
      stdout: JSON.stringify({ ok: true }),
    }));

    const result = await uploadReportHtmlToFeishu(
      {
        recordId: 'rec_html',
        reportId: 'RPT-HTML-001',
        fileName: '林女士-RPT-HTML-001.html',
        htmlBase64: Buffer.from('<!doctype html><html></html>').toString('base64'),
      },
      {
        runCli,
        env: {
          FEISHU_BASE_TOKEN: 'base_token',
          FEISHU_TABLE_ID: 'table_id',
          FEISHU_HTML_FIELD_ID: 'HTML报告',
        },
      },
    );

    expect(result).toEqual({ success: true, recordId: 'rec_html' });
    expect(runCli).toHaveBeenCalledWith('lark-cli', expect.arrayContaining([
      '+record-upload-attachment',
      '--record-id',
      'rec_html',
      '--field-id',
      'HTML报告',
      '--name',
      '林女士-RPT-HTML-001.html',
    ]));
  });
});
