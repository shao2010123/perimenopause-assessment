import { describe, expect, it } from 'vitest';
import { testCases } from '../test/testCases.js';
import { calculate } from '../engine/calculator.js';
import { buildFeishuRecordFields } from './feishuPayload.js';

describe('buildFeishuRecordFields', () => {
  it('maps a completed report snapshot to Feishu base fields', () => {
    const answers = testCases.case2;
    const result = calculate(answers);
    const fields = buildFeishuRecordFields({
      reportId: 'RPT-TEST-001',
      createdAt: '2026-05-29T08:30:00.000Z',
      userInfo: {
        name: '周女士',
        birthYear: 1975,
        phone: '13800138000',
        contact: 'wechat_zhou',
      },
      answers,
      result,
    });

    expect(fields['报告编号']).toBe('RPT-TEST-001');
    expect(fields['提交时间']).toBe('2026-05-29 16:30:00');
    expect(fields['姓名昵称']).toBe('周女士');
    expect(fields['手机号']).toBe('13800138000');
    expect(fields['微信或邮箱']).toBe('wechat_zhou');
    expect(fields['出生年份']).toBe(1975);
    expect(fields['年龄']).toBe(result.age);
    expect(fields['BMI']).toBeCloseTo(result.bmi.value, 1);
    expect(fields['月经状态']).toContain('已经超过半年没来了');
    expect(fields['阶段判断']).toContain(result.straw_stage.content.title);
    expect(fields['主导模式']).toContain(result.primaryPattern);
    expect(fields['症状负担']).toContain('综合');
    expect(fields['推荐检测']).toContain('性激素');
    expect(fields['完整答案JSON']).toBeUndefined();
    expect(fields['Q1 请问怎么称呼您？']).toBe('周女士');
    expect(fields['Q2 您的出生年份是？']).toBe('1975');
    expect(fields['Q5 您目前的月经情况是？']).toContain('已经超过半年没来了');
    expect(fields['Q6 您是否有过以下手术或医疗经历？（可多选）']).toBe('以上都没有');
    expect(fields['Q15 您的睡眠怎么样？']).toContain('经常要很久才能睡着');
    expect(fields['Q18 您是否对温度变得更敏感了？']).toContain('特别怕冷');
    expect(fields['完整报告JSON']).toContain('"primaryPattern"');
  });
});
