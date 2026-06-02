import { execFile } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { buildFeishuRecordFields } from '../src/api/feishuPayload.js';

const FEISHU_ORIGIN = 'https://open.feishu.cn';
const DEFAULT_BASE_TOKEN = 'B70ebq5NZabNDqszKATcQAWVnIe';
const DEFAULT_TABLE_ID = 'tblVMk0M7dvCXiv3';
const DEFAULT_PDF_FIELD_ID = 'PDF报告';
const DEFAULT_HTML_FIELD_ID = 'HTML报告';
const execFileAsync = promisify(execFile);

function readEnv(env = globalThis.process?.env ?? {}) {
  return {
    appId: env.FEISHU_APP_ID,
    appSecret: env.FEISHU_APP_SECRET,
    baseToken: env.FEISHU_BASE_TOKEN ?? DEFAULT_BASE_TOKEN,
    tableId: env.FEISHU_TABLE_ID ?? DEFAULT_TABLE_ID,
    pdfFieldId: env.FEISHU_PDF_FIELD_ID ?? DEFAULT_PDF_FIELD_ID,
    htmlFieldId: env.FEISHU_HTML_FIELD_ID ?? DEFAULT_HTML_FIELD_ID,
    cliFallback: env.FEISHU_CLI_FALLBACK !== '0',
  };
}

function assertBaseConfig(config) {
  const missing = Object.entries({ baseToken: config.baseToken, tableId: config.tableId })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`飞书回收配置缺失：${missing.join(', ')}`);
  }
}

function hasAppCredentials(config) {
  return Boolean(config.appId && config.appSecret);
}

function sanitizeFileName(value = 'report') {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 120);
}

async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.code !== undefined && payload.code !== 0)) {
    throw new Error(payload.msg ?? payload.message ?? fallbackMessage);
  }
  return payload;
}

async function getTenantAccessToken(config, fetchImpl) {
  const response = await fetchImpl(`${FEISHU_ORIGIN}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });
  const payload = await readJsonResponse(response, '获取飞书访问令牌失败');
  return payload.tenant_access_token;
}

function getBearerHeaders(tenantAccessToken, extra = {}) {
  return {
    Authorization: `Bearer ${tenantAccessToken}`,
    ...extra,
  };
}

function extractRecordId(payload) {
  const directId =
    payload.data?.record?.record_id ??
    payload.data?.record?.id ??
    payload.data?.record?.record_id_list?.[0] ??
    payload.data?.record_id ??
    payload.data?.id ??
    null;

  if (typeof directId === 'string' && directId) return directId;

  const seen = new Set();
  const findRecordId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value.startsWith('rec') ? value : null;
    if (typeof value !== 'object' || seen.has(value)) return null;

    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const match = findRecordId(item);
        if (match) return match;
      }
      return null;
    }

    const preferredKeys = ['record_id', 'recordId', 'id'];
    for (const key of preferredKeys) {
      const match = findRecordId(value[key]);
      if (match) return match;
    }

    for (const item of Object.values(value)) {
      const match = findRecordId(item);
      if (match) return match;
    }

    return null;
  };

  return (
    findRecordId(payload.data) ??
    findRecordId(payload)
  );
}

async function submitReportWithCli(config, fields, runCli = execFileAsync) {
  const recordId = fields['__record_id'];
  delete fields['__record_id'];

  const args = [
    'base',
    '+record-upsert',
    '--base-token',
    config.baseToken,
    '--table-id',
    config.tableId,
  ];

  if (recordId) {
    args.push('--record-id', recordId);
  }

  args.push('--json', JSON.stringify(fields), '--as', 'user');

  const { stdout } = await runCli('lark-cli', args);
  const payload = JSON.parse(stdout);

  if (payload.ok === false) {
    throw new Error(payload.error ?? payload.message ?? 'lark-cli 写入飞书失败');
  }

  return {
    success: true,
    recordId: extractRecordId(payload),
  };
}

function extractField(payload) {
  return payload.data?.field ?? payload.data ?? payload.field ?? null;
}

function extractFieldName(field, fallback) {
  return field?.field_name ?? field?.name ?? fallback;
}

function extractRecord(payload) {
  return payload.data?.record ?? payload.record ?? payload.data ?? null;
}

function extractAttachmentValues(record, fieldName) {
  const fields = record?.fields ?? record ?? {};
  const value = fields[fieldName];
  return Array.isArray(value) ? value : [];
}

function extractFileToken(payload) {
  return payload.data?.file_token ?? payload.file_token ?? null;
}

function buildAttachmentValue({ file_token: fileToken, name }) {
  return {
    deprecated_set_attachment: true,
    file_token: fileToken,
    name,
  };
}

async function getPdfField(config, tenantAccessToken, fetchImpl) {
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/fields/${config.pdfFieldId}`,
    {
      method: 'GET',
      headers: getBearerHeaders(tenantAccessToken),
    },
  );
  const payload = await readJsonResponse(response, '读取飞书 PDF 附件字段失败');
  return extractField(payload);
}

async function getHtmlField(config, tenantAccessToken, fetchImpl) {
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/fields/${config.htmlFieldId}`,
    {
      method: 'GET',
      headers: getBearerHeaders(tenantAccessToken),
    },
  );
  const payload = await readJsonResponse(response, '读取飞书 HTML 附件字段失败');
  return extractField(payload);
}

async function getBaseRecord(config, tenantAccessToken, recordId, fetchImpl) {
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/records/${recordId}`,
    {
      method: 'GET',
      headers: getBearerHeaders(tenantAccessToken),
    },
  );
  const payload = await readJsonResponse(response, '读取飞书记录失败');
  return extractRecord(payload);
}

async function uploadPdfMedia(config, tenantAccessToken, { safeName, pdfBase64 }, fetchImpl) {
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const formData = new FormData();
  formData.set('file_name', safeName);
  formData.set('parent_type', 'bitable_file');
  formData.set('parent_node', config.baseToken);
  formData.set('size', String(pdfBuffer.byteLength));
  formData.set('file', new Blob([pdfBuffer], { type: 'application/pdf' }), safeName);

  const response = await fetchImpl(`${FEISHU_ORIGIN}/open-apis/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: getBearerHeaders(tenantAccessToken),
    body: formData,
  });
  const payload = await readJsonResponse(response, '上传 PDF 文件到飞书失败');
  const fileToken = extractFileToken(payload);
  if (!fileToken) throw new Error('飞书未返回 PDF 文件 token');
  return fileToken;
}

async function uploadHtmlMedia(config, tenantAccessToken, { safeName, htmlBase64 }, fetchImpl) {
  const htmlBuffer = Buffer.from(htmlBase64, 'base64');
  const formData = new FormData();
  formData.set('file_name', safeName);
  formData.set('parent_type', 'bitable_file');
  formData.set('parent_node', config.baseToken);
  formData.set('size', String(htmlBuffer.byteLength));
  formData.set('file', new Blob([htmlBuffer], { type: 'text/html' }), safeName);

  const response = await fetchImpl(`${FEISHU_ORIGIN}/open-apis/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: getBearerHeaders(tenantAccessToken),
    body: formData,
  });
  const payload = await readJsonResponse(response, '上传 HTML 文件到飞书失败');
  const fileToken = extractFileToken(payload);
  if (!fileToken) throw new Error('飞书未返回 HTML 文件 token');
  return fileToken;
}

async function patchPdfAttachment(config, tenantAccessToken, { recordId, fieldName, attachments }, fetchImpl) {
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/records/${recordId}`,
    {
      method: 'PATCH',
      headers: getBearerHeaders(tenantAccessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        [fieldName]: attachments,
      }),
    },
  );
  await readJsonResponse(response, '写入飞书 PDF 附件字段失败');
}

async function patchHtmlAttachment(config, tenantAccessToken, { recordId, fieldName, attachments }, fetchImpl) {
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/records/${recordId}`,
    {
      method: 'PATCH',
      headers: getBearerHeaders(tenantAccessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        [fieldName]: attachments,
      }),
    },
  );
  await readJsonResponse(response, '写入飞书 HTML 附件字段失败');
}

async function uploadReportPdfWithOpenApi(config, payload, fetchImpl) {
  const tenantAccessToken = await getTenantAccessToken(config, fetchImpl);
  const safeName = sanitizeFileName(payload.fileName || `${payload.reportId || payload.recordId}.pdf`);
  const pdfName = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
  const field = await getPdfField(config, tenantAccessToken, fetchImpl);
  const fieldName = extractFieldName(field, config.pdfFieldId);
  const record = await getBaseRecord(config, tenantAccessToken, payload.recordId, fetchImpl);
  const existingAttachments = extractAttachmentValues(record, fieldName);
  const fileToken = await uploadPdfMedia(config, tenantAccessToken, { safeName: pdfName, pdfBase64: payload.pdfBase64 }, fetchImpl);
  const attachments = [
    ...existingAttachments,
    { file_token: fileToken, name: pdfName },
  ].map(buildAttachmentValue);
  await patchPdfAttachment(config, tenantAccessToken, {
    recordId: payload.recordId,
    fieldName,
    attachments,
  }, fetchImpl);
  return { success: true, recordId: payload.recordId };
}

async function uploadReportHtmlWithOpenApi(config, payload, fetchImpl) {
  const tenantAccessToken = await getTenantAccessToken(config, fetchImpl);
  const safeName = sanitizeFileName(payload.fileName || `${payload.reportId || payload.recordId}.html`);
  const htmlName = safeName.endsWith('.html') ? safeName : `${safeName}.html`;
  const field = await getHtmlField(config, tenantAccessToken, fetchImpl);
  const fieldName = extractFieldName(field, config.htmlFieldId);
  const record = await getBaseRecord(config, tenantAccessToken, payload.recordId, fetchImpl);
  const existingAttachments = extractAttachmentValues(record, fieldName);
  const fileToken = await uploadHtmlMedia(config, tenantAccessToken, { safeName: htmlName, htmlBase64: payload.htmlBase64 }, fetchImpl);
  const attachments = [
    ...existingAttachments,
    { file_token: fileToken, name: htmlName },
  ].map(buildAttachmentValue);
  await patchHtmlAttachment(config, tenantAccessToken, {
    recordId: payload.recordId,
    fieldName,
    attachments,
  }, fetchImpl);
  return { success: true, recordId: payload.recordId };
}

export async function uploadReportPdfToFeishu({ recordId, reportId, fileName, pdfBase64 }, options = {}) {
  const config = readEnv(options.env);
  assertBaseConfig(config);

  if (!recordId) throw new Error('缺少飞书记录 ID，无法上传 PDF');
  if (!pdfBase64) throw new Error('缺少 PDF 文件内容');

  if (hasAppCredentials(config)) {
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new Error('当前运行环境不支持 fetch');
    }
    return uploadReportPdfWithOpenApi(config, { recordId, reportId, fileName, pdfBase64 }, fetchImpl);
  }

  const runCli = options.runCli ?? execFileAsync;
  const tempDir = join('tmp', `perimenopause-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const safeName = sanitizeFileName(fileName || `${reportId || recordId}.pdf`);
  const pdfPath = join(tempDir, safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(pdfPath, Buffer.from(pdfBase64, 'base64'));
    const { stdout } = await runCli('lark-cli', [
      'base',
      '+record-upload-attachment',
      '--base-token',
      config.baseToken,
      '--table-id',
      config.tableId,
      '--record-id',
      recordId,
      '--field-id',
      config.pdfFieldId,
      '--file',
      pdfPath,
      '--name',
      safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`,
      '--as',
      'user',
    ]);
    const payload = JSON.parse(stdout);

    if (payload.ok === false) {
      throw new Error(payload.error ?? payload.message ?? 'lark-cli 上传 PDF 失败');
    }

    return { success: true, recordId };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function uploadReportHtmlToFeishu({ recordId, reportId, fileName, htmlBase64 }, options = {}) {
  const config = readEnv(options.env);
  assertBaseConfig(config);

  if (!recordId) throw new Error('缺少飞书记录 ID，无法上传 HTML');
  if (!htmlBase64) throw new Error('缺少 HTML 文件内容');

  if (hasAppCredentials(config)) {
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new Error('当前运行环境不支持 fetch');
    }
    return uploadReportHtmlWithOpenApi(config, { recordId, reportId, fileName, htmlBase64 }, fetchImpl);
  }

  const runCli = options.runCli ?? execFileAsync;
  const tempDir = join('tmp', `perimenopause-html-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const safeName = sanitizeFileName(fileName || `${reportId || recordId}.html`);
  const htmlPath = join(tempDir, safeName.endsWith('.html') ? safeName : `${safeName}.html`);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(htmlPath, Buffer.from(htmlBase64, 'base64'));
    const { stdout } = await runCli('lark-cli', [
      'base',
      '+record-upload-attachment',
      '--base-token',
      config.baseToken,
      '--table-id',
      config.tableId,
      '--record-id',
      recordId,
      '--field-id',
      config.htmlFieldId,
      '--file',
      htmlPath,
      '--name',
      safeName.endsWith('.html') ? safeName : `${safeName}.html`,
      '--as',
      'user',
    ]);
    const payload = JSON.parse(stdout);

    if (payload.ok === false) {
      throw new Error(payload.error ?? payload.message ?? 'lark-cli 上传 HTML 失败');
    }

    return { success: true, recordId };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function submitReportToFeishu(snapshot, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const config = readEnv(options.env);
  assertBaseConfig(config);
  const fields = buildFeishuRecordFields(snapshot);
  const existingRecordId = snapshot.remoteSync?.recordId;
  if (existingRecordId) fields['__record_id'] = existingRecordId;

  if (!hasAppCredentials(config)) {
    if (!config.cliFallback) throw new Error('飞书回收配置缺失：appId, appSecret');
    return submitReportWithCli(config, fields, options.runCli);
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('当前运行环境不支持 fetch');
  }

  const tenantAccessToken = await getTenantAccessToken(config, fetchImpl);
  const response = await fetchImpl(
    `${FEISHU_ORIGIN}/open-apis/base/v3/bases/${config.baseToken}/tables/${config.tableId}/records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    },
  );
  const payload = await readJsonResponse(response, '写入飞书多维表格失败');
  const recordId = extractRecordId(payload);
  if (!recordId) throw new Error('飞书未返回记录 ID，无法继续上传报告');

  return {
    success: true,
    recordId,
  };
}
