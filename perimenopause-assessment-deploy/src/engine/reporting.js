import {
  generateTestRecommendations,
  getCycleChangeScore,
  interpretResult,
} from './calculator.js';
import { Q } from '../data/constants.js';
import {
  lifestyleAdvice,
  overlayDescriptions,
  patternDescriptions,
} from '../data/recommendations.js';

const RISK_ORDER = ['thyroid', 'insulin', 'adrenal'];
const ACTION_TONE = {
  learn_more: { label: '了解更多', color: '#5B8DEF' },
  daily: { label: '日常管理', color: '#66BB6A' },
};
const ACTION_CARD_MAX = 3;
const RISK_STATUS = {
  low: { statusLabel: '暂无明显风险', color: '#A8C5A0', icon: 'good' },
  medium: { statusLabel: '需关注', color: '#D4A76A', icon: 'watch' },
  high: { statusLabel: '建议检查', color: '#E8937E', icon: 'alert' },
};

function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

function getConfidencePrefix(confidence) {
  if (confidence === 'high') return '根据您的月经和症状情况，您目前很可能处于';
  if (confidence === 'medium') return '综合您的年龄和症状来看，您目前可能正处于';
  return '根据目前的信息，我们初步推测您可能处于';
}

const STAGE_CONFIDENCE_LABELS = {
  low: '可能',
  medium: '较可能',
  high: '很可能',
};

const PATTERN_DISPLAY_NAMES = {
  A: {
    label: '孕激素减退型',
    summary: '孕激素先于雌激素下降，可能出现经期变化、乳房胀痛、情绪波动',
    typicalStage: '早期过渡（STRAW -2）',
    mechanism: '孕激素下降会削弱睡眠和情绪的稳定感，经前不适也可能更明显。',
    checks: ['黄体中期孕酮', '基础 FSH', '雌二醇（E2）'],
  },
  B: {
    label: '激素波动失衡型',
    summary: '雌激素和孕激素不同步变化，雌激素可能相对偏高，出现胀气、头痛、经量增多',
    typicalStage: '早期至晚期过渡（STRAW -2 至 -1）',
    mechanism: '雌激素与孕激素不同步时，乳房胀痛、经量变化和水肿感会更突出。',
    checks: ['雌二醇（E2）', '孕酮', '子宫内膜超声'],
  },
  C: {
    label: '激素剧烈波动型',
    summary: '激素水平在高低之间大幅波动，症状时有时无、变化无常',
    typicalStage: '晚期过渡（STRAW -1）',
    mechanism: '雌激素忽高忽低会牵动体温调节、睡眠和情绪系统，所以症状可能一阵一阵出现。',
    checks: ['FSH', '雌二醇（E2）', '月经周期记录'],
  },
  D: {
    label: '雌激素显著减退型',
    summary: '雌激素水平明显降低，出现潮热、阴道干涩等典型症状',
    typicalStage: '晚期过渡至早期绝经后（STRAW -1 至 +1）',
    mechanism: '雌激素持续偏低会影响体温调节、泌尿生殖组织、骨密度和睡眠质量。',
    checks: ['FSH', '雌二醇（E2）', '骨密度 DEXA'],
  },
};

const SYMPTOM_DOMAINS = [
  {
    key: 'vasomotor',
    name: '血管舒缩症状',
    shortName: '血管舒缩',
    description: '潮热的频率与严重程度',
    max: 4,
    items: [Q.HOT_FLASH],
  },
  {
    key: 'psychological',
    name: '情绪与认知',
    shortName: '情绪认知',
    description: '焦虑紧张和睡眠相关变化',
    max: 8,
    items: [Q.ANXIETY, Q.SLEEP],
  },
  {
    key: 'urogenital',
    name: '泌尿生殖',
    shortName: '泌尿生殖',
    description: '阴道干涩和反复泌尿生殖感染线索',
    max: 6,
    items: [Q.VAGINAL_DRYNESS],
    extraScore: (answers) => ((answers[Q.VAGINAL_DRYNESS] ?? 0) >= 2 ? 2 : 0),
  },
  {
    key: 'somatic',
    name: '躯体症状',
    shortName: '躯体症状',
    description: '关节僵硬或疼痛等身体变化',
    max: 4,
    items: [Q.JOINT_PAIN],
  },
  {
    key: 'paresthesia',
    name: '感觉异常',
    shortName: '感觉异常',
    description: '怕冷、怕热或忽冷忽热等温度敏感变化',
    max: 4,
    items: [],
    score: (answers) => {
      const value = answers[Q.TEMPERATURE_SENSITIVITY];
      if (value === 'A') return 4;
      if (value === 'B') return 3;
      if (value === 'C') return 2;
      return 0;
    },
  },
];

const SEVERITY_TONE = {
  '无/轻微': { color: '#A5D6A7', bg: '#EEF7EF' },
  '轻度': { color: '#90CAF9', bg: '#EFF6FF' },
  '中度': { color: '#FFB74D', bg: '#FFF7ED' },
  '重度': { color: '#EF5350', bg: '#FEF2F2' },
};

function scaleToFour(value) {
  const number = Number(value) || 0;
  return Math.round((Math.max(0, Math.min(3, number)) / 3) * 4);
}

function getBodySignSeverity(value) {
  if (!Array.isArray(value)) return 0;
  if (value.includes('high_hr') || value.includes('low_hr')) return 3;
  return 0;
}

function getSeverityLevel(score, max) {
  const ratio = max > 0 ? score / max : 0;
  if (ratio <= 0.15) return '无/轻微';
  if (ratio <= 0.35) return '轻度';
  if (ratio <= 0.6) return '中度';
  return '重度';
}

function getSeverityDisplayMode(domains, totalLevel) {
  const hasModerateOrAbove = domains.some((domain) => domain.ratio > 0.35);
  return ['中度', '重度'].includes(totalLevel) || hasModerateOrAbove ? 'detail' : 'summary';
}

function generateSeveritySummary(domains, totalLevel, totalTone) {
  const nonzero = domains
    .filter((domain) => domain.score > 0)
    .sort((left, right) => right.score / right.max - left.score / left.max);

  if (!nonzero.length) {
    return {
      label: totalLevel,
      tone: totalTone,
      paragraphs: [
        '目前你没有报告明显的围绝经期相关症状。这并不意味着身体没有在变化，有些变化是悄悄发生的。',
        '了解自己所处的阶段，就是很好的准备。',
      ],
    };
  }

  if (totalLevel === '无/轻微') {
    const mentions = nonzero.slice(0, 2).map((domain) => domain.name).join('和');
    return {
      label: totalLevel,
      tone: totalTone,
      paragraphs: [
        '目前你报告的各项症状都比较轻微，身体可能已经开始出现一些细微变化，但整体还没有对日常生活造成明显影响。',
        `你提到在${mentions}方面有轻微感受，这在这个阶段很常见，值得留意。`,
      ],
    };
  }

  return {
    label: totalLevel,
    tone: totalTone,
    paragraphs: [
      '你目前有一些轻度的围绝经期相关症状。这些变化说明身体正在经历过渡，大多数情况下可以通过生活方式调整来应对。',
      `其中${nonzero[0].name}方面相对更明显一些。`,
    ],
  };
}

function getStageConfidenceLabel(stageResult) {
  if (!stageResult) return '可能';
  if (stageResult.stage === 'stage_early_postmeno') return '高度可能';
  return STAGE_CONFIDENCE_LABELS[stageResult.confidence] ?? '可能';
}

function getStageDisplayTitle(stageResult) {
  if (!stageResult) return '阶段待判断';
  if (stageResult.stage === 'stage_uncertain') {
    return stageResult.inferredStageContent?.title ?? stageResult.content?.title ?? '需结合检测判断';
  }
  return stageResult.content?.title ?? '阶段待判断';
}

function getStageEvidence(result, answers = {}) {
  const status = answers[Q.MENSTRUATION];
  const cycle = answers[Q.CYCLE_CHANGE];
  const hasVasomotor = (answers[Q.HOT_FLASH] ?? 0) >= 1;

  if (status === 'F') return '使用曼月乐时月经不能直接反映卵巢分期，建议结合 FSH 和 E2。';
  if (status === 'G') return '子宫切除后缺少月经参照，分期需结合 FSH、E2 和 AMH。';
  if (status === 'H') return '双侧卵巢切除后已进入手术性绝经状态。';
  if (status === 'I') return '月经缺失原因较复杂，建议由医生结合激素检测判断。';
  if (status === 'E') return '停经已超过 12 个月，符合绝经后阶段的月经标准。';
  if (status === 'D') return '月经已超过半年没来，接近绝经后早期的过渡特征。';
  if (status === 'C') return `你的月经已出现跳月（≥60天间隔）${hasVasomotor ? '，并伴有潮热' : ''}。`;
  if (status === 'B' && cycle === 'E') return '你的周期已难以预测，接近晚期过渡期特征。';
  if (status === 'B') return '你的月经仍会来，但周期前后相差已超过一周。';
  return '你的月经仍较规律，当前更像生育晚期到早期过渡。';
}

function getProminentSymptoms(answers = {}) {
  const candidates = [
    [Q.HOT_FLASH, '潮热'],
    [Q.SLEEP, '睡眠变浅'],
    [Q.ANXIETY, '焦虑紧张'],
    [Q.VAGINAL_DRYNESS, '阴道干涩'],
    [Q.JOINT_PAIN, '关节僵硬'],
  ];

  return candidates
    .filter(([questionId]) => (answers[questionId] ?? 0) >= 1)
    .sort((left, right) => (answers[right[0]] ?? 0) - (answers[left[0]] ?? 0))
    .slice(0, 3)
    .map(([, label]) => label);
}

function trimSentenceEnding(text) {
  return String(text ?? '').replace(/[。；;,.，\s]+$/u, '');
}

function getSexHormoneTiming(q2Answer) {
  if (['A', 'B'].includes(q2Answer)) return '建议在月经第 2-5 天空腹抽血。';
  if (q2Answer === 'C') return '月经不规律时可随时抽血，结果作为基础水平参考。';
  return '已闭经或月经无法作为参照时，可随时抽血检查。';
}

function hasThyroidHistory(answers = {}) {
  const q5 = Array.isArray(answers[Q.SURGERY]) ? answers[Q.SURGERY] : [];
  return q5.includes('thyroid_surgery') || q5.includes('thyroid_disorder');
}

function shouldRecommendBoneDensity(result) {
  const stage = result.straw_stage?.stage;
  const inferredStage = result.straw_stage?.inferredStage;
  return (
    ['stage_late_transition', 'stage_early_postmeno', 'stage_late_postmeno', 'stage_surgical_meno'].includes(
      stage,
    ) ||
    ['stage_early_postmeno', 'stage_late_postmeno'].includes(inferredStage) ||
    (result.age ?? 0) >= 50
  );
}

export function generateLabRecommendations(result, answers = {}) {
  const q2 = answers[Q.MENSTRUATION];
  const labs = [];
  const severity = generateSymptomSeverity(answers);
  const metabolicDomain = findSeverityDomain(severity, 'metabolic');

  if (q2 !== 'H') {
    labs.push({
      key: 'sex_hormones',
      name: '性激素六项',
      english: 'Sex Hormone Panel',
      items: 'FSH、LH、E2、孕酮、睾酮、泌乳素',
      description: '这是评估生殖内分泌功能的基础组套，可帮助判断卵巢功能、雌激素状态、是否排卵，并辅助排除 PCOS 或其他内分泌异常。',
      timing: getSexHormoneTiming(q2),
      priority: 1,
    });
    labs.push({
      key: 'amh',
      name: 'AMH（抗缪勒管激素）',
      english: 'Anti-Müllerian Hormone',
      description: 'AMH 可以帮助了解卵巢的“库存”还有多少，是评估卵巢储备相对稳定的指标。',
      timing: '不受月经周期影响，任何时间都可以查。',
      priority: 2,
    });
  } else {
    labs.push({
      key: 'sex_hormones_limited',
      name: '性激素六项（参考意义有限）',
      note: '由于双侧卵巢已切除，性激素六项和 AMH 的诊断意义有限。建议直接与医生讨论绝经后健康管理方案。',
      priority: 1,
    });
  }

  const thyroidHistory = hasThyroidHistory(answers);
  const patternScores = Object.values(result.patterns ?? {}).map((value) => Number(value) || 0);
  const thyroidTriggered =
    thyroidHistory ||
    result.thyroid?.shouldRecommendTSH ||
    (result.overlays?.thyroid ?? 0) >= 30 ||
    Math.max(...patternScores, 0) >= 45;

  if (thyroidTriggered) {
    const thyroidPanelName = thyroidHistory ? '甲状腺功能七项' : '甲状腺功能五项';
    const thyroidPanelItems = thyroidHistory
      ? 'TSH、FT3、FT4、TT3、TT4、TPOAb、TGAb'
      : 'TSH、FT3、FT4、TT3、TT4';

    labs.push({
      key: 'thyroid',
      name: thyroidPanelName,
      english: 'Thyroid Function Panel',
      items: thyroidPanelItems,
      description: thyroidHistory
        ? '你有甲状腺手术或甲状腺疾病史，建议用包含甲状腺自身抗体的组套做定期监测。'
        : '甲状腺功能异常的症状与更年期症状高度重叠，甲功五项更接近国内医院常见开单组套。',
      timing: '空腹或非空腹均可，建议上午检查。',
      priority: 3,
    });
  }

  if ((result.overlays?.insulin ?? 0) >= 40 || metabolicDomain?.isEmphasized) {
    labs.push({
      key: 'metabolic',
      name: '代谢相关检查',
      english: 'Metabolic Panel',
      items:
        (result.overlays?.insulin ?? 0) >= 55 || metabolicDomain?.level === '重度'
          ? '空腹血糖、空腹胰岛素、糖化血红蛋白（HbA1c）'
          : '空腹血糖、空腹胰岛素',
      description: '围绝经期雌激素下降可能加速胰岛素抵抗的发展，尤其在体重偏高或腰腹增重时更值得关注。',
      timing: '空腹 8-12 小时后抽血。',
      priority: 4,
    });
  }

  if (shouldRecommendBoneDensity(result)) {
    labs.push({
      key: 'bone',
      name: '骨密度检查（DXA）',
      english: 'Bone Mineral Density - DXA Scan',
      description: '雌激素减少会加速骨量流失，建议了解当前骨密度基线。',
      timing: '非抽血检查，需要到医院骨科或影像科预约。',
      priority: 5,
    });
  }

  return labs.sort((left, right) => left.priority - right.priority);
}

function getTriggerMatch(trigger, answers) {
  const value = answers?.[trigger.questionId];
  const comparableValue =
    trigger.questionId === Q.CYCLE_CHANGE ? getCycleChangeScore(value) : value;

  if (trigger.minScore !== undefined && typeof comparableValue === 'number') {
    return comparableValue >= trigger.minScore;
  }

  if (trigger.equals !== undefined) {
    return comparableValue === trigger.equals;
  }

  if (trigger.includes !== undefined && Array.isArray(value)) {
    return value.includes(trigger.includes);
  }

  return false;
}

function getRelatedLabels(triggers = [], answers = {}) {
  const labels = [];

  for (const trigger of triggers) {
    if (getTriggerMatch(trigger, answers)) {
      labels.push(trigger.label);
    }
  }

  return [...new Set(labels)];
}

function getRiskLevel(value) {
  if (value < 30) return 'low';
  if (value < 50) return 'medium';
  return 'high';
}

export function getPatternSummary(primaryPattern) {
  return patternDescriptions[primaryPattern] ?? patternDescriptions.C;
}

export function generateSymptomSeverity(answers = {}) {
  const domains = SYMPTOM_DOMAINS.map((domain) => {
    const baseScore =
      domain.score?.(answers) ??
      domain.items.reduce(
        (sum, questionId) => sum + scaleToFour(answers[questionId]),
        0,
      );
    const score = Math.min(domain.max, baseScore + (domain.extraScore?.(answers) ?? 0));
    const level = getSeverityLevel(score, domain.max);

    return {
      key: domain.key,
      name: domain.name,
      shortName: domain.shortName,
      description: domain.description,
      score,
      max: domain.max,
      level,
      tone: SEVERITY_TONE[level],
      ratio: domain.max > 0 ? score / domain.max : 0,
      isEmphasized: score / domain.max > 0.35,
    };
  });

  const totalScore = domains.reduce((sum, domain) => sum + domain.score, 0);
  const totalMax = domains.reduce((sum, domain) => sum + domain.max, 0);
  const totalLevel = getSeverityLevel(totalScore, totalMax);
  const totalTone = SEVERITY_TONE[totalLevel];
  const displayMode = getSeverityDisplayMode(domains, totalLevel);

  return {
    domains,
    total: {
      score: totalScore,
      max: totalMax,
      level: totalLevel,
      tone: totalTone,
      needsCareDiscussion: totalScore >= 14,
    },
    displayMode,
    summary: displayMode === 'summary' ? generateSeveritySummary(domains, totalLevel, totalTone) : null,
  };
}

export function buildPatternDisplay(result) {
  const sorted = Object.entries(result.patterns ?? {})
    .map(([key, value]) => [key, (Number(value) || 0) / 100])
    .sort((left, right) => right[1] - left[1]);
  const [top1, top2] = sorted;

  if (!top1 || top1[1] < 0.35) {
    return {
      primary: null,
      secondary: null,
      isComplex: false,
      fallbackMessage: '你目前的身体变化还处于比较早期的阶段。',
    };
  }

  const level = top1[1] >= 0.55 ? '高度吻合' : '中度吻合';
  const stars = top1[1] >= 0.55 ? '★★★' : '★★☆';
  const gap = top1[1] - (top2?.[1] ?? 0);
  const showSecondary = top2 && top2[1] >= 0.2 && gap < 0.1 && top1[1] < 0.55;

  const primaryInfo = PATTERN_DISPLAY_NAMES[top1[0]];
  const secondaryInfo = showSecondary ? PATTERN_DISPLAY_NAMES[top2[0]] : null;

  return {
    primary: {
      key: top1[0],
      label: primaryInfo.label,
      stars,
      level,
      summary: primaryInfo.summary,
      typicalStage: primaryInfo.typicalStage,
      mechanism: primaryInfo.mechanism,
      checks: primaryInfo.checks,
    },
    secondary: secondaryInfo
      ? {
          key: top2[0],
          label: secondaryInfo.label,
          stars: '★★☆',
          level: '中度吻合',
          summary: secondaryInfo.summary,
          typicalStage: secondaryInfo.typicalStage,
          mechanism: secondaryInfo.mechanism,
          checks: secondaryInfo.checks,
        }
      : null,
    isComplex: Boolean(secondaryInfo),
  };
}

export function getOverlaySummary(result) {
  return {
    thyroid:
      overlayDescriptions.thyroid[result.thyroidDirection] ??
      overlayDescriptions.thyroid.normal,
    insulin: overlayDescriptions.insulin,
    adrenal: overlayDescriptions.adrenal,
  };
}

export function buildResultHero(result) {
  const pattern = getPatternSummary(result.primaryPattern);
  const interpretation =
    result.interpretation ?? interpretResult(result.patterns, result.overlays, result.redFlags);
  const riskHighlights = buildRiskHighlights(result)
    .filter((item) => item.value >= 30)
    .sort((left, right) => right.value - left.value);

  return {
    eyebrow: '根据您的回答，我们发现：',
    title: pattern.name,
    subtitle: pattern.subtitle ?? pattern.heroSubtitle ?? pattern.description,
    matchValue: interpretation.topMatch,
    confidence: interpretation.confidence,
    narrative: interpretation.narrative,
    urgencyLabel: interpretation.testUrgency,
    secondaryPatternName:
      interpretation.confidence === 'moderate'
        ? getPatternSummary(interpretation.secondPattern).name
        : null,
    secondaryRiskLabel: riskHighlights[0]?.label ?? '暂无明显叠加风险',
    color: pattern.color,
  };
}

export function buildRiskHighlights(result) {
  const overlaySummary = getOverlaySummary(result);

  return RISK_ORDER.map((key) => {
    const value = result.overlays[key];
    const level = getRiskLevel(value);
    const status = RISK_STATUS[level];
    const summary = overlaySummary[key];

    return {
      key,
      label: summary.name,
      value,
      level,
      statusLabel: status.statusLabel,
      color: status.color,
      icon: status.icon,
      showDetails: value >= 30,
      description: summary.description,
    };
  });
}

export function buildTestRecommendations(result, answers = {}) {
  return generateTestRecommendations(result, answers);
}

export function buildLifestyleCards(result, answers = {}) {
  const collected = [
    ...(lifestyleAdvice.patterns[result.primaryPattern] ?? []),
    ...(result.overlays.thyroid >= 40 ? lifestyleAdvice.overlays.thyroid : []),
    ...(result.overlays.insulin >= 40 ? lifestyleAdvice.overlays.insulin : []),
    ...(result.overlays.adrenal >= 40 ? lifestyleAdvice.overlays.adrenal : []),
  ];

  return dedupeByTitle(collected)
    .map((item) => ({
      ...item,
      relatedLabels: getRelatedLabels(item.triggers, answers),
    }))
    .slice(0, 4);
}

export function generateHeroSection(result, answers = {}) {
  const stage = result.straw_stage;

  const timeline =
    stage?.stage === 'stage_uncertain'
      ? {
          type: 'uncertain',
          text: '由于您的月经信息无法直接用于判断，以下结论基于您的症状和年龄推断。',
          inferredStage: stage.inferredStage,
          inferredLabel: stage.inferredStageContent?.title,
        }
      : {
          type: stage?.stage === 'stage_surgical_meno' ? 'special' : 'timeline',
          stage: stage?.stage,
          confidence: stage?.confidence,
        };

  const stageTitle = getStageDisplayTitle(stage);

  return {
    timeline,
    headline: '你的阶段判断',
    stageLabel: stageTitle,
    stageConfidenceLabel: getStageConfidenceLabel(stage),
    stageTitle,
    evidence: getStageEvidence(result, answers),
  };
}

function getEarlyChangeStageParagraph(stage) {
  if (stage?.stage === 'stage_late_repro') {
    return '在这个时期，卵巢功能已经开始悄悄调整。AMH、抑制素B和黄体期孕酮可能先出现变化，但月经周期还没有被明显打乱。';
  }

  if (stage?.stage === 'stage_early_transition') {
    return '你的月经周期已经出现一些变化，说明卵巢的激素分泌正在调整中。不过目前的感受还比较分散，多数变化仍然轻微。';
  }

  return '卵巢功能的变化是一个渐进的过程。你可能在不同方面感受到一些零星变化，这些都属于常见的过渡信号。';
}

function getMedicalContextNarrative(result, answers = {}) {
  if (hasThyroidHistory(answers)) {
    return '你有甲状腺相关病史，甲状腺功能变化的感受与围绝经期症状容易重叠。';
  }

  if (result.medicalContext?.flags?.chemoHistory) {
    return '化疗或放疗经历可能影响卵巢储备，月经恢复并不总能代表卵巢功能完全恢复。';
  }

  if (result.medicalContext?.flags?.pcos) {
    return 'PCOS 会让月经和代谢线索更复杂，围绝经期节奏可能和一般情况不同。';
  }

  if (result.medicalContext?.flags?.poi) {
    return '既往早发性卵巢功能不全提示卵巢功能更早出现衰退，长期低雌激素状态会影响骨骼和心血管健康。';
  }

  return null;
}

function generateEarlyChangeNarrative(stage, symptoms, result, answers = {}) {
  const paragraphs = [
    '你目前的身体变化还处于比较早期的阶段。',
    getEarlyChangeStageParagraph(stage),
  ];
  const context = [];

  if (symptoms.length) {
    context.push(`你提到在${symptoms.join('、')}方面有一些感受，这些在变化初期都很常见。`);
  }

  const medicalNarrative = getMedicalContextNarrative(result, answers);
  if (medicalNarrative) context.push(medicalNarrative);

  if (context.length) {
    paragraphs.push(context.join('另外，'));
  } else {
    paragraphs.push('围绝经期的激素变化不是某一天突然开始的，而是一个渐进的过程。现在正是了解自己身体、建立健康基线的好时机。');
  }

  return paragraphs;
}

function shouldUseEarlyChangeFrame(stage, severity) {
  const earlyStage = ['stage_late_repro', 'stage_early_transition'].includes(stage?.stage);
  const hasModerateBurden = ['中度', '重度'].includes(severity.total.level);
  const hasEmphasizedDomain = severity.domains.some((domain) => domain.isEmphasized);
  return earlyStage && !hasModerateBurden && !hasEmphasizedDomain;
}

function getProminentDomainNames(severity) {
  return severity.domains
    .filter((domain) => domain.isEmphasized)
    .sort((left, right) => right.ratio - left.ratio)
    .map((domain) => domain.shortName);
}

function generateMultiSignalNarrative(stage, symptoms, severity, result, answers = {}) {
  const domains = getProminentDomainNames(severity);
  const domainText = domains.length ? domains.join('、') : '多个方面';
  const paragraphs = [
    stage?.stage === 'stage_late_transition'
      ? `你的月经已经出现跳月，身体更接近围绝经晚期。虽然单一激素变化线索还没有特别突出，但${domainText}方面的症状已经比较明确。`
      : `你的症状不是集中在单一变化线索上，而是分布在${domainText}等方面，这更像是多个系统同时参与的过渡期表现。`,
    '这类情况在围绝经期并不少见：卵巢激素波动、泌尿生殖组织变化和代谢节奏改变可能同时发生，所以报告会更看重阶段、症状负担和具体行动，而不是强行归到某一种模式。',
  ];

  const context = [];
  if (symptoms.length) {
    context.push(`你提到的${symptoms.join('、')}，可以和上面的高分维度一起理解。`);
  }
  const medicalNarrative = getMedicalContextNarrative(result, answers);
  if (medicalNarrative) context.push(medicalNarrative);
  if (context.length) paragraphs.push(context.join('另外，'));

  return paragraphs;
}

export function generateNarrativeExplanation(result, answers = {}) {
  const stage = result.straw_stage;
  const patternDisplay = buildPatternDisplay(result);
  const severity = generateSymptomSeverity(answers);
  const symptoms = getProminentSymptoms(answers);
  const paragraphs = [];

  if (patternDisplay.primary) {
    paragraphs.push(
      `你目前的症状组合${symptoms.length ? `，尤其是${symptoms.join('、')}` : ''}，与「${patternDisplay.primary.label}」的特征${patternDisplay.primary.level}（${patternDisplay.primary.stars}）。${patternDisplay.primary.summary}。这种变化模式在${patternDisplay.primary.typicalStage}阶段最为常见。`,
    );

    if (patternDisplay.secondary) {
      paragraphs.push(
        `同时，你的部分症状也符合「${patternDisplay.secondary.label}」的特征，这说明激素变化可能同时涉及两种模式，这在绝经过渡期很常见。`,
      );
    }
  } else if (shouldUseEarlyChangeFrame(stage, severity)) {
    paragraphs.push(...generateEarlyChangeNarrative(stage, symptoms, result, answers));
  } else {
    paragraphs.push(...generateMultiSignalNarrative(stage, symptoms, severity, result, answers));
  }

  const stageBody = stage?.stage === 'stage_uncertain'
    ? '这类情况需要更多依赖年龄、潮热、睡眠情绪、泌尿生殖症状和整体风险信号。这样的推断适合作为观察身体变化的参考。'
    : stage?.content?.body;
  if (patternDisplay.primary && stageBody) paragraphs.push(stageBody);

  const riskParts = [];
  if (result.bmi?.value !== null && result.bmi?.value >= 24) {
    riskParts.push(`您的 BMI 为 ${result.bmi.value.toFixed(1)}（${result.bmi.category}范围），体脂偏高会影响雌激素代谢和胰岛素敏感性`);
  }
  if (result.overlays.insulin >= 35) {
    riskParts.push('结合 PCOS 或体重相关风险，胰岛素抵抗值得关注');
  }
  if (result.thyroid?.shouldRecommendTSH && !hasThyroidHistory(answers)) {
    riskParts.push('甲状腺功能变化和更年期症状有较高重叠');
  }
  const medicalNarrative = getMedicalContextNarrative(result, answers);
  if (medicalNarrative) {
    riskParts.push(medicalNarrative);
  }
  if (patternDisplay.primary && riskParts.length) {
    paragraphs.push(`另外，${riskParts.map(trimSentenceEnding).join('；')}。`);
  }

  const usesEarlyChangeFrame = !patternDisplay.primary && shouldUseEarlyChangeFrame(stage, severity);
  const usesMultiSignalFrame = !patternDisplay.primary && !usesEarlyChangeFrame;

  return {
    title: '你的身体正在经历什么',
    patternLine: patternDisplay.primary
      ? `${patternDisplay.primary.label} ${patternDisplay.primary.stars} · ${patternDisplay.primary.level}`
      : usesMultiSignalFrame
        ? '多线索变化 · 过渡期信号'
        : '变化初期 · 早期信号',
    meaningTitle: patternDisplay.primary || usesMultiSignalFrame ? '了解你的变化' : '现在可以做什么',
    mechanism:
      patternDisplay.primary?.mechanism ??
      (usesMultiSignalFrame
        ? '这说明当前更需要按症状维度分别处理：泌尿生殖、代谢、睡眠情绪等问题可以各自管理，同时结合医生评估判断是否需要进一步检查。'
        : '你的身体正处于变化的起步阶段。现在是了解自己激素基线的好时机——做一次性激素六项和 AMH 检查，可以帮你和医生更好地追踪后续变化。'),
    paragraphs: paragraphs.slice(0, 3),
    severity,
  };
}

function isAtLeastLight(level) {
  return ['轻度', '中度', '重度'].includes(level);
}

function findSeverityDomain(severity, key) {
  return severity.domains.find((domain) => domain.key === key);
}

function makeDailyCard(title, reason, actions, priority = 50) {
  return {
    type: 'daily',
    tone: ACTION_TONE.daily,
    title,
    riskScore: null,
    reason,
    actions,
    priority,
  };
}

function makeLearnMoreCard(title, reason, actions, priority = 50) {
  return {
    type: 'learn_more',
    tone: ACTION_TONE.learn_more,
    title,
    riskScore: null,
    reason,
    actions,
    priority,
  };
}

function buildLearnMoreCards(result, answers = {}) {
  const labs = generateLabRecommendations(result, answers);
  const severity = generateSymptomSeverity(answers);
  const metabolicDomain = findSeverityDomain(severity, 'metabolic');
  const cards = [];
  const sexHormone = labs.find((lab) => lab.key === 'sex_hormones');
  const amh = labs.find((lab) => lab.key === 'amh');
  const thyroid = labs.find((lab) => lab.key === 'thyroid');
  const metabolic = labs.find((lab) => lab.key === 'metabolic');
  const bone = labs.find((lab) => lab.key === 'bone');

  if (sexHormone && amh) {
    cards.push(
      makeLearnMoreCard(
        '激素水平',
        '如果你想更清楚地了解身体正在经历的变化，可以在方便时做一次性激素六项和 AMH 检查。性激素六项反映当前的激素状态，AMH 帮助了解卵巢的储备情况。',
        [
          `${sexHormone.name}：${sexHormone.timing.replace(/。$/u, '')}`,
          `${amh.name}：${amh.timing.replace(/。$/u, '')}`,
        ],
        10,
      ),
    );
  }

  if (thyroid) {
    const thyroidHistory = hasThyroidHistory(answers);
    cards.push(
      makeLearnMoreCard(
        '甲状腺功能',
        thyroidHistory
          ? '你有甲状腺相关病史，围绝经期激素变化可能影响甲状腺功能。下次就诊时可以请医生一并关注甲状腺指标，带上既往检查结果方便对比。'
          : '甲状腺功能变化的症状（疲劳、怕冷或怕热、情绪低落等）和更年期很像，在方便时做一次甲状腺功能检查有助于区分。',
        [`检查项目：${thyroid.name}（${thyroid.items}）`, thyroid.timing.replace(/。$/u, '')],
        thyroidHistory ? 4 : 30,
      ),
    );
  }

  if (metabolic) {
    cards.push(
      makeLearnMoreCard(
        '代谢健康',
        '你的回答中有一些与代谢变化相关的线索。围绝经期雌激素变化可能影响身体对糖的处理方式，在方便时可以查一下代谢相关指标。',
        [`检查项目：${metabolic.items}`, metabolic.timing.replace(/。$/u, '')],
        metabolicDomain?.isEmphasized || result.overlays.insulin >= 50 ? 5 : 20,
      ),
    );
  }

  if (bone) {
    const stage = result.straw_stage?.stage;
    const inferredStage = result.straw_stage?.inferredStage;
    const bonePriority =
      ['stage_late_transition', 'stage_early_postmeno', 'stage_late_postmeno', 'stage_surgical_meno'].includes(stage) ||
      ['stage_early_postmeno', 'stage_late_postmeno'].includes(inferredStage) ||
      (result.age ?? 0) >= 50
        ? 6
        : 25;
    cards.push(
      makeLearnMoreCard(
        '骨骼健康',
        '雌激素减少后骨量流失会加速。了解一下目前的骨密度基线，有助于将来对比变化。',
        [`${bone.name}：${bone.timing.replace(/。$/u, '')}`],
        bonePriority,
      ),
    );
  }

  return cards.sort((left, right) => left.priority - right.priority);
}

function buildSupplementalLearnMoreCards() {
  return [
    makeLearnMoreCard(
      '复查时机',
      '围绝经期的变化常常不是一次检查就能完全说明，结合月经记录和症状变化复查，会更容易看清趋势。',
      ['连续记录 2-3 个月月经、潮热、睡眠和情绪变化', '如果症状明显加重或出现异常出血，提前就诊沟通'],
      80,
    ),
    makeLearnMoreCard(
      '就诊沟通准备',
      '带着结构化信息去看医生，可以减少遗漏，也更方便医生判断是否需要进一步检查或干预。',
      ['就诊前整理最近 3 个月月经日期、出血量和症状变化', '带上既往体检、妇科超声、甲状腺或激素相关检查结果'],
      90,
    ),
  ];
}

function selectLearnMoreCards(allLearnMoreCards) {
  const hormoneCard = allLearnMoreCards.find((card) => card.title === '激素水平');
  const prioritizedCards = hormoneCard
    ? [hormoneCard, ...allLearnMoreCards.filter((card) => card !== hormoneCard)]
    : allLearnMoreCards;
  const cards = dedupeByTitle([...prioritizedCards, ...buildSupplementalLearnMoreCards()]);

  return cards.slice(0, ACTION_CARD_MAX);
}

function buildDailyActionCards(result, answers = {}) {
  const severity = generateSymptomSeverity(answers);
  const cards = [];
  const vasomotor = findSeverityDomain(severity, 'vasomotor');
  const psychological = findSeverityDomain(severity, 'psychological');
  const urogenital = findSeverityDomain(severity, 'urogenital');
  const metabolic = findSeverityDomain(severity, 'metabolic');
  const paresthesia = findSeverityDomain(severity, 'paresthesia');
  const bmiValue = result.bmi?.value;

  if (isAtLeastLight(vasomotor?.level)) {
    cards.push(
      makeDailyCard(
        '应对潮热',
        '潮热是常见的围绝经期症状之一，日常环境和生活节奏会影响它出现的频率。',
        [
          '穿容易穿脱的分层衣物，方便随时调节',
          '留意辛辣食物、酒精、咖啡因和高温环境等常见触发因素',
          '睡前保持卧室凉爽，使用透气面料的床品',
        ],
        vasomotor?.isEmphasized ? 14 : 36,
      ),
    );
  }

  if (isAtLeastLight(psychological?.level)) {
    cards.push(
      makeDailyCard(
        '情绪与心理调适',
        '激素波动会影响情绪调节，这不是你的错，也不是“想太多”。',
        [
          '每天 20-30 分钟中等强度运动，对情绪改善有研究支持',
          '可以试试正念冥想或深呼吸，哪怕每天 5 分钟也有帮助',
          '保持社交联系，和信任的人聊聊你的感受',
        ],
        psychological?.isEmphasized ? 16 : 34,
      ),
    );
  }

  if ((answers[Q.SLEEP] ?? 0) >= 2) {
    cards.push(
      makeDailyCard(
        '改善睡眠',
        '睡眠问题在围绝经期很普遍，和激素变化以及压力恢复都有关系。',
        [
          '尽量固定入睡和起床时间，周末也尽量保持接近',
          '睡前 1 小时减少屏幕使用，用阅读或轻音乐替代',
          '午后减少咖啡因，睡前避免大量饮水',
        ],
        24,
      ),
    );
  }

  if ((paresthesia?.score ?? 0) >= 2) {
    cards.push(
      makeDailyCard(
        '感觉异常',
        '怕冷、怕热或忽冷忽热等温度敏感变化，可能和围绝经期激素波动、睡眠压力状态或甲状腺相关因素共同有关。',
        [
          '记录怕冷、怕热或忽冷忽热出现的时间、环境和持续多久',
          '用分层衣物、透气寝具和室温调节减少突然冷热变化带来的不适',
          '如果同时有心慌、体重明显变化或持续疲劳，下次就诊时可以和医生一并讨论甲状腺功能',
        ],
        12,
      ),
    );
  }

  if (isAtLeastLight(urogenital?.level)) {
    cards.push(
      makeDailyCard(
        '私密健康',
        '干涩、亲密不适或性兴趣变化，常与雌激素下降后的泌尿生殖组织变化有关。',
        [
          '日常可使用不含香精的保湿型私密护理产品',
          '亲密时使用水溶性润滑剂可以改善舒适度',
          '下次妇科就诊时可请医生做妇科评估和泌尿生殖综合征评估，必要时查白带常规或尿常规',
          '如果症状持续困扰你，可以和医生讨论局部雌激素制剂',
        ],
        urogenital?.isEmphasized ? 8 : 28,
      ),
    );
  }

  if ((bmiValue !== null && bmiValue >= 24) || result.overlays.insulin >= 30) {
    cards.push(
      makeDailyCard(
        '体重与代谢',
        '围绝经期代谢节奏会变化，即使饮食和以前一样，体重也可能悄悄增加，尤其是腰腹部。',
        [
          '每餐保证一掌心大小的优质蛋白，有助于维持肌肉量和饱腹感',
          '减少精制碳水和添加糖，用全谷物和蔬菜替代',
          '关注腰围变化，它比体重数字更能反映代谢健康',
        ],
        metabolic?.isEmphasized || result.overlays.insulin >= 50 ? 9 : 30,
      ),
    );
  }

  if (isAtLeastLight(severity.total.level) || (bmiValue !== null && bmiValue >= 24)) {
    cards.push(
      makeDailyCard(
        '运动建议',
        '运动是围绝经期很有研究支持的自我管理方式，对骨密度、代谢、睡眠和情绪都有帮助。',
        [
          '每周累计 150 分钟中等强度有氧运动，例如快走、骑车或游泳',
          '每周 2-3 次力量训练，从小重量或自重训练开始',
          '从你喜欢的方式开始，坚持比强度更重要',
        ],
        40,
      ),
    );
  }

  if ((answers[Q.JOINT_PAIN] ?? 0) >= 2) {
    cards.push(
      makeDailyCard(
        '关节与肌肉',
        '关节僵硬和肌肉酸痛是容易被忽视的围绝经期症状，和雌激素对关节润滑及炎症调节的作用减弱有关。',
        [
          '每天做 10-15 分钟轻柔拉伸或瑜伽',
          '和医生确认钙与维生素 D 是否需要补充',
          '避免久坐，每小时起身活动几分钟',
        ],
        32,
      ),
    );
  }

  return cards.sort((left, right) => left.priority - right.priority);
}

function ensureDailyCards(cards) {
  const fallbackCards = [
    makeDailyCard(
      '日常观察',
      '目前没有特别集中的不适信号，可以先把这次评估作为之后观察身体变化的参照。',
      ['记录月经、睡眠和潮热变化', '保持规律运动和稳定作息', '下次体检时带着报告和医生一起看'],
      80,
    ),
    makeDailyCard(
      '建立基础节律',
      '稳定的作息、饮食和活动节奏，是围绝经期自我管理的基础，也方便你识别哪些变化是真正新增的。',
      ['尽量固定起床和入睡时间', '每天安排一次轻体力活动或散步', '每周回顾一次身体变化记录'],
      90,
    ),
  ];

  return dedupeByTitle([...cards, ...fallbackCards]).slice(0, ACTION_CARD_MAX);
}

export function generateRecommendationCards(result, answers = {}) {
  const allLearnMoreCards = buildLearnMoreCards(result, answers);
  const learnMoreCards = selectLearnMoreCards(allLearnMoreCards);
  const selectedDailyCards = ensureDailyCards(buildDailyActionCards(result, answers));

  if (!selectedDailyCards.length && !learnMoreCards.length) {
    return [
      makeDailyCard(
        '日常观察',
        '目前没有特别集中的风险信号，可以先把这次评估作为之后观察身体变化的参照。',
        ['记录月经、睡眠和潮热变化', '保持规律运动和稳定作息', '下次体检时带着报告和医生一起看'],
      ),
    ];
  }

  return [...selectedDailyCards, ...learnMoreCards];
}
