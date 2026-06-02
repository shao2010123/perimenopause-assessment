import { describe, expect, it } from 'vitest';
import { FOOTER_ATTRIBUTION_TEXT, FOOTER_LEGAL_ITEMS } from './CoDevelopedBy.jsx';

describe('CoDevelopedBy footer text', () => {
  it('uses the generated-report attribution and non-interactive legal footer copy', () => {
    expect(FOOTER_ATTRIBUTION_TEXT).toBe('本报告由更年期健康智能分析系统自动生成');
    expect(FOOTER_LEGAL_ITEMS).toEqual([
      '©健康智能 湘ICP备2025133962号',
      '隐私政策',
      '使用条款',
      '帮助中心',
      '联系我们',
    ]);
  });
});
