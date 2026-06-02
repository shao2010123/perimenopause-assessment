import { testCases } from '../test/testCases.js';
import {
  buildLifestyleCards,
  buildPatternDisplay,
  generateLabRecommendations,
  generateHeroSection,
  generateNarrativeExplanation,
  generateRecommendationCards,
  generateSymptomSeverity,
  buildResultHero,
  buildRiskHighlights,
} from './reporting.js';
import { calculate } from './calculator.js';

describe('reporting helpers', () => {
  const wangLikeAnswers = {
    ...testCases.case3,
    Q5: ['pcos'],
    Q12: 1,
    Q13: 0,
    Q15: 1,
    Q16: 1,
    Q17: 1,
    Q18: 1,
    Q20: 3,
    Q21: 3,
    Q22: 2,
    Q23: 3,
    Q26: 3,
    Q27: 1,
    Q29: 'A',
    Q30: ['constipation'],
    Q31: 3,
  };

  it('buildResultHero gives a human-readable summary with the top secondary risk', () => {
    const result = calculate(testCases.case3);
    const hero = buildResultHero(result);

    expect(hero.title).toBe('激素波动型');
    expect(hero.matchValue).toBe(result.patterns.C);
    expect(hero.secondaryRiskLabel).toBe('暂无明显叠加风险');
    expect(hero.subtitle).toContain('忽高忽低');
  });

  it('buildLifestyleCards attaches related labels from the user answers', () => {
    const result = calculate(testCases.case3);
    const cards = buildLifestyleCards(result, testCases.case3);
    const foodCard = cards.find((item) => item.title === '把节律先稳住');

    expect(foodCard).toBeDefined();
    expect(foodCard.relatedLabels).toContain('周期紊乱');
    expect(foodCard.relatedLabels).toContain('潮热');
  });

  it('buildRiskHighlights only expands explanatory copy for risks that need attention', () => {
    const result = calculate(testCases.case1);
    const items = buildRiskHighlights(result);
    const lowThyroid = items.find((item) => item.key === 'thyroid');
    const insulinRisk = items.find((item) => item.key === 'insulin');

    expect(lowThyroid.showDetails).toBe(false);
    expect(insulinRisk.showDetails).toBe(false);
  });

  it('generateHeroSection combines STRAW stage and primary hormone pattern into one conclusion', () => {
    const result = calculate(testCases.case3);
    const hero = generateHeroSection(result, testCases.case3);

    expect(hero.headline).toContain('你的阶段判断');
    expect(hero.stageLabel).toContain('围绝经晚期');
    expect(hero.stageConfidenceLabel).toBe('很可能');
    expect(hero.timeline.stage).toBe(result.straw_stage.stage);
    expect(hero.evidence).toContain('跳月');
    expect(JSON.stringify(hero)).not.toContain('匹配度');
    expect(JSON.stringify(hero)).not.toContain('%');
  });

  it('generateSymptomSeverity returns active symptom domain grades with a total burden grade', () => {
    const severity = generateSymptomSeverity(testCases.case2);

    expect(severity.domains.map((domain) => domain.key)).toEqual([
      'vasomotor',
      'psychological',
      'urogenital',
      'somatic',
      'paresthesia',
    ]);
    expect(severity.total.max).toBe(26);
    expect(severity.domains.find((domain) => domain.key === 'urogenital')).toMatchObject({
      name: '泌尿生殖',
      max: 6,
    });
    expect(['无/轻微', '轻度', '中度', '重度']).toContain(severity.total.level);
    expect(severity.domains.every((domain) => Number.isInteger(domain.score))).toBe(true);
    expect(severity.domains.every((domain) => !String(domain.ratio).includes('%'))).toBe(true);
  });

  it('generateSymptomSeverity adds temperature sensitivity as paresthesia burden from Q29', () => {
    const severity = generateSymptomSeverity({ ...testCases.case2, Q29: 'A' });
    const paresthesia = severity.domains.find((domain) => domain.key === 'paresthesia');

    expect(paresthesia).toMatchObject({
      name: '感觉异常',
      shortName: '感觉异常',
      score: 4,
      max: 4,
      level: '重度',
    });
  });

  it('generateSymptomSeverity uses summary mode when all domains stay below moderate', () => {
    const lowSymptomAnswers = {
      ...testCases.case1,
      Q3: 165,
      Q4: 55,
      Q12: 0,
      Q13: 0,
      Q15: 0,
      Q16: 0,
      Q17: 0,
      Q18: 0,
      Q20: 0,
      Q21: 0,
      Q22: 0,
      Q23: 0,
      Q24: 0,
      Q25: 0,
      Q26: 0,
      Q27: 0,
      Q31: 0,
      Q32: 0,
    };
    const severity = generateSymptomSeverity(lowSymptomAnswers);

    expect(severity.displayMode).toBe('summary');
    expect(severity.summary.label).toBe('无/轻微');
    expect(severity.summary.paragraphs.join('')).toContain('没有报告明显');
    expect(severity.domains.every((domain) => domain.level !== '中度' && domain.level !== '重度')).toBe(true);
  });

  it('generateSymptomSeverity uses detail mode when a domain reaches moderate or above', () => {
    const severity = generateSymptomSeverity(testCases.case2);
    const vasomotor = severity.domains.find((domain) => domain.key === 'vasomotor');

    expect(severity.displayMode).toBe('detail');
    expect(vasomotor.shortName).toBe('血管舒缩');
    expect(vasomotor.isEmphasized).toBe(true);
    expect(severity.summary).toBeNull();
  });

  it('urogenital severity reflects retained body-change answers', () => {
    const severity = generateSymptomSeverity(testCases.case2);
    const urogenital = severity.domains.find((domain) => domain.key === 'urogenital');

    expect(urogenital.score).toBeGreaterThanOrEqual(5);
    expect(['中度', '重度']).toContain(urogenital.level);
    expect(severity.total.score).toBeGreaterThan(10);
  });

  it('buildPatternDisplay converts posterior scores into labels and stars without raw percentages', () => {
    const result = calculate(testCases.case2);
    const display = buildPatternDisplay(result);

    expect(display.primary.label).toBe('雌激素显著减退型');
    expect(display.primary.stars).toBe('★★★');
    expect(display.primary.level).toBe('高度吻合');
    expect(display.secondary).toBeNull();
    expect(JSON.stringify(display)).not.toContain('%');
    expect(JSON.stringify(display)).not.toContain('匹配度');
  });

  it('generateNarrativeExplanation returns v5 narrative with stage, severity and stars', () => {
    const result = calculate(testCases.case2);
    const narrative = generateNarrativeExplanation(result, testCases.case2);

    expect(narrative.title).toBe('你的身体正在经历什么');
    expect(narrative.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(narrative.patternLine).toContain('★★');
    expect(narrative.patternLine).not.toContain('%');
    expect(narrative.meaningTitle).toBe('了解你的变化');
    expect(narrative.checks).toBeUndefined();
  });

  it('generateNarrativeExplanation uses early-change framing when pattern features are subtle', () => {
    const lowSymptomAnswers = {
      ...testCases.case1,
      Q3: 165,
      Q4: 55,
      Q12: 0,
      Q13: 0,
      Q15: 0,
      Q16: 0,
      Q17: 0,
      Q18: 0,
      Q20: 0,
      Q21: 0,
      Q22: 0,
      Q23: 0,
      Q24: 0,
      Q25: 0,
      Q26: 0,
      Q27: 0,
      Q31: 0,
      Q32: 0,
    };
    const result = {
      ...calculate(lowSymptomAnswers),
      patterns: { A: 30, B: 25, C: 25, D: 20 },
    };
    const narrative = generateNarrativeExplanation(result, lowSymptomAnswers);
    const text = JSON.stringify(narrative);

    expect(narrative.patternLine).toBe('变化初期 · 早期信号');
    expect(narrative.meaningTitle).toBe('现在可以做什么');
    expect(narrative.mechanism).toContain('性激素六项和 AMH');
    expect(text).toContain('比较早期');
    expect(text).not.toContain('症状组合暂不属于');
    expect(text).not.toContain('不属于任何');
    expect(text).not.toContain('无法归类');
    expect(text).not.toContain('不匹配');
    expect(text).not.toContain('建议进行激素水平检测');
  });

  it('generateNarrativeExplanation avoids early-change framing for late-transition reports with moderate burden', () => {
    const result = calculate(wangLikeAnswers);
    const narrative = generateNarrativeExplanation(result, wangLikeAnswers);
    const text = JSON.stringify(narrative);

    expect(result.straw_stage.stage).toBe('stage_late_transition');
    expect(narrative.severity.total.level).toBe('中度');
    expect(narrative.patternLine).toBe('多线索变化 · 过渡期信号');
    expect(narrative.meaningTitle).toBe('了解你的变化');
    expect(text).toContain('泌尿生殖');
    expect(text).toContain('代谢');
    expect(text).not.toContain('变化初期');
    expect(text).not.toContain('比较早期');
  });

  it('generateLabRecommendations uses China clinic panels instead of individual sex hormones', () => {
    const result = calculate(testCases.case2);
    const labs = generateLabRecommendations(result, testCases.case2);
    const names = labs.map((lab) => lab.name);

    expect(names.slice(0, 2)).toEqual(['性激素六项', 'AMH（抗缪勒管激素）']);
    expect(JSON.stringify(labs)).toContain('FSH、LH、E2、孕酮、睾酮、泌乳素');
    expect(names).not.toContain('FSH');
    expect(names).not.toContain('雌二醇（E2）');
    expect(names).not.toContain('孕酮');
  });

  it('generateLabRecommendations uses China thyroid function panels instead of incomplete TSH FT4 pair', () => {
    const answers = { ...testCases.case2, Q5: ['thyroid_disorder'] };
    const result = calculate(answers);
    const labs = generateLabRecommendations(result, answers);
    const thyroid = labs.find((lab) => lab.key === 'thyroid');

    expect(thyroid.name).toBe('甲状腺功能七项');
    expect(thyroid.items).toBe('TSH、FT3、FT4、TT3、TT4、TPOAb、TGAb');
    expect(thyroid.name).not.toContain('TSH + FT4');
  });

  it('generateLabRecommendations recommends thyroid five-item panel when thyroid trigger has no thyroid history', () => {
    const answers = { ...testCases.case2, Q5: ['none'] };
    const result = calculate(answers);
    const thyroid = generateLabRecommendations(result, answers).find((lab) => lab.key === 'thyroid');

    expect(thyroid.name).toBe('甲状腺功能五项');
    expect(thyroid.items).toBe('TSH、FT3、FT4、TT3、TT4');
  });

  it('generateLabRecommendations excludes sex hormone panel and AMH after bilateral oophorectomy', () => {
    const answers = { ...testCases.case2, Q2: 'H' };
    const result = calculate(answers);
    const labs = generateLabRecommendations(result, answers);
    const names = labs.map((lab) => lab.name);

    expect(names).not.toContain('性激素六项');
    expect(names).not.toContain('AMH（抗缪勒管激素）');
    expect(labs[0].note).toContain('双侧卵巢已切除');
  });

  it('generateRecommendationCards uses v5.3 action categories without urgency labels', () => {
    const result = calculate(testCases.case3);
    const cards = generateRecommendationCards(result, testCases.case3);
    const text = JSON.stringify(cards);

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(6);
    expect(cards[0].actions.length).toBeGreaterThan(0);
    expect(new Set(cards.map((card) => card.tone.label))).toEqual(
      new Set(['日常管理', '了解更多']),
    );
    expect(cards.every((card) => ['daily', 'learn_more'].includes(card.type))).toBe(true);
    expect(text).not.toContain('建议尽快');
    expect(text).not.toContain('需要立即');
    expect(text).not.toContain('务必');
    expect(text).not.toContain('警惕');
    expect(text).not.toContain('不容忽视');
    expect(text).not.toContain('#EF4444');
  });

  it('generateRecommendationCards places daily management before learn-more lab cards', () => {
    const result = calculate(testCases.case3);
    const cards = generateRecommendationCards(result, testCases.case3);
    const firstLearnMoreIndex = cards.findIndex((card) => card.type === 'learn_more');
    const lastDailyIndex = cards.reduce(
      (lastIndex, card, index) => (card.type === 'daily' ? index : lastIndex),
      -1,
    );

    expect(cards.some((card) => card.type === 'daily')).toBe(true);
    expect(cards.some((card) => card.type === 'learn_more')).toBe(true);
    expect(lastDailyIndex).toBeLessThan(firstLearnMoreIndex);
  });

  it('generateRecommendationCards includes a baseline daily card for low-symptom reports', () => {
    const lowSymptomAnswers = {
      ...testCases.case1,
      Q3: 165,
      Q4: 55,
      Q12: 0,
      Q13: 0,
      Q15: 0,
      Q16: 0,
      Q17: 0,
      Q18: 0,
      Q20: 0,
      Q21: 0,
      Q22: 0,
      Q23: 0,
      Q24: 0,
      Q25: 0,
      Q26: 0,
      Q27: 0,
      Q31: 0,
      Q32: 0,
    };
    const result = calculate(lowSymptomAnswers);
    const cards = generateRecommendationCards(result, lowSymptomAnswers);

    expect(cards.length).toBeLessThanOrEqual(6);
    expect(cards[0]).toMatchObject({
      type: 'daily',
      title: '日常观察',
      tone: { label: '日常管理', color: '#66BB6A' },
    });
    expect(cards.filter((card) => card.type === 'daily')).toHaveLength(2);
    expect(cards.some((card) => card.type === 'learn_more')).toBe(true);
  });

  it('generateRecommendationCards includes paresthesia daily management when displayed Q18 scores at least 2', () => {
    const answers = {
      ...testCases.case1,
      Q12: 0,
      Q16: 0,
      Q18: 0,
      Q26: 0,
      Q27: 0,
      Q29: 'C',
    };
    const result = calculate(answers);
    const cards = generateRecommendationCards(result, answers);
    const paresthesiaCard = cards.find((card) => card.title === '感觉异常');

    expect(paresthesiaCard).toMatchObject({
      type: 'daily',
      tone: { label: '日常管理', color: '#66BB6A' },
    });
    expect(paresthesiaCard.actions.join('')).toContain('怕冷、怕热或忽冷忽热');
  });

  it('generateRecommendationCards integrates lab panels into learn-more cards', () => {
    const answers = { ...testCases.case1, Q5: ['thyroid_disorder'] };
    const result = calculate(answers);
    const cards = generateRecommendationCards(result, answers);
    const thyroidCard = cards.find((card) => card.title === '甲状腺功能');
    const hormoneCard = cards.find((card) => card.title === '激素水平');

    expect(thyroidCard.type).toBe('learn_more');
    expect(thyroidCard.tone).toMatchObject({ label: '了解更多', color: '#5B8DEF' });
    expect(thyroidCard.actions.join('')).toContain('甲状腺功能七项');
    expect(hormoneCard.type).toBe('learn_more');
    expect(hormoneCard.actions.join('')).toContain('性激素六项');
    expect(hormoneCard.actions.join('')).toContain('AMH');
  });

  it('generateRecommendationCards shows two to three cards per action category', () => {
    const answers = { ...testCases.case2, Q5: ['thyroid_disorder'] };
    const result = calculate(answers);
    const cards = generateRecommendationCards(result, answers);
    const dailyCards = cards.filter((card) => card.type === 'daily');
    const learnMoreCards = cards.filter((card) => card.type === 'learn_more');

    expect(dailyCards.length).toBeGreaterThanOrEqual(2);
    expect(dailyCards.length).toBeLessThanOrEqual(3);
    expect(learnMoreCards.length).toBeGreaterThanOrEqual(2);
    expect(learnMoreCards.length).toBeLessThanOrEqual(3);
    expect(learnMoreCards).toHaveLength(3);
  });

  it('generateRecommendationCards keeps hormone level in the first two learn-more cards', () => {
    const answers = { ...testCases.case2, Q5: ['thyroid_disorder'] };
    const result = calculate(answers);
    const cards = generateRecommendationCards(result, answers);
    const learnMoreTitles = cards
      .filter((card) => card.type === 'learn_more')
      .map((card) => card.title);

    expect(learnMoreTitles.slice(0, 2)).toContain('激素水平');
  });

  it('generateRecommendationCards prioritizes metabolic checks when metabolic symptoms are prominent', () => {
    const result = calculate(wangLikeAnswers);
    const cards = generateRecommendationCards(result, wangLikeAnswers);
    const titles = cards.map((card) => card.title);
    const metabolicCard = cards.find((card) => card.title === '代谢健康');
    const privateCard = cards.find((card) => card.title === '私密健康');

    expect(cards.length).toBeLessThanOrEqual(6);
    expect(titles).toContain('代谢健康');
    expect(titles).toContain('私密健康');
    expect(titles).toContain('体重与代谢');
    expect(metabolicCard.type).toBe('learn_more');
    expect(metabolicCard.actions.join('')).toContain('空腹血糖');
    expect(privateCard.type).toBe('daily');
    expect(privateCard.actions.join('')).toContain('妇科评估');
    expect(privateCard.actions.join('')).toContain('白带常规');
  });

  it('generateRecommendationCards prioritizes bone density for early postmenopause reports', () => {
    const answers = {
      ...testCases.case2,
      Q2: 'E',
      Q5: ['none'],
      Q20: 3,
      Q21: 3,
      Q22: 2,
      Q23: 3,
    };
    const result = calculate(answers);
    const cards = generateRecommendationCards(result, answers);
    const titles = cards.map((card) => card.title);
    const boneCard = cards.find((card) => card.title === '骨骼健康');

    expect(result.straw_stage.stage).toBe('stage_early_postmeno');
    expect(cards.length).toBeLessThanOrEqual(6);
    expect(titles).toContain('骨骼健康');
    expect(boneCard.type).toBe('learn_more');
    expect(boneCard.actions.join('')).toContain('骨密度检查（DXA）');
  });

  it('generateRecommendationCards includes bone density when special menstrual status is inferred as early postmenopause', () => {
    const answers = {
      ...testCases.case2,
      Q1: 1980,
      Q2: 'G',
      Q5: ['none'],
      Q20: 3,
      Q21: 3,
      Q22: 2,
      Q23: 3,
    };
    const calculated = calculate(answers);
    const result = {
      ...calculated,
      age: 46,
      straw_stage: {
        ...calculated.straw_stage,
        stage: 'stage_uncertain',
        inferredStage: 'stage_early_postmeno',
      },
    };
    const cards = generateRecommendationCards(result, answers);
    const boneCard = cards.find((card) => card.title === '骨骼健康');

    expect(result.straw_stage.stage).toBe('stage_uncertain');
    expect(result.straw_stage.inferredStage).toBe('stage_early_postmeno');
    expect(boneCard).toBeDefined();
    expect(boneCard.actions.join('')).toContain('骨密度检查（DXA）');
  });

  it('generateLabRecommendations uses PCOS-driven insulin risk as a metabolic trigger', () => {
    const answers = {
      ...testCases.case1,
      Q3: 165,
      Q4: 56,
      Q5: ['pcos'],
    };
    const result = calculate(answers);
    const labs = generateLabRecommendations(result, answers);
    const metabolic = labs.find((lab) => lab.key === 'metabolic');

    expect(result.overlays.insulin).toBeGreaterThanOrEqual(40);
    expect(metabolic).toBeDefined();
    expect(metabolic.items).toContain('空腹血糖');
    expect(metabolic.items).toContain('空腹胰岛素');
  });

  it('generateNarrativeExplanation keeps thyroid history explanatory without repeating lab panels', () => {
    const answers = { ...testCases.case2, Q5: ['thyroid_surgery'] };
    const result = calculate(answers);
    const narrative = generateNarrativeExplanation(result, answers);
    const text = narrative.paragraphs.join('');

    expect(text).not.toContain('TSH/FT4');
    expect(text).not.toContain('建议纳入检查');
    expect(text).not.toContain('具体检查以上方');
    expect(text).not.toContain('组套');
    expect(text).toContain('甲状腺相关病史');
  });
});
