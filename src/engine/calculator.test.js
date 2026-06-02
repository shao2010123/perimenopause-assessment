import { testCases } from '../test/testCases.js';
import { Q } from '../data/constants.js';
import {
  getQuestionById,
  getQuestionDisplayLabel,
  getQuestionsByPage,
  QUESTION_STEP_TOTAL,
} from '../data/questions.js';
import {
  adjustPriors,
  calculate,
  crossValidateQ2Q5,
  generateTestRecommendations,
  getVisibleQuestionsForPage,
  interpretResult,
} from './calculator.js';

function expectWithinRange(value, min, max) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

describe('calculate', () => {
  it('问卷将典型症状题集中在第 3 页', () => {
    expect(QUESTION_STEP_TOTAL).toBe(3);
    expect(getQuestionsByPage(3).map((question) => question.id)).toEqual([
      Q.HOT_FLASH,
      Q.ANXIETY,
      Q.SLEEP,
      Q.VAGINAL_DRYNESS,
      Q.JOINT_PAIN,
      Q.TEMPERATURE_SENSITIVITY,
    ]);
  });

  it('问卷展示题号按保留后的题目顺序连续编号', () => {
    expect(getQuestionDisplayLabel(Q.NAME)).toBe('Q1');
    expect(getQuestionDisplayLabel(Q.BIRTH_YEAR)).toBe('Q2');
    expect(getQuestionDisplayLabel(Q.HEIGHT)).toBe('Q3');
    expect(getQuestionDisplayLabel(Q.WEIGHT)).toBe('Q4');
    expect(getQuestionDisplayLabel(Q.MENSTRUATION)).toBe('Q5');
    expect(getQuestionDisplayLabel(Q.FLOW_CHANGE)).toBe('Q9');
    expect(getQuestionDisplayLabel(Q.HOT_FLASH)).toBe('Q13');
    expect(getQuestionDisplayLabel(Q.ANXIETY)).toBe('Q14');
    expect(getQuestionDisplayLabel(Q.TEMPERATURE_SENSITIVITY)).toBe('Q18');
  });

  it('用例1：42岁，经量增多型，在新年龄-BMI交互下仍以 B 为最高且呈复合特征', () => {
    const result = calculate(testCases.case1);

    expect(result.primaryPattern).toBe('B');
    expectWithinRange(result.patterns.B, 35, 40);
    expectWithinRange(result.patterns.A, 22, 35);
    expect(result.patterns.B).toBeGreaterThan(result.patterns.A);
    expect(result.compositeInfo?.isComposite).toBe(true);
    expect(result.bmi.value).toBeCloseTo(25.9, 1);
    expect(result.bmi.category).toBe('超重');
    expect(result.overlays.insulin).toBeLessThan(35);
    expect(result.overlays.thyroid).toBeLessThan(20);
    expect(result.redFlags).toHaveLength(0);
  });

  it('用例2：51岁，停经+甲减疑似，BMI 正常时结果基本保持 D 主导', () => {
    const result = calculate(testCases.case2);

    expect(result.primaryPattern).toBe('D');
    expectWithinRange(result.patterns.D, 60, 70);
    expect(result.bmi.value).toBeCloseTo(22, 1);
    expect(result.bmi.category).toBe('正常');
    expect(result.overlays.thyroid).toBeGreaterThanOrEqual(10);
    expect(result.thyroidDirection).toBe('hypo');
    expect(result.redFlags).toHaveLength(0);
  });

  it('用例3：47岁，月经紊乱，删除代谢题后仍以 C 为主导', () => {
    const result = calculate(testCases.case3);
    const recommendations = generateTestRecommendations(result, testCases.case3);

    expect(result.primaryPattern).toBe('C');
    expectWithinRange(result.patterns.C, 30, 40);
    expect(result.bmi.value).toBeCloseTo(28.9, 1);
    expect(result.bmi.category).toBe('肥胖');
    expect(result.overlays.insulin).toBe(0);
    expect(
      recommendations.essential.some(
        (item) => item.name === '空腹血糖 + 空腹胰岛素（计算HOMA-IR）',
      ),
    ).toBe(false);
  });

  it('出生年份变化会影响年龄先验调整', () => {
    const younger = calculate({
      ...testCases.case1,
      Q1: 1990,
      Q2: 'B',
    });
    const older = calculate({
      ...testCases.case1,
      Q1: 1978,
      Q2: 'B',
    });

    expect(younger.age).toBe(36);
    expect(older.age).toBe(48);
    expect(younger.patterns.A).toBeGreaterThan(older.patterns.A);
    expect(older.patterns.C).toBeGreaterThan(younger.patterns.C);
  });

  it('BMI 肥胖先验会随年龄分层调整模式 B', () => {
    const younger = adjustPriors({
      Q1: 1984,
      Q2: 'B',
      Q3: 160,
      Q4: 74,
    });
    const older = adjustPriors({
      Q1: 1978,
      Q2: 'B',
      Q3: 160,
      Q4: 74,
    });

    expect(younger.bmi.value).toBeCloseTo(28.9, 1);
    expect(younger.priors.B).toBeCloseTo(0.99, 5);
    expect(older.priors.B).toBeCloseTo(1.386, 5);
  });
});

describe('cycle change question', () => {
  it('Q8 覆盖月经量变少，且不会按经量增多计权', () => {
    const question = getQuestionById(Q.FLOW_CHANGE);
    const lessFlow = calculate({ ...testCases.case1, Q8: 'less' });
    const moreFlow = calculate({ ...testCases.case1, Q8: 2 });

    expect(question.options.map((option) => option.value)).toContain('less');
    expect(question.options.find((option) => option.value === 'less').label).toContain('变少');
    expect(lessFlow.patterns.B).toBeLessThan(moreFlow.patterns.B);
    expect(lessFlow.redFlags).toHaveLength(0);
  });

  it('Q8 覆盖月经持续天数增加，位于第 5 个选项且不触发红旗', () => {
    const question = getQuestionById(Q.FLOW_CHANGE);
    const longerDuration = calculate({ ...testCases.case1, Q8: 'longer_duration' });
    const stableFlow = calculate({ ...testCases.case1, Q8: 0 });

    expect(question.options[4]).toEqual({
      label: '月经持续天数较之前明显增加了',
      value: 'longer_duration',
    });
    expect(longerDuration.patterns.B).toBeGreaterThan(stableFlow.patterns.B);
    expect(longerDuration.redFlags).toHaveLength(0);
  });

  it('Q2 使用 A-I 覆盖有月经、停经和月经被干预掩盖的状态', () => {
    const question = getQuestionById(Q.MENSTRUATION);

    expect(question.options.map((option) => option.value)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
    ]);
    expect(question.options.map((option) => option.label)).toEqual([
      '基本上还算规律，每个月都会来',
      '有时会提前或推迟一周以上，但每个月还是会来',
      '经常 2～3 个月才来一次，或者已经开始“跳月”',
      '已经超过半年没来了',
      '已经超过一年没来了（确认绝经）',
      '我正在使用曼月乐（左炔诺孕酮宫内节育系统），月经很少或已经没有了',
      '我做过子宫切除手术，但保留了卵巢',
      '我做过子宫和双侧卵巢切除手术',
      '因为其他原因没有月经（如：正在使用激素类避孕药、避孕针、皮下埋植等）',
    ]);
  });

  it('Q10 使用 A-E 细分仍有月经用户的周期变化', () => {
    const question = getQuestionById(Q.CYCLE_CHANGE);

    expect(question.question).toBe('您的月经周期（从一次来到下一次来的天数）有什么变化？');
    expect(question.type).toBe('single');
    expect(question.subtitle).toBe('不需要记得精确天数，选最接近您感受的一项。');
    expect(question.options).toEqual([
      { label: '比较稳定，大致在 25～35 天之间', value: 'A' },
      { label: '偶尔会比平时提前或推迟一周左右，但大部分时候还算规律', value: 'B' },
      { label: '明显变短了，经常不到 25 天就来（来得比以前频繁）', value: 'C' },
      { label: '明显变长了，经常要 5～6 周甚至更久才来一次', value: 'D' },
      { label: '完全没规律，有时很密有时好久不来，无法预测', value: 'E' },
    ]);
  });

  it('只有 Q2=A/B/C 时，第 2 页显示 Q10；其他状态跳过月经周期题', () => {
    for (const value of ['A', 'B', 'C']) {
      const visibleQuestionIds = getVisibleQuestionsForPage(2, { [Q.MENSTRUATION]: value }).map(
        (question) => question.id,
      );
      expect(visibleQuestionIds).toContain(Q.CYCLE_CHANGE);
    }

    for (const value of ['D', 'E', 'F', 'G', 'H', 'I']) {
      const visibleQuestionIds = getVisibleQuestionsForPage(2, { [Q.MENSTRUATION]: value }).map(
        (question) => question.id,
      );
      expect(visibleQuestionIds).toEqual([Q.ABNORMAL_BLEEDING]);
    }
  });

  it('Q2 特殊无月经状态会设置症状推断提示和手术性绝经标记', () => {
    const mirena = calculate({ ...testCases.case1, [Q.MENSTRUATION]: 'F', [Q.CYCLE_CHANGE]: undefined });
    const hysterectomy = calculate({
      ...testCases.case1,
      [Q.MENSTRUATION]: 'G',
      [Q.CYCLE_CHANGE]: undefined,
    });
    const surgicalMenopause = calculate({
      ...testCases.case1,
      [Q.MENSTRUATION]: 'H',
      [Q.CYCLE_CHANGE]: undefined,
    });

    expect(mirena.menstrualContext.stagingMethod).toBe('symptom_based');
    expect(mirena.menstrualContext.note).toContain('曼月乐');
    expect(hysterectomy.menstrualContext.note).toContain('子宫已切除');
    expect(surgicalMenopause.menstrualContext.flags.surgicalMenopause).toBe(true);
    expect(surgicalMenopause.menstrualContext.note).toContain('手术切除双侧卵巢');
  });
});

describe('medical and surgery history question', () => {
  it('Q5 剔除 Q2 已覆盖的子宫/双侧卵巢切除，采集独立医疗史', () => {
    const question = getQuestionById(Q.SURGERY);

    expect(question.question).toBe('您是否有过以下手术或医疗经历？（可多选）');
    expect(question.options).toEqual([
      { label: '一侧卵巢切除（保留了另一侧）', value: 'unilateral_oophorectomy' },
      { label: '甲状腺手术（全切或部分切除）', value: 'thyroid_surgery' },
      { label: '正在或曾经接受过化疗 / 放疗', value: 'chemo_radiotherapy' },
      { label: '被诊断过多囊卵巢综合征（PCOS）', value: 'pcos' },
      {
        label: '被诊断过甲状腺功能异常（甲亢、甲减、桥本甲状腺炎等）',
        value: 'thyroid_disorder',
      },
      {
        label: '被诊断过早发性卵巢功能不全（40岁前卵巢功能衰退，曾被称为“卵巢早衰”）',
        value: 'poi',
      },
      { label: '以上都没有', value: 'none', exclusive: true },
    ]);
    expect(question.options.map((option) => option.value)).not.toContain('hysterectomy');
    expect(question.options.map((option) => option.value)).not.toContain('oophorectomy');
  });

  it('Q2=H 时 Q5 单侧卵巢切除会被交叉校验静默忽略', () => {
    const validation = crossValidateQ2Q5('H', ['unilateral_oophorectomy', 'thyroid_surgery']);

    expect(validation.answers).toEqual(['thyroid_surgery']);
    expect(validation.flags).toContain('surgical_menopause');
  });

  it('Q5 同时选择甲状腺手术和甲状腺异常时，甲状腺倍率取较高值不叠加', () => {
    const validation = crossValidateQ2Q5('A', ['thyroid_surgery', 'thyroid_disorder']);
    const result = calculate({
      ...testCases.case1,
      [Q.SURGERY]: ['thyroid_surgery', 'thyroid_disorder'],
    });

    expect(validation.thyroidFlag).toBe('confirmed_surgical_and_diagnosed');
    expect(validation.thyroidRiskMultiplier).toBe(2);
    expect(result.medicalContext.thyroidFlag).toBe('confirmed_surgical_and_diagnosed');
    expect(result.medicalContext.notes.join('')).toContain('甲状腺');
  });

  it('Q5=PCOS 会提高胰岛素风险并降低 STRAW 分期置信度', () => {
    const baseline = calculate(testCases.case1);
    const result = calculate({
      ...testCases.case1,
      [Q.SURGERY]: ['pcos'],
    });

    expect(result.overlays.insulin).toBeGreaterThan(baseline.overlays.insulin);
    expect(result.straw_stage.confidence).toBe('low');
    expect(result.medicalContext.notes.join('')).toContain('PCOS');
  });

  it('Q5=POI 会标记早发卵巢功能不全和 earlyMenopause 风险', () => {
    const result = calculate({
      ...testCases.case1,
      [Q.SURGERY]: ['poi'],
    });

    expect(result.risk_flags.poi).toBe(true);
    expect(result.risk_flags.earlyMenopause).toBe(true);
    expect(result.medicalContext.notes.join('')).toContain('早发性卵巢功能不全');
  });
});

describe('determineSTRAWStage', () => {
  it('Q2=C 会推断为围绝经晚期', () => {
    const result = calculate(testCases.case3);

    expect(result.straw_stage.stage).toBe('stage_late_transition');
    expect(result.straw_stage.confidence).toBe('high');
    expect(result.straw_stage.content.title).toBe('围绝经晚期（变化加速期）');
  });

  it('Q2=H 会优先标记为手术性绝经', () => {
    const result = calculate({
      ...testCases.case1,
      [Q.MENSTRUATION]: 'H',
      [Q.CYCLE_CHANGE]: undefined,
    });

    expect(result.straw_stage.stage).toBe('stage_surgical_meno');
    expect(result.straw_stage.confidence).toBe('high');
    expect(result.risk_flags.surgicalMenopause).toBe(true);
    expect(result.straw_stage.note).toContain('手术切除了子宫和卵巢');
  });

  it('Q2=F/G/I 会进入月经信息不可用的分期状态，并保留症状推断阶段', () => {
    const result = calculate({
      ...testCases.case1,
      [Q.MENSTRUATION]: 'F',
      [Q.CYCLE_CHANGE]: undefined,
      [Q.HOT_FLASH]: 3,
      [Q.NIGHT_SWEATS]: 3,
    });

    expect(result.straw_stage.stage).toBe('stage_uncertain');
    expect(result.straw_stage.inferredStage).toBe('stage_late_transition');
    expect(result.straw_stage.confidence).toBe('low');
    expect(result.straw_stage.note).toContain('月经信息无法用于判断');
  });

  it('Q2=A 但周期已有波动时，会推断为围绝经早期', () => {
    const result = calculate({
      ...testCases.case1,
      [Q.MENSTRUATION]: 'A',
      [Q.CYCLE_CHANGE]: 'B',
    });

    expect(result.straw_stage.stage).toBe('stage_early_transition');
    expect(result.straw_stage.confidence).toBe('medium');
  });
});

describe('interpretResult', () => {
  it('主导型分布会给出 high 匹配度和尽早检测建议', () => {
    const interpreted = interpretResult(
      { A: 18, B: 46, C: 20, D: 16 },
      { thyroid: 18, insulin: 24, adrenal: 15 },
      [],
    );

    expect(interpreted.confidence).toBe('high');
    expect(interpreted.testUrgency).toBe('recommended');
    expect(interpreted.topPattern).toBe('B');
    expect(interpreted.narrative).toContain('高度吻合');
  });

  it('分散型分布会给出 mixed 匹配度和可先观察建议', () => {
    const interpreted = interpretResult(
      { A: 28, B: 24, C: 25, D: 23 },
      { thyroid: 12, insulin: 18, adrenal: 16 },
      [],
    );

    expect(interpreted.confidence).toBe('mixed');
    expect(interpreted.testUrgency).toBe('optional');
    expect(interpreted.topPattern).toBe('A');
    expect(interpreted.narrative).toContain('没有明显的单一倾向');
  });

  it('两种模式接近时会标记为复合模式', () => {
    const interpreted = interpretResult(
      { A: 33, B: 29, C: 21, D: 17 },
      { thyroid: 18, insulin: 22, adrenal: 14 },
      [],
    );

    expect(interpreted.compositeInfo?.isComposite).toBe(true);
    expect(interpreted.compositeInfo?.patterns).toEqual(['A', 'B']);
  });
});

describe('generateTestRecommendations', () => {
  it('显著症状时即使甲状腺专项分不高，也会附加 TSH 初筛建议', () => {
    const result = {
      patterns: { A: 12, B: 46, C: 24, D: 18 },
      overlays: { thyroid: 18, insulin: 20, adrenal: 15 },
      redFlags: [],
      thyroid: {
        riskPercent: 18,
        shouldRecommendTSH: true,
        reason: '围绝经期与甲状腺功能异常有超过 70% 的症状重叠，建议同时排查',
      },
      interpretation: interpretResult(
        { A: 12, B: 46, C: 24, D: 18 },
        { thyroid: 18, insulin: 20, adrenal: 15 },
        [],
      ),
    };

    const recommendations = generateTestRecommendations(result, {});

    expect(
      recommendations.recommended.some((item) => item.name === 'TSH（甲状腺功能初筛）'),
    ).toBe(true);
  });

  it('甲状腺风险达到 30% 时会升级为完整甲状腺检测', () => {
    const result = {
      patterns: { A: 20, B: 31, C: 27, D: 22 },
      overlays: { thyroid: 30, insulin: 18, adrenal: 12 },
      redFlags: [],
      thyroid: {
        riskPercent: 30,
        shouldRecommendTSH: true,
        reason: '您的部分症状可能与甲状腺功能相关',
      },
      interpretation: interpretResult(
        { A: 20, B: 31, C: 27, D: 22 },
        { thyroid: 30, insulin: 18, adrenal: 12 },
        [],
      ),
    };

    const recommendations = generateTestRecommendations(result, {});

    expect(
      recommendations.essential.some((item) => item.name === 'TSH + FT3 + FT4 + TPOAb'),
    ).toBe(true);
  });
});
