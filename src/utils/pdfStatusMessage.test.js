import { describe, expect, it } from 'vitest';
import { buildHtmlSavedMessage, buildHtmlSavedParts, HTML_BUSY_ERROR_MESSAGE } from './pdfStatusMessage.js';

describe('HTML status messages', () => {
  it('shows the browser download location when the HTML report is saved', () => {
    expect(buildHtmlSavedMessage('张女士-RPT-001.html')).toBe(
      'HTML已保存，请到浏览器默认下载目录/张女士-RPT-001.html中查看。',
    );
  });

  it('uses the shared busy message for HTML failures', () => {
    expect(HTML_BUSY_ERROR_MESSAGE).toBe('HTML保存失败，访问人数较多，请稍后再试。');
  });

  it('splits the saved message so the file name can be rendered as a link', () => {
    expect(buildHtmlSavedParts('张女士-RPT-001.html')).toEqual({
      prefix: '您的HTML报告已保存，请到浏览器默认下载目录/',
      filename: '张女士-RPT-001.html',
      suffix: '中查看，或直接点击高亮文件名查看。',
    });
  });
});
