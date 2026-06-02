export const HTML_BUSY_ERROR_MESSAGE = 'HTML保存失败，访问人数较多，请稍后再试。';

export function buildHtmlSavedMessage(filename) {
  const destination = filename ? `浏览器默认下载目录/${filename}` : '浏览器默认下载目录';
  return `HTML已保存，请到${destination}中查看。`;
}

export function buildHtmlSavedParts(filename) {
  return {
    prefix: '您的HTML报告已保存，请到浏览器默认下载目录/',
    filename: filename || 'HTML报告.html',
    suffix: '中查看，或直接点击高亮文件名查看。',
  };
}
