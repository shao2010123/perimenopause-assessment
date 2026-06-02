import { PATTERN_KEYS, PATTERN_NAMES, Q } from '../data/constants.js';
import {
  getQuestionById,
  getQuestionsByPage,
  QUESTION_STEP_TOTAL,
  questions,
} from '../data/questions.js';
import { getStageContent } from '../data/stages.js';

const STANDARD_SCALE_QUESTIONS = [
  Q.FLOW_CHANGE,
  Q.ABNORMAL_BLEEDING,
  Q.HOT_FLASH,
  Q.ANXIETY,
  Q.SLEEP,
  Q.VAGINAL_DRYNESS,
  Q.JOINT_PAIN,
];

const MENSTRUATION_DETAIL_VALUES = ['A', 'B', 'C'];

const MENSTRUATION_CONTEXT = {
  A: {
    strawStageHint: 'late_reproductive_or_early_transition',
    priors: { A: 0.35, B: 0.2, C: 0.25, D: 0.05 },
  },
  B: {
    strawStageHint: 'early_menopausal_transition',
    priors: { A: 0.4, B: 0.15, C: 0.3, D: 0.05 },
  },
  C: {
    strawStageHint: 'late_menopausal_transition',
    priors: { A: 0.15, B: 0.1, C: 0.4, D: 0.3 },
  },
  D: {
    strawStageHint: 'late_transition_to_early_postmeno',
    priors: { A: 0.05, B: 0.05, C: 0.3, D: 0.45 },
  },
  E: {
    strawStageHint: 'postmenopause',
    priors: { A: 0.02, B: 0.05, C: 0.15, D: 0.7 },
  },
  F: {
    strawStageHint: 'unknown_menstrual_masked',
    priors: { A: 0.3, B: 0.15, C: 0.25, D: 0.15 },
    stagingMethod: 'symptom_based',
    note: '您使用的曼月乐会影响月经表现，评估将主要依据您的症状和年龄来推断激素变化阶段。',
  },
  G: {
    strawStageHint: 'unknown_no_uterus',
    priors: { A: 0.25, B: 0.15, C: 0.25, D: 0.25 },
    stagingMethod: 'symptom_based',
    note: '因子宫已切除，无法通过月经判断分期，评估将基于症状和年龄推断。',
  },
  H: {
    strawStageHint: 'surgical_menopause',
    priors: { A: 0.02, B: 0.05, C: 0.1, D: 0.75 },
    flags: { surgicalMenopause: true },
    note: '手术切除双侧卵巢后，体内雌激素会骤然下降，症状可能比自然绝经更明显。',
  },
  I: {
    strawStageHint: 'unknown_menstrual_masked',
    priors: { A: 0.25, B: 0.2, C: 0.25, D: 0.15 },
    stagingMethod: 'symptom_based',
    note: '激素类避孕药会掩盖自然月经周期变化，评估将主要依据症状和年龄。',
  },
};

const CYCLE_CHANGE_SCORES = { A: 0, B: 1, C: 2, D: 3, E: 4, 0: 0, 1: 1, 2: 3, 3: 4 };

const CYCLE_CHANGE_ADJUSTMENTS = {
  A: { A: 0.1, C: -0.1, D: -0.1 },
  B: { A: 0.3, B: 0.1, C: 0.15 },
  C: { A: 0.4, B: 0.15, insulin: 0.1 },
  D: { A: -0.1, C: 0.3, D: 0.25 },
  E: { A: -0.15, C: 0.4, D: 0.2 },
};

const Q5_EFFECTS = {
  unilateral_oophorectomy: {
    priorMultipliers: { A: 1.1, D: 1.1 },
    effectiveAgeOffset: 2,
    notes: ['单侧卵巢切除可能加速卵巢功能衰退，围绝经期可能比同龄女性更早出现。'],
  },
  oophorectomy: {
    legacy: true,
    priorMultipliers: { D: 2 },
    notes: ['既往卵巢切除史会影响卵巢功能和绝经相关判断。'],
  },
  thyroid_surgery: {
    thyroidFlag: 'confirmed_surgical',
    thyroidRiskMultiplier: 2,
    notes: ['已有甲状腺手术史，建议定期监测甲状腺功能（TSH/FT4）。'],
  },
  chemo_radiotherapy: {
    stagingMethod: 'symptom_based_with_caution',
    priorMultipliers: { D: 1.2 },
    flags: { chemoHistory: true },
    notes: ['化疗/放疗可能影响卵巢功能，部分女性在治疗后月经恢复但卵巢储备已下降。'],
  },
  pcos: {
    confidencePenalty: 2,
    priorMultipliers: { B: 1.15 },
    insulinRiskMultiplier: 1.3,
    flags: { pcos: true },
    notes: [
      'PCOS 患者的月经本身不规律，围绝经期的判断需要结合激素检测。PCOS 患者的绝经年龄可能偏晚。',
    ],
  },
  thyroid_disorder: {
    thyroidFlag: 'confirmed_diagnosed',
    thyroidRiskMultiplier: 1.8,
    notes: [
      '您已有甲状腺功能异常的诊断史。甲状腺症状与更年期症状高度重叠，建议持续随访甲状腺功能。',
    ],
  },
  poi: {
    priorMultipliers: { D: 1.3 },
    flags: { earlyMenopause: true, poi: true },
    stagingOverride: 'poi_special',
    notes: [
      '早发性卵巢功能不全意味着卵巢功能在40岁前就已开始明显衰退。长期低雌激素状态对骨骼和心血管健康的影响需要特别关注，建议与医生讨论是否需要激素补充治疗。',
    ],
  },
};

const CONFIDENCE_ORDER = ['low', 'medium', 'high'];

const PATTERN_NARRATIVES = {
  A: '身体的“安抚剂”开始减少',
  B: '雌激素相对于孕激素偏高，处于比例失调状态',
  C: '激素忽高忽低，身体还在适应',
  D: '雌激素明显减少，身体在重新调整',
};

const TEST_URGENCY_META = {
  urgent: { title: '⏰ 请尽快安排以下检测', tone: 'urgent' },
  recommended: { title: '建议尽早安排以下检测', tone: 'recommended' },
  suggested: { title: '方便时可以安排这些检测', tone: 'suggested' },
  optional: { title: '目前症状较轻，以下检查可选', tone: 'optional' },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function evaluateExpression(expression, context) {
  if (!expression) return false;

  try {
    const evaluator = new Function(
      'answers',
      'value',
      'selectedValues',
      `return (${expression});`,
    );

    return Boolean(
      evaluator(context.answers ?? {}, context.value, context.selectedValues ?? []),
    );
  } catch {
    return false;
  }
}

export function shouldShowMenstrualDetailQuestions(answers = {}) {
  return MENSTRUATION_DETAIL_VALUES.includes(answers[Q.MENSTRUATION]);
}

export function getMenstrualContext(answer) {
  const context = MENSTRUATION_CONTEXT[answer] ?? null;
  if (!context) return null;

  return {
    strawStageHint: context.strawStageHint,
    stagingMethod: context.stagingMethod ?? 'menstrual_cycle_based',
    note: context.note ?? null,
    flags: context.flags ?? {},
  };
}

function normalizeQ5Answers(q5Answers = []) {
  if (!Array.isArray(q5Answers)) return [];
  return q5Answers.filter((answer) => answer && answer !== 'none');
}

export function crossValidateQ2Q5(q2Answer, q5Answers = []) {
  let answers = normalizeQ5Answers(q5Answers);
  const flags = [];
  const notes = [];

  if (q2Answer === 'H') {
    answers = answers.filter((answer) => answer !== 'unilateral_oophorectomy');
    flags.push('surgical_menopause');
  }

  if (answers.includes('poi') && q2Answer === 'A') {
    flags.push('poi_with_regular_menses');
    notes.push('虽然您报告目前月经尚规律，但既往 POI 诊断史仍需纳入评估考量。');
  }

  const hasThyroidSurgery = answers.includes('thyroid_surgery');
  const hasThyroidDisorder = answers.includes('thyroid_disorder');
  let thyroidFlag = null;
  let thyroidRiskMultiplier = 1;

  if (hasThyroidSurgery && hasThyroidDisorder) {
    thyroidFlag = 'confirmed_surgical_and_diagnosed';
    thyroidRiskMultiplier = 2;
  } else if (hasThyroidSurgery) {
    thyroidFlag = 'confirmed_surgical';
    thyroidRiskMultiplier = 2;
  } else if (hasThyroidDisorder) {
    thyroidFlag = 'confirmed_diagnosed';
    thyroidRiskMultiplier = 1.8;
  }

  return {
    answers,
    flags,
    notes,
    thyroidFlag,
    thyroidRiskMultiplier,
  };
}

function getMedicalContext(answers = {}) {
  const validation = crossValidateQ2Q5(answers[Q.MENSTRUATION], answers[Q.SURGERY]);
  const flags = {};
  const notes = [...validation.notes];
  const priorMultipliers = { A: 1, B: 1, C: 1, D: 1 };
  let effectiveAgeOffset = 0;
  let insulinRiskMultiplier = 1;
  let stagingMethod = null;
  let stagingOverride = null;
  let confidencePenalty = 0;

  for (const answer of validation.answers) {
    const effect = Q5_EFFECTS[answer];
    if (!effect) continue;

    for (const key of PATTERN_KEYS) {
      priorMultipliers[key] *= effect.priorMultipliers?.[key] ?? 1;
    }

    effectiveAgeOffset += effect.effectiveAgeOffset ?? 0;
    insulinRiskMultiplier *= effect.insulinRiskMultiplier ?? 1;
    confidencePenalty += effect.confidencePenalty ?? 0;
    stagingMethod = effect.stagingMethod ?? stagingMethod;
    stagingOverride = effect.stagingOverride ?? stagingOverride;
    Object.assign(flags, effect.flags ?? {});
    notes.push(...(effect.notes ?? []));
  }

  if (validation.flags.includes('surgical_menopause')) flags.surgicalMenopause = true;
  if (validation.flags.includes('poi_with_regular_menses')) flags.poiWithRegularMenses = true;

  return {
    answers: validation.answers,
    flags,
    notes: [...new Set(notes)],
    priorMultipliers,
    effectiveAgeOffset,
    insulinRiskMultiplier,
    thyroidFlag: validation.thyroidFlag,
    thyroidRiskMultiplier: validation.thyroidRiskMultiplier,
    stagingMethod,
    stagingOverride,
    confidencePenalty,
  };
}

function applyConfidencePenalty(confidence, penalty = 0) {
  const index = CONFIDENCE_ORDER.indexOf(confidence);
  if (index < 0 || penalty <= 0) return confidence;
  return CONFIDENCE_ORDER[Math.max(0, index - penalty)];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

export function getVisibleQuestionsForPage(page, answers = {}) {
  const pageQuestions = getQuestionsByPage(page);

  if (page !== 2) {
    return pageQuestions.filter(
      (question) =>
        !question.skipCondition ||
        !evaluateExpression(question.skipCondition, { answers }),
    );
  }

  if (!shouldShowMenstrualDetailQuestions(answers)) {
    return pageQuestions.filter((question) => question.id === Q.ABNORMAL_BLEEDING);
  }

  return pageQuestions.filter(
    (question) =>
      !question.skipCondition ||
      !evaluateExpression(question.skipCondition, { answers }),
  );
}

export function getQuestionPrompt(question, answers = {}) {
  if (question.id === Q.ABNORMAL_BLEEDING && !shouldShowMenstrualDetailQuestions(answers)) {
    if (answers[Q.MENSTRUATION] === 'E') {
      return '绝经后，您是否出现过阴道出血？';
    }

    return '目前没有规律月经的情况下，您是否出现过阴道出血或褐色分泌物？';
  }

  return question.question;
}

export function isQuestionAnswered(question, answers = {}) {
  const value = answers[question.id];

  if (question.type === 'multi') {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === 'number') {
    return value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));
  }

  return value !== undefined && value !== null && value !== '';
}

export function getMissingQuestionsForPage(page, answers = {}) {
  return getVisibleQuestionsForPage(page, answers).filter(
    (question) => question.required && !isQuestionAnswered(question, answers),
  );
}

export function getTriggeredRedFlags(answers = {}, page) {
  const pageNumbers = page
    ? [page]
    : Array.from({ length: QUESTION_STEP_TOTAL }, (_, index) => index + 1);
  const redFlags = [];
  const seen = new Set();

  for (const pageNumber of pageNumbers) {
    for (const question of getVisibleQuestionsForPage(pageNumber, answers)) {
      if (!question.redFlag) continue;

      const answer = answers[question.id];
      const selectedValues = Array.isArray(answer) ? answer : [];
      const matched = evaluateExpression(question.redFlag.condition, {
        answers,
        value: answer,
        selectedValues,
      });

      if (!matched) continue;

      const key = `${question.redFlag.message}-${question.redFlag.department}`;
      if (seen.has(key)) continue;
      seen.add(key);
      redFlags.push({
        message: question.redFlag.message,
        level: question.redFlag.level,
        department: question.redFlag.department,
      });
    }
  }

  return redFlags;
}

export function calculateAge(birthYear) {
  const numericBirthYear = toNumber(birthYear);
  if (!numericBirthYear) return null;

  const age = getCurrentYear() - numericBirthYear;
  return age > 0 ? age : null;
}

export function getBmiCategoryLabel(bmi) {
  if (bmi === null || bmi === undefined) return '未提供';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

export function calculateBmiInfo(heightCm, weightKg) {
  const height = toNumber(heightCm);
  const weight = toNumber(weightKg);

  if (!height || !weight) {
    return { value: null, category: '未提供', label: 'BMI 未提供' };
  }

  const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
  const category = getBmiCategoryLabel(bmi);

  return {
    value: bmi,
    category,
    label: `BMI：${bmi.toFixed(1)}（${category}）`,
  };
}

function addScaleContributions(rawScores, overlayScores, questionId, value) {
  const question = getQuestionById(questionId);
  if (!question || typeof question.weights !== 'object') return;

  rawScores.A += value * (question.weights.A ?? 0);
  rawScores.B += value * (question.weights.B ?? 0);
  rawScores.C += value * (question.weights.C ?? 0);
  rawScores.D += value * (question.weights.D ?? 0);
  overlayScores.thyroid_hypo += value * (question.weights.thyroid ?? 0);
  overlayScores.thyroid_hyper += value * (question.weights.thyroid ?? 0);
  overlayScores.insulin += value * (question.weights.insulin ?? 0);
  overlayScores.adrenal += value * (question.weights.adrenal ?? 0);
}

function addFlowChangeContributions(rawScores, answer) {
  if (answer === 'less') {
    rawScores.C += 2;
    rawScores.D += 3;
    return;
  }

  if (answer === 'longer_duration') {
    rawScores.A += 4;
    rawScores.B += 8;
    rawScores.C += 4;
  }
}

function normalizeCycleChangeAnswer(value) {
  if (value === undefined || value === null || value === '') return null;
  if (CYCLE_CHANGE_ADJUSTMENTS[value]) return value;
  if (Object.hasOwn(CYCLE_CHANGE_SCORES, value)) {
    return ['A', 'B', 'C', 'D', 'E'][CYCLE_CHANGE_SCORES[value]] ?? null;
  }
  return null;
}

export function getCycleChangeScore(value) {
  const normalized = normalizeCycleChangeAnswer(value);
  if (!normalized) return null;
  return CYCLE_CHANGE_SCORES[normalized] ?? null;
}

function getScaleScore(answers, questionId) {
  return toNumber(answers[questionId]) ?? 0;
}

function buildStagingInputs(answers, patterns) {
  const vasomotorRaw = getScaleScore(answers, Q.HOT_FLASH);
  const urogenitalRaw = getScaleScore(answers, Q.VAGINAL_DRYNESS);
  const symptomQuestionIds = [
    Q.HOT_FLASH,
    Q.ANXIETY,
    Q.SLEEP,
    Q.VAGINAL_DRYNESS,
    Q.JOINT_PAIN,
  ];
  const symptomRaw = symptomQuestionIds.reduce(
    (sum, questionId) => sum + getScaleScore(answers, questionId),
    0,
  );

  return {
    age: calculateAge(answers[Q.BIRTH_YEAR]),
    menstrual_status: answers[Q.MENSTRUATION],
    cycle_change: normalizeCycleChangeAnswer(answers[Q.CYCLE_CHANGE]),
    vasomotor_score: vasomotorRaw / 3,
    urogenital_score: urogenitalRaw / 3,
    symptom_severity_total: symptomRaw / (symptomQuestionIds.length * 3),
    pattern_scores: {
      patternA: (patterns.A ?? 0) / 100,
      patternB: (patterns.B ?? 0) / 100,
      patternC: (patterns.C ?? 0) / 100,
      patternD: (patterns.D ?? 0) / 100,
    },
  };
}

function withStageContent(stageResult) {
  return {
    ...stageResult,
    content: getStageContent(stageResult.stage),
  };
}

function inferStageFromSymptomsOnly(age, vasomotorScore, urogenitalScore, patternScores) {
  let inferredStage;

  if (age >= 55 || (urogenitalScore > 0.5 && vasomotorScore < 0.2)) {
    inferredStage = 'stage_late_postmeno';
  } else if (age >= 50 || patternScores.patternD > 0.5) {
    inferredStage = 'stage_early_postmeno';
  } else if (vasomotorScore > 0.5 || patternScores.patternC > 0.4) {
    inferredStage = 'stage_late_transition';
  } else if (age >= 40) {
    inferredStage = 'stage_early_transition';
  } else {
    inferredStage = 'stage_late_repro';
  }

  return withStageContent({
    stage: 'stage_uncertain',
    inferredStage,
    inferredStageContent: getStageContent(inferredStage),
    confidence: 'low',
    note:
      '由于您的月经信息无法用于判断（使用宫内节育器/避孕药，或已切除子宫），此分期推断主要基于您的症状和年龄，仅供参考。如需确认，建议检测 FSH 和雌二醇水平。',
  });
}

export function determineSTRAWStage(inputs) {
  const {
    age,
    menstrual_status: menstrualStatus,
    cycle_change: cycleChange,
    vasomotor_score: vasomotorScore,
    urogenital_score: urogenitalScore,
    symptom_severity_total: symptomSeverityTotal,
    pattern_scores: patternScores,
  } = inputs;

  if (menstrualStatus === 'H') {
    return withStageContent({
      stage: 'stage_surgical_meno',
      confidence: 'high',
      note:
        '您因手术切除了子宫和卵巢，属于手术性绝经。这意味着您的身体经历了比较突然的激素变化，而不是自然的渐进过渡。',
    });
  }

  if (['F', 'G', 'I'].includes(menstrualStatus)) {
    return inferStageFromSymptomsOnly(age, vasomotorScore, urogenitalScore, patternScores);
  }

  if (menstrualStatus === 'E') {
    if (age !== null && age < 40) {
      return withStageContent({
        stage: 'stage_early_postmeno',
        confidence: 'medium',
        flag: 'early_menopause',
        note:
          '您在 40 岁之前停经超过一年，这属于早发性绝经，建议尽早咨询妇科或内分泌科医生。',
      });
    }

    if (urogenitalScore > 0.5 && vasomotorScore < 0.3) {
      return withStageContent({ stage: 'stage_late_postmeno', confidence: 'medium' });
    }

    return withStageContent({ stage: 'stage_early_postmeno', confidence: 'high' });
  }

  if (menstrualStatus === 'D') {
    return withStageContent({
      stage: 'stage_late_transition',
      confidence: 'high',
      note:
        '您已经超过半年没来月经，正处于围绝经晚期。如果继续到满一年没来，就意味着进入了绝经期。',
    });
  }

  if (menstrualStatus === 'C') {
    return withStageContent({ stage: 'stage_late_transition', confidence: 'high' });
  }

  if (menstrualStatus === 'B') {
    if (cycleChange === 'E') {
      return withStageContent({ stage: 'stage_late_transition', confidence: 'medium' });
    }
    if (cycleChange === 'D') {
      return withStageContent({ stage: 'stage_late_transition', confidence: 'low' });
    }
    return withStageContent({ stage: 'stage_early_transition', confidence: 'high' });
  }

  if (menstrualStatus === 'A') {
    if (cycleChange === 'B' || cycleChange === 'C') {
      return withStageContent({
        stage: 'stage_early_transition',
        confidence: 'medium',
        note: '虽然月经每月还来，但周期的微妙变化可能意味着围绝经期已经开始。',
      });
    }

    if (age >= 40 && symptomSeverityTotal > 0.4) {
      return withStageContent({
        stage: 'stage_late_repro',
        confidence: 'medium',
        note:
          '您的月经目前还比较规律，但根据您的年龄和症状，身体的激素可能已经在悄悄变化。',
      });
    }

    return withStageContent({
      stage: 'stage_late_repro',
      confidence: 'low',
      note:
        '您目前可能还处于生育晚期，尚未正式进入围绝经期。但如果已经出现一些不适，值得持续关注。',
    });
  }

  return withStageContent({ stage: 'stage_uncertain', confidence: 'low' });
}

function addCycleChangeContributions(rawScores, overlayScores, value) {
  const normalized = normalizeCycleChangeAnswer(value);
  if (!normalized) return;

  const adjustment = CYCLE_CHANGE_ADJUSTMENTS[normalized];
  rawScores.A += adjustment.A ?? 0;
  rawScores.B += adjustment.B ?? 0;
  rawScores.C += adjustment.C ?? 0;
  rawScores.D += adjustment.D ?? 0;
  overlayScores.insulin += adjustment.insulin ?? 0;
}

function getPatternName(patternKey) {
  return PATTERN_NAMES[patternKey] ?? '当前模式';
}

function getPatternExplanation(patternKey) {
  return PATTERN_NARRATIVES[patternKey] ?? '身体正在经历一段激素变化';
}

export function adjustPriors(answers = {}, userInfo = null) {
  const priors = { A: 1, B: 1, C: 1, D: 1 };
  const overlayPriors = { thyroid: 1, insulin: 1, adrenal: 1 };
  const medicalContext = getMedicalContext(answers);
  const age = calculateAge(userInfo?.birthYear ?? answers[Q.BIRTH_YEAR]);
  const effectiveAge = age === null ? null : age + medicalContext.effectiveAgeOffset;
  const bmi = calculateBmiInfo(
    userInfo?.height ?? answers[Q.HEIGHT],
    userInfo?.weight ?? answers[Q.WEIGHT],
  );
  const menstruation = answers[Q.MENSTRUATION];
  const menstruationContext = MENSTRUATION_CONTEXT[menstruation];

  if (menstruationContext?.priors) {
    for (const key of PATTERN_KEYS) {
      const prior = menstruationContext.priors[key] ?? 0.25;
      priors[key] *= 1 + (prior - 0.25) * 0.1;
    }

    if (menstruationContext.flags?.surgicalMenopause) {
      priors.D *= 1.6;
      priors.A *= 0.7;
      priors.B *= 0.8;
    }
  }

  for (const key of PATTERN_KEYS) {
    priors[key] *= medicalContext.priorMultipliers[key] ?? 1;
  }

  if (effectiveAge !== null) {
    if (effectiveAge < 42 && (menstruation === 'A' || menstruation === 'B')) priors.A *= 1.5;
    if (effectiveAge >= 43 && effectiveAge <= 48 && (menstruation === 'B' || menstruation === 'C')) priors.C *= 1.5;
    if (effectiveAge >= 49 || menstruation === 'D' || menstruation === 'E') priors.D *= 1.8;
    if (effectiveAge < 40) priors.D *= 0.7;
    if (effectiveAge >= 53) {
      priors.A *= 0.6;
      priors.B *= 0.7;
    }
  }

  overlayPriors.thyroid *= medicalContext.thyroidRiskMultiplier;

  if (answers[Q.FAMILY_HISTORY] === 'A') {
    priors.D *= 1.3;
  }

  if (Array.isArray(answers[Q.MEDICATION]) && answers[Q.MEDICATION].includes('thyroid_med')) {
    overlayPriors.thyroid *= 1.5;
  }

  if (bmi.value !== null && age !== null) {
    if (bmi.value >= 28) {
      if (age <= 45) {
        priors.A *= 1.15;
        priors.B *= 1.0;
      } else {
        priors.B *= 1.4;
      }
      overlayPriors.insulin *= 1.5;
    } else if (bmi.value >= 24 && bmi.value < 28) {
      if (age > 45) {
        priors.B *= 1.15;
      }
      overlayPriors.insulin *= 1.2;
    } else if (bmi.value < 18.5) {
      priors.D *= 1.3;
      priors.A *= 1.15;
    }
  }

  overlayPriors.insulin *= medicalContext.insulinRiskMultiplier;

  return {
    priors,
    overlayPriors,
    age,
    effectiveAge,
    bmi,
    menstruation,
    menstrualContext: getMenstrualContext(menstruation),
    medicalContext,
    insulinRiskMultiplier: overlayPriors.insulin,
  };
}

function dedupeItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

export function interpretResult(patterns, overlays, redFlags = []) {
  const sorted = Object.entries(patterns).sort((left, right) => right[1] - left[1]);
  const top = sorted[0];
  const second = sorted[1];
  const gap = top[1] - second[1];

  let confidence;
  let narrative;

  if (top[1] >= 45 && gap >= 15) {
    confidence = 'high';
    narrative = `您的症状与「${getPatternName(top[0])}」高度吻合。这意味着${getPatternExplanation(top[0])}。我们强烈建议通过针对性检测来确认。`;
  } else if (top[1] >= 30) {
    confidence = 'moderate';
    narrative = `您的症状最接近「${getPatternName(top[0])}」，同时也有一些「${getPatternName(second[0])}」的特征。这在激素变化阶段并不少见，很多女性并非只属于一种类型，也可能处于生育期后期到围绝经期之间的过渡过程中。针对性检测能帮您进一步明确。`;
  } else {
    confidence = 'mixed';
    narrative = '您的症状分散在多种模式中，没有明显的单一倾向。这说明您可能处于早期变化阶段，或者您的情况比较复杂。建议先做一组基础的激素检查，帮助医生更准确地判断。';
  }

  let compositeInfo = null;
  if (gap < 10 && top[1] >= 25) {
    compositeInfo = {
      isComposite: true,
      patterns: [top[0], second[0]],
      message: `您的症状同时符合「${getPatternName(top[0])}」和「${getPatternName(second[0])}」两种模式的特征。这在激素过渡阶段并不少见，因为多种激素变化可以同时发生；对一部分人来说，这也可能出现在生育期后期到围绝经期的过程中（Prior, 2011）。`,
    };
  }

  const hasOverlayRisk =
    overlays.thyroid >= 40 || overlays.insulin >= 50 || overlays.adrenal >= 50;

  let testUrgency;
  if (redFlags.length) {
    testUrgency = 'urgent';
  } else if (confidence === 'high' || hasOverlayRisk) {
    testUrgency = 'recommended';
  } else if (confidence === 'moderate') {
    testUrgency = 'suggested';
  } else {
    testUrgency = 'optional';
  }

  return {
    confidence,
    narrative,
    testUrgency,
    topPattern: top[0],
    secondPattern: second[0],
    topMatch: top[1],
    secondMatch: second[1],
    gap,
    compositeInfo,
  };
}

export function generateTestRecommendations(result, answers = {}) {
  const interpretation =
    result.interpretation ?? interpretResult(result.patterns, result.overlays, result.redFlags);
  const { confidence, testUrgency, topPattern } = interpretation;
  const { overlays } = result;

  let essential = [];
  let recommended = [];
  const optional = [
    {
      name: '维生素D（25-OH-VD）',
      reason: '围绝经期女性普遍缺乏，影响骨骼、情绪和免疫。',
    },
    { name: '铁蛋白', reason: '如果月经量偏大，容易出现缺铁。' },
    { name: 'AMH（抗缪勒管激素）', reason: '评估卵巢储备，帮助了解“卵巢年龄”。' },
  ];

  if (testUrgency !== 'optional') {
    essential.push({
      name: '性激素基础检查（E2 + FSH + LH）',
      timing: shouldShowMenstrualDetailQuestions(answers) ? '月经第2-5天抽血' : '任意时间',
      reason: '这是了解您当前激素水平的基础检查，无论处于哪种变化模式都建议优先做。',
    });
  }

  if (topPattern === 'A' || topPattern === 'B') {
    const progesteroneItem = {
      name: '黄体中期孕酮（P）',
      timing: '月经第21天左右',
      reason: '您的症状提示孕激素可能偏低，这项检测可以帮助直接确认。',
    };

    if (confidence === 'high') {
      essential.push(progesteroneItem);
    } else {
      recommended.push(progesteroneItem);
    }
  }

  if (topPattern === 'B' && confidence !== 'mixed') {
    essential.push({
      name: '盆腔超声',
      timing: '月经结束后3-5天',
      reason: '您的月经量和周期变化提示需要排查子宫肌瘤、内膜增厚或息肉等情况。',
    });
  }

  if (topPattern === 'D') {
    recommended.push(
      {
        name: '骨密度检测（DEXA）',
        timing: '任意时间',
        reason: '雌激素下降后骨质流失会加速，建议了解当前骨密度状态。',
      },
      {
        name: '血脂四项',
        timing: '空腹',
        reason: '雌激素下降后心血管风险会上升，建议顺便评估血脂水平。',
      },
    );
  }

  if ((result.thyroid?.riskPercent ?? overlays.thyroid) >= 30) {
    essential.push({
      name: 'TSH + FT3 + FT4 + TPOAb',
      timing: '任意时间空腹',
      reason:
        result.thyroid?.reason ??
        `您的甲状腺风险评分为 ${result.thyroid?.riskPercent ?? overlays.thyroid}%。围绝经期和甲状腺问题症状重叠很多，这组检查有助于尽快区分。`,
    });
  } else if (result.thyroid?.shouldRecommendTSH) {
    recommended.push({
      name: 'TSH（甲状腺功能初筛）',
      timing: '任意时间',
      reason:
        result.thyroid?.reason ??
        '围绝经期与甲状腺功能异常有超过 70% 的症状重叠，建议先做基础筛查。',
    });
  }

  if (overlays.insulin >= 50) {
    essential.push({
      name: '空腹血糖 + 空腹胰岛素（计算HOMA-IR）',
      timing: '早上空腹抽血',
      reason: result.medicalContext?.flags?.pcos
        ? `您的胰岛素抵抗风险评分为 ${overlays.insulin}%。PCOS 与胰岛素抵抗风险相关，建议结合代谢检查进一步评估。`
        : `您的胰岛素抵抗风险评分为 ${overlays.insulin}%。建议结合代谢检查进一步评估。`,
    });
  } else if (overlays.insulin >= 35) {
    recommended.push({
      name: '空腹血糖 + 糖化血红蛋白（HbA1c）',
      timing: '空腹',
      reason: result.medicalContext?.flags?.pcos
        ? 'PCOS 与胰岛素抵抗风险相关，建议先做基础代谢筛查。'
        : '您有一些血糖调节方面的信号，建议先做基础筛查。',
    });
  }

  if (overlays.adrenal >= 50) {
    recommended.push({
      name: '晨间皮质醇（8:00 AM）+ DHEA-S',
      timing: '早上8点前空腹',
      reason: '您的压力和疲劳评分较高，建议顺手评估肾上腺相关指标。',
    });
  }

  if (testUrgency === 'optional') {
    return {
      urgency: TEST_URGENCY_META.optional,
      essential: [],
      recommended: [
        {
          name: '性激素基础检查（E2 + FSH + LH）+ TSH',
          timing: shouldShowMenstrualDetailQuestions(answers) ? '月经第2-5天或任意时间' : '任意时间',
          reason: '您目前的症状较轻。如果想先了解自己的激素水平，这会是一组足够基础的安心检查。',
        },
      ],
      optional,
      summary:
        '好消息是，您目前的症状评分较低，没有看到特别集中的激素失衡信号。可以先观察，如果未来 3～6 个月症状加重，再安排检测也不迟。',
    };
  }

  return {
    urgency: TEST_URGENCY_META[testUrgency],
    essential: dedupeItems(essential),
    recommended: dedupeItems(recommended),
    optional: dedupeItems(optional),
    summary: null,
  };
}

export function calculate(answers = {}) {
  const rawScores = { A: 0, B: 0, C: 0, D: 0 };
  const overlayScores = { thyroid_hypo: 0, thyroid_hyper: 0, insulin: 0, adrenal: 0 };
  const redFlags = getTriggeredRedFlags(answers);
  const { priors, overlayPriors, age, bmi, menstrualContext, medicalContext } = adjustPriors(answers);

  for (const questionId of STANDARD_SCALE_QUESTIONS) {
    const value = toNumber(answers[questionId]);
    if (value === null) continue;
    addScaleContributions(rawScores, overlayScores, questionId, value);
  }

  addFlowChangeContributions(rawScores, answers[Q.FLOW_CHANGE]);
  addCycleChangeContributions(rawScores, overlayScores, answers[Q.CYCLE_CHANGE]);

  if (Array.isArray(answers[Q.PMS_SYMPTOMS]) && !answers[Q.PMS_SYMPTOMS].includes('none')) {
    let score = answers[Q.PMS_SYMPTOMS].length * 2;
    if (answers[Q.PMS_SYMPTOMS].length >= 3) score += 2;
    rawScores.A += score * 3;
    rawScores.B += score * 4;
    rawScores.C += score * 2;
  }

  if (answers[Q.TEMPERATURE_SENSITIVITY] === 'A') {
    overlayScores.thyroid_hypo += 4;
  } else if (answers[Q.TEMPERATURE_SENSITIVITY] === 'B') {
    overlayScores.thyroid_hyper += 3;
    rawScores.D += 2;
  } else if (answers[Q.TEMPERATURE_SENSITIVITY] === 'C') {
    rawScores.C += 2;
    rawScores.D += 2;
  }

  if (medicalContext.flags.pcos) {
    overlayScores.insulin += 19;
  }

  const adjustedScores = PATTERN_KEYS.reduce((accumulator, key) => {
    accumulator[key] = rawScores[key] * priors[key];
    return accumulator;
  }, {});

  const weightedTotal = PATTERN_KEYS.reduce(
    (sum, key) => sum + Math.max(1, adjustedScores[key]),
    0,
  );

  const patterns = PATTERN_KEYS.reduce((accumulator, key) => {
    accumulator[key] = Math.round((Math.max(1, adjustedScores[key]) / weightedTotal) * 100);
    return accumulator;
  }, {});

  const patternDiff = 100 - Object.values(patterns).reduce((sum, value) => sum + value, 0);
  const highestPatternKey = PATTERN_KEYS.reduce((best, current) =>
    patterns[current] >= patterns[best] ? current : best,
  );
  patterns[highestPatternKey] += patternDiff;

  const thyroidTotal = overlayScores.thyroid_hypo + overlayScores.thyroid_hyper;
  const thyroidDominant = Math.max(overlayScores.thyroid_hypo, overlayScores.thyroid_hyper);
  const thyroidRisk = clamp(
    Math.round(((thyroidDominant * overlayPriors.thyroid) / 110) * 100),
    0,
    100,
  );
  const insulinRisk = clamp(
    Math.round(((overlayScores.insulin * overlayPriors.insulin) / 60) * 100),
    0,
    100,
  );
  const adrenalRisk = clamp(
    Math.round((overlayScores.adrenal / 90) * 100),
    0,
    100,
  );

  let thyroidDirection = 'normal';
  if (overlayScores.thyroid_hypo > overlayScores.thyroid_hyper + 3) thyroidDirection = 'hypo';
  else if (overlayScores.thyroid_hyper > overlayScores.thyroid_hypo + 3) thyroidDirection = 'hyper';
  else if (thyroidTotal > 8) thyroidDirection = 'mixed';

  const overlays = {
    thyroid: thyroidRisk,
    insulin: insulinRisk,
    adrenal: adrenalRisk,
  };

  const primaryPattern = PATTERN_KEYS.reduce((best, current) =>
    patterns[current] >= patterns[best] ? current : best,
  );

  const interpretation = interpretResult(patterns, overlays, redFlags);
  const baseStrawStage = determineSTRAWStage(buildStagingInputs(answers, patterns));
  const strawStage = {
    ...baseStrawStage,
    confidence: applyConfidencePenalty(baseStrawStage.confidence, medicalContext.confidencePenalty),
  };
  const hasSignificantSymptoms = Math.max(...Object.values(patterns)) >= 45;
  const thyroidNeedsTest = thyroidRisk >= 30;
  const shouldRecommendTSH = thyroidNeedsTest || hasSignificantSymptoms || Boolean(medicalContext.thyroidFlag);
  const thyroidAssessment = {
    riskPercent: thyroidRisk,
    needsTest: shouldRecommendTSH,
    shouldRecommendTSH,
    reason: medicalContext.thyroidFlag
      ? '您已有甲状腺相关病史，建议持续随访甲状腺功能'
      : thyroidNeedsTest
        ? '您的部分症状可能与甲状腺功能相关'
        : hasSignificantSymptoms
          ? '围绝经期与甲状腺功能异常有超过 70% 的症状重叠（Ruf 2023），建议同时排查'
          : null,
  };

  const result = {
    patterns,
    overlays,
    thyroidDirection,
    redFlags,
    primaryPattern,
    age,
    bmi,
    interpretation,
    compositeInfo: interpretation.compositeInfo,
    thyroid: thyroidAssessment,
    menstrualContext,
    medicalContext,
    strawStage,
    straw_stage: strawStage,
    hormone_pattern: {
      primary: `pattern${primaryPattern}`,
      score: patterns[primaryPattern] / 100,
      secondary: `pattern${interpretation.secondPattern}`,
      secondaryScore: interpretation.secondMatch / 100,
      isComplex: Boolean(interpretation.compositeInfo?.isComposite),
    },
    risk_flags: {
      thyroid: thyroidAssessment.shouldRecommendTSH,
      insulinResistance: overlays.insulin >= 35,
      earlyMenopause: strawStage.flag === 'early_menopause' || Boolean(medicalContext.flags.earlyMenopause),
      surgicalMenopause: Boolean(menstrualContext?.flags?.surgicalMenopause),
      poi: Boolean(medicalContext.flags.poi),
      chemoHistory: Boolean(medicalContext.flags.chemoHistory),
      pcos: Boolean(medicalContext.flags.pcos),
    },
  };

  return {
    ...result,
    testRecommendations: generateTestRecommendations(result, answers),
  };
}

export function getOverlayMaxima() {
  const scaleWeights = questions
    .filter((question) => typeof question.weights === 'object')
    .reduce(
      (accumulator, question) => {
        accumulator.thyroid += question.weights.thyroid ?? 0;
        accumulator.insulin += question.weights.insulin ?? 0;
        accumulator.adrenal += question.weights.adrenal ?? 0;
        return accumulator;
      },
      { thyroid: 0, insulin: 0, adrenal: 0 },
    );

  return scaleWeights;
}
