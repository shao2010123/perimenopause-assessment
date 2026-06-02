import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { submitReportHandler, uploadReportHtmlHandler, uploadReportPdfHandler } from './apiHandler.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = join(rootDir, 'dist');
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname);
  const safePath = requestedPath === '/' ? '/index.html' : requestedPath;
  let filePath = resolve(join(distDir, safePath));

  if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
    filePath = join(distDir, 'index.html');
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    response.statusCode = 404;
    response.end('Not found');
    return;
  }

  response.setHeader('Content-Type', mimeTypes[extname(filePath)] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
  if (request.url?.startsWith('/api/submit-report')) {
    submitReportHandler(request, response);
    return;
  }

  if (request.url?.startsWith('/api/upload-report-pdf')) {
    uploadReportPdfHandler(request, response);
    return;
  }

  if (request.url?.startsWith('/api/upload-report-html')) {
    uploadReportHtmlHandler(request, response);
    return;
  }

  serveStatic(request, response).catch((error) => {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.message : 'Server error');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`H5 server listening on http://localhost:${port}/`);
});
